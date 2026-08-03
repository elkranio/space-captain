// src/engine/encounter/combat/CombatRunner.ts

import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../content/catalogs/ship_weapons';
import { LASER_TARGET_ZONES, type LaserTargetZone } from '../../defs/laser';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponDefinition,
    type LaserWeaponState,
    type SpamProjectorDefinition,
    type SpamProjectorState,
    type ShipWeaponDefinition,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';
import {
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
    SPAM_CHANNEL_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
    type LaserAttackState,
    type SpamChannelOutcome,
    type SpamChannelState,
} from '../model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';
import EncounterStateStore from '../state/EncounterStateStore';
import CombatMissileRunner, {
    type PlayerMissileLaunchInput,
} from './CombatMissileRunner';
import CombatRuntimeIdentityFactory from './CombatRuntimeIdentityFactory';
import CombatStickyMineRunner, {
    type PlayerStickyMineAttachInput,
} from './CombatStickyMineRunner';
import EnemyTaskScheduler from './EnemyTaskScheduler';
import EnemyThreatObserver from './EnemyThreatObserver';

type CombatStepExistingObjectIds = {
    projectileIds: string[];
    stickyMineIds: string[];
};

type CombatRunnerOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    random: () => number;

    interruptRandomOfficerTask: () => void;

    destroyEnemyActor:
        (actorId: string) => void;
};

// Владеет боевым циклом encounter:
//
// - исполняет решения enemy task scheduler;
// - управляет lifecycle установленного оружия;
// - создаёт и двигает projectiles;
// - управляет активными laser attacks;
// - разрешает projectile impacts;
// - эмитит combat events.
//
// Корабли, оружие и угрозы остаются частью EncounterState.
// Статические параметры моделей оружия читаются из content.
export default class CombatRunner {
    private readonly stateStore:
        EncounterStateStore;

    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly random: () => number;

    private readonly interruptRandomOfficerTask: () => void;

    private readonly destroyEnemyActor:
        CombatRunnerOptions[
            'destroyEnemyActor'
        ];

    private readonly enemyTaskScheduler:
        EnemyTaskScheduler;

    private readonly enemyThreatObserver:
        EnemyThreatObserver;

    private readonly identities:
        CombatRuntimeIdentityFactory;

    private readonly missileRunner:
        CombatMissileRunner;

    private readonly stickyMineRunner:
        CombatStickyMineRunner;

    constructor({
        stateStore,
        emit,

        random,

        interruptRandomOfficerTask,
        destroyEnemyActor,
    }: CombatRunnerOptions) {
        this.stateStore =
            stateStore;

        this.state =
            this.stateStore
                .getState();

        this.emit = emit;

        this.random = random;

        this.interruptRandomOfficerTask = interruptRandomOfficerTask;

        this.destroyEnemyActor =
            destroyEnemyActor;

        this.identities =
            new CombatRuntimeIdentityFactory();

        this.missileRunner =
            new CombatMissileRunner({
                stateStore:
                    this.stateStore,

                identities:
                    this.identities,

                emit:
                    this.emit,

                destroyEnemyActor:
                    this.destroyEnemyActor,
            });

        this.stickyMineRunner =
            new CombatStickyMineRunner({
                stateStore:
                    this.stateStore,

                identities:
                    this.identities,

                emit:
                    this.emit,

                interruptRandomOfficerTask:
                    this.interruptRandomOfficerTask,

                destroyEnemyActor:
                    this.destroyEnemyActor,
            });

        this.enemyTaskScheduler =
            new EnemyTaskScheduler({
                state: this.state,
                emit: this.emit,
            });

        this.enemyThreatObserver =
            new EnemyThreatObserver(
                this.state,
            );
    }

    public step(deltaMs: number): void {
        const existingCombatObjectIds =
            this.captureExistingCombatObjectIds();

        this.integratePendingPlayerCombatObjects();
        this.perceivePlayerThreats();

        this.resolveExistingCombatObjects(
            existingCombatObjectIds,
            deltaMs,
        );

        this.perceivePlayerThreats();
        this.decideEnemyWork(deltaMs);
        this.advanceWeapons(deltaMs);
        this.finalizeEnemyCrewTasks();
    }

    private captureExistingCombatObjectIds():
        CombatStepExistingObjectIds {
        // PlayerWeaponRunner уже выполнил физический launch,
        // но новые combat objects пока лежат в очередях.
        // Snapshot содержит только объекты, существовавшие
        // до начала этого combat step.
        return {
            projectileIds:
                this.missileRunner
                    .captureExistingProjectileIds(),

            stickyMineIds:
                this.stickyMineRunner
                    .captureExistingMineIds(),
        };
    }

