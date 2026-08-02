// src/engine/encounter/combat/CombatRunner.ts

import { MISSILES } from '../../content/catalogs/missiles';
import { STICKY_MINES } from '../../content/catalogs/sticky_mines';
import {
    ENCOUNTER_TEAM,
} from '../../defs/encounter_team';
import type {
    MissileId,
} from '../../defs/missile';
import type {
    StickyMineId,
} from '../../defs/sticky_mine';
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
    type MissileLauncherState,
    type SpamProjectorDefinition,
    type SpamProjectorState,
    type StickyMineDispenserDefinition,
    type StickyMineDispenserState,
    type ShipWeaponDefinition,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
    PLAYER_MISSILE_OUTCOME,
    PLAYER_STICKY_MINE_OUTCOME,
    SPAM_CHANNEL_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
    type LaserAttackState,
    type MissileCombatProjectileState,
    type SpamChannelOutcome,
    type SpamChannelState,
    type StickyMineState,
} from '../model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';
import EnemyTaskScheduler from './EnemyTaskScheduler';

type PlayerMissileLaunchInput = {
    sourceWeaponId: string;
    missileId: MissileId;
    targetActorId: string;
};

type PlayerStickyMineAttachInput = {
    sourceWeaponId: string;
    mineId: StickyMineId;
    targetActorId: string;
    ageMs: number;
};