    private integratePendingPlayerCombatObjects():
        void {
        // Новый launch должен существовать до resolution
        // старых угроз: lethal impact сможет сразу завершить
        // его как TARGET_LOST. При этом новый объект
        // отсутствует в captured IDs и не получает
        // текущий deltaMs.
        this.missileRunner
            .integratePendingPlayerLaunches();
        this.stickyMineRunner
            .integratePendingPlayerAttachments();
    }

    private perceivePlayerThreats(): void {
        this.enemyThreatObserver
            .synchronize();
    }

    private resolveExistingCombatObjects(
        existingIds:
            CombatStepExistingObjectIds,
        deltaMs: number,
    ): void {
        this.missileRunner
            .advanceExistingProjectiles(
            existingIds.projectileIds,
            deltaMs,
        );

        this.stickyMineRunner
            .advanceExistingMines(
            existingIds.stickyMineIds,
            deltaMs,
        );
    }

    private decideEnemyWork(
        deltaMs: number,
    ): void {
        // Scheduler сначала двигает текущие crew tasks
        // и policy timers, затем выбирает и запускает
        // новую работу доступных ролей.
        this.enemyTaskScheduler
            .schedule(deltaMs);
    }

    private finalizeEnemyCrewTasks(): void {
        // Weapon advancement мог освободить оператора.
        this.enemyTaskScheduler
            .synchronizeTasks();
    }

    public purgeSpamChannel(channelId: string): boolean {
        for (const actor of this.state.actors) {
            for (const weapon of actor.weapons) {
                if (
                    weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                    weapon.activeChannelId !== channelId
                ) {
                    continue;
                }

                if (weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING) {
                    throw new Error(
                        `Spam projector has active channel outside channeling phase: ` +
                            `${actor.id}/${weapon.id}/${channelId}/${weapon.phase}`,
                    );
                }

                const channel = this.createSpamChannelSnapshot(
                    actor,
                    weapon,
                );

                this.endSpamChannel(
                    weapon,
                    channel,
                    SPAM_CHANNEL_OUTCOME.PURGED,
                );

                this.enemyTaskScheduler
                    .synchronizeTasks();

                return true;
            }
        }

        return false;
    }

    public queuePlayerMissileLaunch(
        input: PlayerMissileLaunchInput,
    ): void {
        this.missileRunner
            .queuePlayerLaunch(input);
    }

    public queuePlayerStickyMineAttach(
        input: PlayerStickyMineAttachInput,
    ): void {
        this.stickyMineRunner
            .queuePlayerAttach(input);
    }

    public clearStickyMine(mineId: string): boolean {
        return this.stickyMineRunner
            .clearMine(mineId);
    }

    public removePlayerCombatObjectsTargetingActor(
        actorId: string,
    ): void {
        this.missileRunner
            .removePlayerMissilesTargetingActor(
                actorId,
            );

        this.stickyMineRunner
            .removePlayerMinesTargetingActor(
                actorId,
            );
    }

    // #region Weapon lifecycle