type CombatRunnerOptions = {
    state: EncounterState;
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

    private readonly pendingPlayerMissileLaunches:
        PlayerMissileLaunchInput[] = [];

    // PlayerWeaponRunner добавляет outgoing mines
    // до CombatRunner.step. Их age уже учтён
    // относительно текущего deltaMs.
    private readonly freshStickyMineIds =
        new Set<string>();

    private nextProjectileId = 1;
    private nextLaserAttackId = 1;
    private nextSpamChannelId = 1;
    private nextStickyMineId = 1;

    // Общая последовательность коротких обозначений угроз:
    // M1, L2, M3, L4.
    private nextThreatDesignationNumber = 1;

    constructor({
        state,
        emit,

        random,

        interruptRandomOfficerTask,
        destroyEnemyActor,
    }: CombatRunnerOptions) {
        this.state = state;
        this.emit = emit;

        this.random = random;

        this.interruptRandomOfficerTask = interruptRandomOfficerTask;

        this.destroyEnemyActor =
            destroyEnemyActor;

        this.enemyTaskScheduler =
            new EnemyTaskScheduler({
                state: this.state,
                emit: this.emit,
            });
    }

    public step(deltaMs: number): void {
        // Существующие угрозы двигаются до оружия,
        // чтобы созданная в этом step угроза
        // не получила тот же deltaMs повторно.
        this.advanceProjectiles(deltaMs);
        this.advanceStickyMines(deltaMs);

        // PlayerWeaponRunner работает раньше CombatRunner.
        // Flush после advance не даёт новой ракете
        // получить тот же deltaMs в момент запуска.
        this.flushPlayerMissileLaunches();

        this.enemyTaskScheduler.schedule(deltaMs);
        this.advanceWeapons(deltaMs);
        this.enemyTaskScheduler
            .synchronizeTasks();
    }

    public getSpamChannels(): SpamChannelState[] {
        const channels: SpamChannelState[] = [];

        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                continue;
            }

            for (const weapon of actor.weapons) {
                if (
                    weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                    weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING
                ) {
                    continue;
                }

                channels.push(
                    this.createSpamChannelSnapshot(actor, weapon),
                );
            }
        }

        return channels;
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
        this.pendingPlayerMissileLaunches.push({
            ...input,
        });
    }

    public attachPlayerStickyMine(
        input: PlayerStickyMineAttachInput,
    ): void {
        if (
            !Number.isFinite(input.ageMs) ||
            input.ageMs < 0
        ) {
            throw new Error(
                'Invalid player sticky-mine age: ' +
                    String(input.ageMs),
            );
        }

        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        input.targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            throw new Error(
                'Cannot attach player sticky mine to invalid target: ' +
                    input.sourceWeaponId +
                    '/' +
                    input.targetActorId,
            );
        }

        const mineDefinition =
            STICKY_MINES[
                input.mineId
            ];

        const mine: StickyMineState = {
            id:
                this.createStickyMineId(),

            mineId:
                input.mineId,

            source: {
                kind:
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP,
            },

            sourceWeaponId:
                input.sourceWeaponId,

            target: {
                kind:
                    COMBAT_TARGET_KIND.ACTOR,

                actorId:
                    input.targetActorId,
            },

            timeToDetonationMs:
                Math.max(
                    0,
                    mineDefinition
                        .fuseDurationMs -
                        input.ageMs,
                ),

            initialTimeToDetonationMs:
                mineDefinition
                    .fuseDurationMs,

            damage:
                mineDefinition.damage,
        };

        this.state.combat.stickyMines.push(
            mine,
        );

        this.freshStickyMineIds.add(
            mine.id,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_ATTACHED,

            mine:
                this.cloneStickyMine(
                    mine,
                ),
        });
    }

    public clearStickyMine(mineId: string): boolean {
        const mineIndex =
            this.state.combat.stickyMines.findIndex((mine) => {
                return (
                    mine.id === mineId &&
                    mine.target.kind ===
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP
                );
            });

        if (mineIndex < 0) {
            return false;
        }

        this.state.combat.stickyMines.splice(
            mineIndex,
            1,
        );

        return true;
    }

    // #region Weapon lifecycle

    private advanceWeapons(deltaMs: number): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                continue;
            }

            for (const weapon of actor.weapons) {
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
                        this.advanceWeaponDispensing(actor, weapon, deltaMs);
                        break;

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

        const targetingOverflowMs =
            elapsedMs -
            SHIP_WEAPON_TARGETING_DURATION_MS;

        weapon.phaseElapsedMs =
            SHIP_WEAPON_TARGETING_DURATION_MS;

        this.completeWeaponTargeting(
            actor,
            weapon,
            targetingOverflowMs,
        );
    }

    private completeWeaponTargeting(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
        targetingOverflowMs: number,
    ): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                this.launchMissile(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.LASER:
                this.startLaserCharging(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                this.startSpamChannel(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                this.startStickyMineDispensing(
                    actor,
                    weapon,
                    targetingOverflowMs,
                );
                return;
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

    private advanceWeaponDispensing(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
        deltaMs: number,
    ): void {
        if (
            weapon.kind !==
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                `Only sticky-mine dispenser can enter dispensing phase: ` +
                    `${actor.id}/${weapon.id}/${weapon.kind}`,
            );
        }

        this.advanceStickyMineDispensing(
            actor,
            weapon,
            deltaMs,
        );
    }

    private advanceWeaponCooldown(weapon: ShipWeaponState, deltaMs: number): void {
        const definition = this.getWeaponDefinition(weapon);

        weapon.phaseElapsedMs += deltaMs;

        if (weapon.phaseElapsedMs < definition.cooldownDurationMs) {
            return;
        }

        weapon.phase = SHIP_WEAPON_PHASE.READY;
        weapon.phaseElapsedMs = 0;

        if (
            weapon.kind ===
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            weapon.dispensedMineCount = 0;
        }
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

    private getStickyMineDispenserDefinition(
        dispenser: StickyMineDispenserState,
    ): StickyMineDispenserDefinition {
        const definition =
            SHIP_WEAPONS[dispenser.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                `Sticky-mine dispenser kind does not match definition: ` +
                    `${dispenser.id}/${dispenser.weaponId}`,
            );
        }

        return definition;
    }

    // #endregion

    // #region Missile launcher

    private flushPlayerMissileLaunches(): void {
        const launches =
            this.pendingPlayerMissileLaunches
                .splice(0);

        for (const launch of launches) {
            this.createPlayerMissileProjectile(
                launch,
            );
        }
    }

    private createPlayerMissileProjectile(
        launch: PlayerMissileLaunchInput,
    ): void {
        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        launch.targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            throw new Error(
                'Cannot launch player missile ' +
                    'at invalid target: ' +
                    `${launch.sourceWeaponId}/` +
                    `${launch.targetActorId}`,
            );
        }

        const missile =
            MISSILES[launch.missileId];

        const projectile:
            MissileCombatProjectileState = {
                id:
                    this.createProjectileId(),

                designation:
                    this.createThreatDesignation(
                        'M',
                    ),

                kind:
                    COMBAT_PROJECTILE_KIND
                        .MISSILE,

                source: {
                    kind:
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP,
                },

                sourceWeaponId:
                    launch.sourceWeaponId,

                target: {
                    kind:
                        COMBAT_TARGET_KIND.ACTOR,

                    actorId:
                        launch.targetActorId,
                },

                // Собственная ракета известна игроку.
                // Threat queries всё равно фильтруют
                // только actor -> player угрозы.
                identification: {
                    status:
                        THREAT_IDENTIFICATION_STATUS
                            .IDENTIFIED,

                    spectralBand:
                        missile.spectralBand,
                },

                missileId:
                    launch.missileId,

                timeToImpactMs:
                    missile.flightDurationMs,

                initialTimeToImpactMs:
                    missile.flightDurationMs,
            };

        this.state.combat.projectiles.push(
            projectile,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_LAUNCHED,

            projectile:
                this.cloneMissileProjectile(
                    projectile,
                ),
        });
    }

    private launchMissile(actor: ShipEncounterActorState, launcher: MissileLauncherState): void {
        const missileId = launcher.loadedMissileId;

        if (!missileId || launcher.ammoCount <= 0) {
            throw new Error(`Cannot launch missile from empty launcher: ` + `${actor.id}/${launcher.id}`);
        }

        const missile = MISSILES[missileId];

        launcher.ammoCount -= 1;
        launcher.phase = SHIP_WEAPON_PHASE.COOLDOWN;
        launcher.phaseElapsedMs = 0;

        const projectile: MissileCombatProjectileState = {
            id: this.createProjectileId(),
            designation: this.createThreatDesignation('M'),

            kind: COMBAT_PROJECTILE_KIND.MISSILE,

            source: {
                kind: COMBAT_SOURCE_KIND.ACTOR,
                actorId: actor.id,
            },

            sourceWeaponId: launcher.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

            identification: {
                status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
            },

            missileId,

            timeToImpactMs: missile.flightDurationMs,
            initialTimeToImpactMs: missile.flightDurationMs,
        };

        this.state.combat.projectiles.push(projectile);

        this.emit({
            type: ENCOUNTER_EVENT.MISSILE_LAUNCHED,

            projectile: {
                ...projectile,
            },
        });
    }

    // #endregion

    // #region Laser

    private startLaserCharging(actor: ShipEncounterActorState, laser: LaserWeaponState): void {
        const attack = this.createLaserAttack(actor, laser);

        laser.phase = SHIP_WEAPON_PHASE.CHARGING;
        laser.phaseElapsedMs = 0;

        this.emit({
            type: ENCOUNTER_EVENT.LASER_ATTACK_STARTED,

            attack: this.cloneLaserAttack(attack),
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
            id: this.createLaserAttackId(),
            designation: this.createThreatDesignation('L'),

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

        const attackSnapshot = this.cloneLaserAttack(attack);
        const definition = this.getLaserDefinition(laser);

        this.state.combat.laserAttacks.splice(attackIndex, 1);

        laser.phase = SHIP_WEAPON_PHASE.COOLDOWN;
        laser.phaseElapsedMs = 0;

        if (this.consumeMatchingShield(attack)) {
            this.emit({
                type: ENCOUNTER_EVENT.LASER_FIRED,

                attack: attackSnapshot,

                outcome: LASER_SHOT_OUTCOME.BLOCKED,
            });

            return;
        }

        this.emit({
            type: ENCOUNTER_EVENT.LASER_FIRED,

            attack: attackSnapshot,

            outcome: LASER_SHOT_OUTCOME.HIT,
            damage: definition.damage,
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

    private cloneLaserAttack(attack: LaserAttackState): LaserAttackState {
        return {
            ...attack,

            target: {
                ...attack.target,
            },

            identification: {
                ...attack.identification,
            },
        };
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
        projector.activeChannelId = this.createSpamChannelId();

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

    // #region Sticky mines

    private startStickyMineDispensing(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
        targetingOverflowMs: number,
    ): void {
        dispenser.phase =
            SHIP_WEAPON_PHASE.DISPENSING;
        dispenser.phaseElapsedMs = 0;
        dispenser.dispensedMineCount = 0;

        this.attachStickyMine(
            actor,
            dispenser,
            targetingOverflowMs,
        );

        this.advanceStickyMineDispensing(
            actor,
            dispenser,
            targetingOverflowMs,
        );
    }

    private advanceStickyMineDispensing(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
        deltaMs: number,
    ): void {
        const definition =
            this.getStickyMineDispenserDefinition(
                dispenser,
            );

        dispenser.phaseElapsedMs += deltaMs;

        while (
            dispenser.dispensedMineCount <
                definition.salvoSize &&
            dispenser.ammoCount > 0 &&
            dispenser.phaseElapsedMs >=
                definition.launchIntervalMs
        ) {
            dispenser.phaseElapsedMs -=
                definition.launchIntervalMs;

            this.attachStickyMine(
                actor,
                dispenser,
                dispenser.phaseElapsedMs,
            );
        }

        if (
            dispenser.dispensedMineCount <
                definition.salvoSize &&
            dispenser.ammoCount > 0
        ) {
            return;
        }

        const cooldownElapsedMs =
            dispenser.phaseElapsedMs;

        dispenser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        dispenser.phaseElapsedMs = 0;

        this.advanceWeaponCooldown(
            dispenser,
            cooldownElapsedMs,
        );
    }

    private attachStickyMine(
        actor: ShipEncounterActorState,
        dispenser: StickyMineDispenserState,
        ageMs: number,
    ): void {
        const definition =
            this.getStickyMineDispenserDefinition(
                dispenser,
            );

        if (
            dispenser.dispensedMineCount >=
            definition.salvoSize
        ) {
            throw new Error(
                `Cannot exceed sticky-mine salvo size: ` +
                    `${actor.id}/${dispenser.id}/${definition.salvoSize}`,
            );
        }

        const mineId =
            dispenser.loadedMineId;

        if (
            !mineId ||
            dispenser.ammoCount <= 0
        ) {
            throw new Error(
                `Cannot launch sticky mine from empty dispenser: ` +
                    `${actor.id}/${dispenser.id}`,
            );
        }

        const mineDefinition =
            STICKY_MINES[mineId];

        const mine: StickyMineState = {
            id: this.createStickyMineId(),

            mineId,

            source: {
                kind:
                    COMBAT_SOURCE_KIND.ACTOR,

                actorId: actor.id,
            },

            sourceWeaponId: dispenser.id,

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .PLAYER_SHIP,
            },

            timeToDetonationMs: Math.max(
                0,
                mineDefinition.fuseDurationMs -
                    ageMs,
            ),
            initialTimeToDetonationMs:
                mineDefinition.fuseDurationMs,

            damage: mineDefinition.damage,
        };

        dispenser.ammoCount -= 1;
        dispenser.dispensedMineCount += 1;

        this.state.combat.stickyMines.push(
            mine,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .STICKY_MINE_ATTACHED,

            mine: {
                ...mine,

                source: {
                    ...mine.source,
                },

                target: {
                    ...mine.target,
                },
            },
        });

        if (mine.timeToDetonationMs > 0) {
            return;
        }

        this.resolveStickyMineDetonation(
            this.state.combat.stickyMines.length -
                1,
            mine,
        );
    }

    private advanceStickyMines(
        deltaMs: number,
    ): void {
        let index = 0;

        while (
            index <
            this.state.combat.stickyMines.length
        ) {
            const mine =
                this.state.combat
                    .stickyMines[index];

            if (
                mine.target.kind ===
                COMBAT_TARGET_KIND.ACTOR
            ) {
                const targetActorId =
                    mine.target.actorId;

                const target =
                    this.state.actors.find(
                        (actor) => {
                            return (
                                actor.id ===
                                targetActorId
                            );
                        },
                    );

                if (
                    !target ||
                    target.team !==
                        ENCOUNTER_TEAM.ENEMY ||
                    target.hull <= 0
                ) {
                    this.resolvePlayerStickyMineTargetLost(
                        index,
                        mine,
                    );

                    continue;
                }
            }

            const isFresh =
                this.freshStickyMineIds
                    .delete(mine.id);

            if (!isFresh) {
                mine.timeToDetonationMs =
                    Math.max(
                        0,
                        mine.timeToDetonationMs -
                            deltaMs,
                    );
            }

            if (
                mine.timeToDetonationMs > 0
            ) {
                index += 1;
                continue;
            }

            this.resolveStickyMineDetonation(
                index,
                mine,
            );
        }
    }

    private resolveStickyMineDetonation(
        index: number,
        mine: StickyMineState,
    ): void {
        const mineSnapshot:
            StickyMineState = {
                ...mine,

                source: {
                    ...mine.source,
                },

                target: {
                    ...mine.target,
                },

                timeToDetonationMs: 0,
            };

        this.freshStickyMineIds.delete(
            mine.id,
        );

        this.state.combat.stickyMines.splice(
            index,
            1,
        );

        if (
            mine.source.kind ===
                COMBAT_SOURCE_KIND.ACTOR &&
            mine.target.kind ===
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP
        ) {
            this.emit({
                type:
                    ENCOUNTER_EVENT
                        .STICKY_MINE_DETONATED,

                mine:
                    mineSnapshot,

                damage:
                    mine.damage,
            });

            this.interruptRandomOfficerTask();
            return;
        }

        if (
            mine.source.kind ===
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP &&
            mine.target.kind ===
                COMBAT_TARGET_KIND.ACTOR
        ) {
            this.resolvePlayerStickyMineImpact(
                mineSnapshot,
                mine.target.actorId,
            );
            return;
        }

        throw new Error(
            'Unsupported sticky-mine detonation route: ' +
                mine.id +
                '/' +
                mine.source.kind +
                '/' +
                mine.target.kind,
        );
    }

    private resolvePlayerStickyMineImpact(
        mine: StickyMineState,
        targetActorId: string,
    ): void {
        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            return;
        }

        const appliedDamage =
            Math.min(
                mine.damage,
                target.hull,
            );

        target.hull = Math.max(
            0,
            target.hull -
                appliedDamage,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_RESOLVED,

            mine:
                this.cloneStickyMine(
                    mine,
                ),

            outcome:
                PLAYER_STICKY_MINE_OUTCOME
                    .DETONATED,

            damage:
                appliedDamage,

            remainingHull:
                target.hull,
        });

        if (
            appliedDamage <= 0 ||
            target.hull > 0
        ) {
            return;
        }

        this.removeStickyMinesTargetingActor(
            target.id,
        );

        this.destroyEnemyActor(
            target.id,
        );
    }

    private resolvePlayerStickyMineTargetLost(
        index: number,
        mine: StickyMineState,
    ): void {
        if (
            mine.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            mine.target.kind !==
                COMBAT_TARGET_KIND.ACTOR
        ) {
            throw new Error(
                'Cannot resolve player sticky-mine target loss for route: ' +
                    mine.id +
                    '/' +
                    mine.source.kind +
                    '/' +
                    mine.target.kind,
            );
        }

        const mineSnapshot =
            this.cloneStickyMine(
                mine,
            );

        this.freshStickyMineIds.delete(
            mine.id,
        );

        this.state.combat
            .stickyMines.splice(
                index,
                1,
            );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_STICKY_MINE_RESOLVED,

            mine:
                mineSnapshot,

            outcome:
                PLAYER_STICKY_MINE_OUTCOME
                    .TARGET_LOST,
        });
    }

    private removeStickyMinesTargetingActor(
        actorId: string,
    ): void {
        for (
            let index =
                this.state.combat
                    .stickyMines.length - 1;

            index >= 0;

            index -= 1
        ) {
            const mine =
                this.state.combat
                    .stickyMines[index];

            if (
                mine.target.kind !==
                    COMBAT_TARGET_KIND.ACTOR ||
                mine.target.actorId !==
                    actorId
            ) {
                continue;
            }

            this.resolvePlayerStickyMineTargetLost(
                index,
                mine,
            );
        }
    }

    private cloneStickyMine(
        mine: StickyMineState,
    ): StickyMineState {
        return {
            ...mine,

            source: {
                ...mine.source,
            },

            target: {
                ...mine.target,
            },
        };
    }

    // #endregion

    // #region Projectiles

    private advanceProjectiles(
        deltaMs: number,
    ): void {
        // Идём с конца, потому что impacted
        // и target-lost projectiles удаляются
        // из массива во время обхода.
        for (
            let index =
                this.state.combat
                    .projectiles.length - 1;

            index >= 0;

            index -= 1
        ) {
            const projectile =
                this.state.combat
                    .projectiles[index];

            if (
                projectile.target.kind ===
                COMBAT_TARGET_KIND.PLAYER_SHIP
            ) {
                this.advanceIncomingMissile(
                    index,
                    projectile,
                    deltaMs,
                );

                continue;
            }

            this.advancePlayerMissile(
                index,
                projectile,
                projectile.target.actorId,
                deltaMs,
            );
        }
    }

    private advanceIncomingMissile(
        index: number,
        projectile:
            MissileCombatProjectileState,
        deltaMs: number,
    ): void {
        projectile.timeToImpactMs =
            Math.max(
                0,
                projectile.timeToImpactMs -
                    deltaMs,
            );

        if (
            projectile.timeToImpactMs >
            0
        ) {
            return;
        }

        this.resolveMissileImpactOnPlayerShip(
            index,
            projectile,
        );
    }

    private advancePlayerMissile(
        index: number,
        projectile:
            MissileCombatProjectileState,
        targetActorId: string,
        deltaMs: number,
    ): void {
        if (
            projectile.source.kind !==
            COMBAT_SOURCE_KIND.PLAYER_SHIP
        ) {
            throw new Error(
                'Actor-target missile has ' +
                    'unsupported source: ' +
                    `${projectile.id}/` +
                    `${projectile.source.kind}`,
            );
        }

        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            // После launch ракета живёт независимо,
            // но без валидной цели просто исчезает.
            this.state.combat
                .projectiles.splice(
                    index,
                    1,
                );

            this.emit({
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_MISSILE_RESOLVED,

                projectile:
                    this.cloneMissileProjectile(
                        projectile,
                    ),

                outcome:
                    PLAYER_MISSILE_OUTCOME
                        .TARGET_LOST,
            });

            return;
        }

        projectile.timeToImpactMs =
            Math.max(
                0,
                projectile.timeToImpactMs -
                    deltaMs,
            );

        if (
            projectile.timeToImpactMs >
            0
        ) {
            return;
        }

        this.resolvePlayerMissileImpact(
            index,
            projectile,
            target,
        );
    }

    private resolveMissileImpactOnPlayerShip(
        index: number,
        projectile:
            MissileCombatProjectileState,
    ): void {
        if (
            projectile.target.kind !==
            COMBAT_TARGET_KIND.PLAYER_SHIP
        ) {
            throw new Error(
                'Cannot resolve incoming missile ' +
                    'impact for target: ' +
                    `${projectile.id}/` +
                    `${projectile.target.kind}`,
            );
        }

        const missile =
            MISSILES[projectile.missileId];

        const projectileSnapshot:
            MissileCombatProjectileState = {
                ...projectile,

                timeToImpactMs: 0,
            };

        this.state.combat.projectiles.splice(
            index,
            1,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .MISSILE_IMPACTED_PLAYER_SHIP,

            projectile:
                projectileSnapshot,

            damage:
                missile.damage,
        });
    }

    private resolvePlayerMissileImpact(
        index: number,
        projectile:
            MissileCombatProjectileState,
        target:
            ShipEncounterActorState,
    ): void {
        const missile =
            MISSILES[projectile.missileId];

        projectile.timeToImpactMs = 0;

        this.state.combat.projectiles.splice(
            index,
            1,
        );

        const appliedDamage =
            Math.min(
                missile.damage,
                target.hull,
            );

        target.hull = Math.max(
            0,
            target.hull -
                appliedDamage,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile:
                this.cloneMissileProjectile(
                    projectile,
                ),

            outcome:
                PLAYER_MISSILE_OUTCOME.HIT,

            damage:
                appliedDamage,

            remainingHull:
                target.hull,
        });

        if (
            appliedDamage > 0 &&
            target.hull === 0
        ) {
            this.destroyEnemyActor(
                target.id,
            );
        }
    }

    private cloneMissileProjectile(
        projectile:
            MissileCombatProjectileState,
    ): MissileCombatProjectileState {
        return {
            ...projectile,

            source: {
                ...projectile.source,
            },

            target: {
                ...projectile.target,
            },

            identification: {
                ...projectile.identification,
            },
        };
    }

    // #endregion

    // #region Runtime identities

    private createProjectileId(): string {
        const id = `projectile_${this.nextProjectileId}`;

        this.nextProjectileId += 1;

        return id;
    }

    private createLaserAttackId(): string {
        const id = `laser_attack_${this.nextLaserAttackId}`;

        this.nextLaserAttackId += 1;

        return id;
    }

    private createSpamChannelId(): string {
        const id = `spam_channel_${this.nextSpamChannelId}`;

        this.nextSpamChannelId += 1;

        return id;
    }

    private createStickyMineId(): string {
        const id =
            `sticky_mine_${this.nextStickyMineId}`;

        this.nextStickyMineId += 1;

        return id;
    }

    private createThreatDesignation(prefix: string): string {
        const designation = `${prefix}${this.nextThreatDesignationNumber}`;

        this.nextThreatDesignationNumber += 1;

        return designation;
    }

    // #endregion
}