    private advanceWeapons(deltaMs: number): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                continue;
            }

            for (const weapon of actor.weapons) {
                if (
                    weapon.kind ===
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER
                ) {
                    this.stickyMineRunner
                        .advanceEnemyDispenser(
                            actor,
                            weapon,
                            deltaMs,
                        );

                    continue;
                }

                switch (weapon.phase) {
                    case SHIP_WEAPON_PHASE.READY:
                        break;

                    case SHIP_WEAPON_PHASE.TARGETING:
                        this.advanceWeaponTargeting(actor, weapon, deltaMs);
                        break;

                    case SHIP_WEAPON_PHASE.CHARGING:
                        this.advanceWeaponCharging(actor, weapon, deltaMs);
                        break;

                    case SHIP_WEAPON_PHASE.CHANNELING:
                        this.advanceWeaponChanneling(actor, weapon, deltaMs);
                        break;

                    case SHIP_WEAPON_PHASE.DISPENSING:
                        throw new Error(
                            `Only sticky-mine dispenser can enter dispensing phase: ` +
                                `${actor.id}/${weapon.id}/${weapon.kind}`,
                        );

                    case SHIP_WEAPON_PHASE.COOLDOWN:
                        this.advanceWeaponCooldown(weapon, deltaMs);
                        break;
                }
            }
        }
    }

    private advanceWeaponTargeting(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            weapon.phaseElapsedMs + deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            weapon.phaseElapsedMs = elapsedMs;
            return;
        }

        weapon.phaseElapsedMs =
            SHIP_WEAPON_TARGETING_DURATION_MS;

        this.completeWeaponTargeting(
            actor,
            weapon,
        );
    }

    private completeWeaponTargeting(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
    ): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                this.missileRunner
                    .launchEnemyMissile(
                        actor,
                        weapon,
                    );
                return;

            case SHIP_WEAPON_KIND.LASER:
                this.startLaserCharging(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                this.startSpamChannel(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                throw new Error(
                    `Sticky-mine dispenser targeting must be advanced by its runner: ` +
                        `${actor.id}/${weapon.id}`,
                );
        }
    }

    private advanceWeaponCharging(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
        deltaMs: number,
    ): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                throw new Error(`Missile launcher cannot enter charging phase: ` + `${actor.id}/${weapon.id}`);

            case SHIP_WEAPON_KIND.LASER:
                this.advanceLaserCharging(actor, weapon, deltaMs);
                return;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                throw new Error(
                    `Spam projector cannot enter charging phase: ` +
                        `${actor.id}/${weapon.id}`,
                );

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                throw new Error(
                    `Sticky-mine dispenser cannot enter charging phase: ` +
                        `${actor.id}/${weapon.id}`,
                );
        }
    }

    private advanceWeaponChanneling(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
        deltaMs: number,
    ): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                throw new Error(
                    `Missile launcher cannot enter channeling phase: ` +
                        `${actor.id}/${weapon.id}`,
                );

            case SHIP_WEAPON_KIND.LASER:
                throw new Error(
                    `Laser cannot enter channeling phase: ` +
                        `${actor.id}/${weapon.id}`,
                );

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                this.advanceSpamChanneling(actor, weapon, deltaMs);
                return;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                throw new Error(
                    `Sticky-mine dispenser cannot enter channeling phase: ` +
                        `${actor.id}/${weapon.id}`,
                );
        }
    }

    private advanceWeaponCooldown(weapon: ShipWeaponState, deltaMs: number): void {
        const definition = this.getWeaponDefinition(weapon);

        weapon.phaseElapsedMs += deltaMs;

        if (weapon.phaseElapsedMs < definition.cooldownDurationMs) {
            return;
        }

        weapon.phase = SHIP_WEAPON_PHASE.READY;
        weapon.phaseElapsedMs = 0;
    }

    private getWeaponDefinition(weapon: ShipWeaponState): ShipWeaponDefinition {
        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== weapon.kind) {
            throw new Error(`Ship weapon kind does not match definition: ` + `${weapon.id}/${weapon.weaponId}`);
        }

        return definition;
    }

    private getLaserDefinition(laser: LaserWeaponState): LaserWeaponDefinition {
        const definition = SHIP_WEAPONS[laser.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
            throw new Error(`Laser weapon kind does not match definition: ` + `${laser.id}/${laser.weaponId}`);
        }

        return definition;
    }

    private getSpamProjectorDefinition(
        projector: SpamProjectorState,
    ): SpamProjectorDefinition {
        const definition = SHIP_WEAPONS[projector.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error(
                `Spam projector kind does not match definition: ` +
                    `${projector.id}/${projector.weaponId}`,
            );
        }

        return definition;
    }

    // #endregion

    // #region Laser

    private startLaserCharging(actor: ShipEncounterActorState, laser: LaserWeaponState): void {
        const attack = this.createLaserAttack(actor, laser);

        laser.phase = SHIP_WEAPON_PHASE.CHARGING;
        laser.phaseElapsedMs = 0;

        this.emit({
            type: ENCOUNTER_EVENT.LASER_ATTACK_STARTED,

            attack,
        });
    }

    private advanceLaserCharging(
        actor: ShipEncounterActorState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const definition = this.getLaserDefinition(laser);

        laser.phaseElapsedMs += deltaMs;

        if (laser.phaseElapsedMs < definition.chargeDurationMs) {
            return;
        }

        this.fireLaser(actor, laser);
    }

    private createLaserAttack(actor: ShipEncounterActorState, laser: LaserWeaponState): LaserAttackState {
        const existingAttack = this.state.combat.laserAttacks.find((attack) => {
            return attack.sourceActorId === actor.id && attack.sourceWeaponId === laser.id;
        });

        if (existingAttack) {
            throw new Error(`Laser weapon already has active attack: ` + `${actor.id}/${laser.id}/${existingAttack.id}`);
        }

        const attack: LaserAttackState = {
            id:
                this.identities
                    .createLaserAttackId(),

            designation:
                this.identities
                    .createThreatDesignation(
                        'L',
                    ),

            sourceActorId: actor.id,
            sourceWeaponId: laser.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

            targetZone: this.selectLaserTargetZone(),

            identification: {
                status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
            },
        };

        this.state.combat.laserAttacks.push(attack);

        return attack;
    }

    private fireLaser(actor: ShipEncounterActorState, laser: LaserWeaponState): void {
        const attackIndex = this.state.combat.laserAttacks.findIndex((attack) => {
            return attack.sourceActorId === actor.id && attack.sourceWeaponId === laser.id;
        });

        if (attackIndex < 0) {
            throw new Error(`Cannot fire laser without active attack: ` + `${actor.id}/${laser.id}`);
        }

        const attack = this.state.combat.laserAttacks[attackIndex];

        if (!attack) {
            throw new Error(`Laser attack disappeared before fire: ` + `${actor.id}/${laser.id}`);
        }

        const definition = this.getLaserDefinition(laser);

        this.state.combat.laserAttacks.splice(attackIndex, 1);

        laser.phase = SHIP_WEAPON_PHASE.COOLDOWN;
        laser.phaseElapsedMs = 0;

        if (this.consumeMatchingShield(attack)) {
            this.emit({
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack,

                outcome: LASER_SHOT_OUTCOME.BLOCKED,
            });

            return;
        }

        const damageResult =
            this.stateStore
                .damagePlayerHull(
                    definition.damage,
                );

        this.emit({
            type: ENCOUNTER_EVENT.LASER_FIRED,

            attack,

            outcome: LASER_SHOT_OUTCOME.HIT,

            ...damageResult,
        });

        this.interruptRandomOfficerTask();
    }

    private consumeMatchingShield(attack: LaserAttackState): boolean {
        const activeShield = this.state.combat.activeShield;

        if (activeShield?.zone !== attack.targetZone) {
            return false;
        }

        delete this.state.combat.activeShield;

        return true;
    }

    private selectLaserTargetZone(): LaserTargetZone {
        const randomValue = this.random();

        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
            throw new Error(`Combat random source must return a value in [0, 1): ${randomValue}`);
        }

        const index = Math.floor(randomValue * LASER_TARGET_ZONES.length);
        const targetZone = LASER_TARGET_ZONES[index];

        if (!targetZone) {
            throw new Error(`Cannot select laser target zone for random value: ${randomValue}`);
        }

        return targetZone;
    }

    // #endregion

    // #region Spam projector


    private startSpamChannel(
        actor: ShipEncounterActorState,
        projector: SpamProjectorState,
    ): void {
        if (projector.activeChannelId !== null) {
            throw new Error(
                `Spam projector already has active channel: ` +
                    `${actor.id}/${projector.id}/${projector.activeChannelId}`,
            );
        }

        projector.phase = SHIP_WEAPON_PHASE.CHANNELING;
        projector.phaseElapsedMs = 0;
        projector.activeChannelId =
            this.identities
                .createSpamChannelId();

        this.emit({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,

            channel: this.createSpamChannelSnapshot(actor, projector),
        });
    }

    private advanceSpamChanneling(
        actor: ShipEncounterActorState,
        projector: SpamProjectorState,
        deltaMs: number,
    ): void {
        const definition = this.getSpamProjectorDefinition(projector);

        projector.phaseElapsedMs += deltaMs;

        if (projector.phaseElapsedMs < definition.channelDurationMs) {
            return;
        }

        const channel = this.createSpamChannelSnapshot(actor, projector);

        this.endSpamChannel(
            projector,
            channel,
            SPAM_CHANNEL_OUTCOME.EXPIRED,
        );
    }

    private endSpamChannel(
        projector: SpamProjectorState,
        channel: SpamChannelState,
        outcome: SpamChannelOutcome,
    ): void {
        projector.activeChannelId = null;
        projector.phase = SHIP_WEAPON_PHASE.COOLDOWN;
        projector.phaseElapsedMs = 0;

        this.emit({
            type: ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED,

            channel,
            outcome,
        });
    }

    private createSpamChannelSnapshot(
        actor: ShipEncounterActorState,
        projector: SpamProjectorState,
    ): SpamChannelState {
        const channelId = projector.activeChannelId;

        if (!channelId) {
            throw new Error(
                `Spam projector channel id is missing: ` +
                    `${actor.id}/${projector.id}/${projector.phase}`,
            );
        }

        const definition = this.getSpamProjectorDefinition(projector);

        return {
            id: channelId,

            sourceActorId: actor.id,
            sourceWeaponId: projector.id,

            elapsedMs: Math.min(
                projector.phaseElapsedMs,
                definition.channelDurationMs,
            ),
            durationMs: definition.channelDurationMs,
        };
    }

    // #endregion

}
