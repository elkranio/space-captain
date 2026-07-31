// src/engine/encounter/combat/CombatRunner.ts

import { MISSILES } from '../../content/catalogs/missiles';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../defs/encounter_team';
import { LASER_TARGET_ZONES, type LaserTargetZone } from '../../defs/laser';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
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
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
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

type CombatRunnerOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;

    random: () => number;

    interruptRandomOfficerTask: () => void;
};

// Владеет боевым циклом encounter:
//
// - принимает простые решения за enemy ships;
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
    }: CombatRunnerOptions) {
        this.state = state;
        this.emit = emit;

        this.random = random;

        this.interruptRandomOfficerTask = interruptRandomOfficerTask;
    }

    public step(deltaMs: number): void {
        // Существующие угрозы двигаются до оружия,
        // чтобы созданная в этом step угроза
        // не получила тот же deltaMs повторно.
        this.advanceProjectiles(deltaMs);
        this.advanceStickyMines(deltaMs);

        this.startEnemyWeaponTargeting();
        this.advanceWeapons(deltaMs);
    }

    public getSpamChannels(): SpamChannelState[] {
        const channels: SpamChannelState[] = [];

        for (const actor of this.state.actors) {
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

                return true;
            }
        }

        return false;
    }

    // #region Enemy decisions

    private startEnemyWeaponTargeting(): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            return;
        }

        for (const actor of this.state.actors) {
            if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
                continue;
            }

            if (actor.anchorId !== navigation.anchorId) {
                continue;
            }

            if (this.hasActiveWeapon(actor)) {
                continue;
            }

            const weapon = actor.weapons.find((candidate) => {
                return this.canTargetWeapon(candidate);
            });

            if (!weapon) {
                continue;
            }

            weapon.phase = SHIP_WEAPON_PHASE.TARGETING;
            weapon.phaseElapsedMs = 0;

            this.emit({
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId: weapon.id,
            });
        }
    }

    private hasActiveWeapon(actor: ShipEncounterActorState): boolean {
        return actor.weapons.some((weapon) => {
            return (
                weapon.phase === SHIP_WEAPON_PHASE.TARGETING ||
                weapon.phase === SHIP_WEAPON_PHASE.CHARGING ||
                weapon.phase === SHIP_WEAPON_PHASE.CHANNELING ||
                weapon.phase === SHIP_WEAPON_PHASE.DISPENSING
            );
        });
    }

    private canTargetWeapon(weapon: ShipWeaponState): boolean {
        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return weapon.loadedMissileId !== null && weapon.ammoCount > 0;

            case SHIP_WEAPON_KIND.LASER:
                return true;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return weapon.activeChannelId === null;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return true;
        }
    }

    // #endregion

    // #region Weapon lifecycle

    private advanceWeapons(deltaMs: number): void {
        for (const actor of this.state.actors) {
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

            sourceActorId: actor.id,
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
                definition.burstSize &&
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
            definition.burstSize
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
            definition.burstSize
        ) {
            throw new Error(
                `Cannot exceed sticky-mine burst size: ` +
                    `${actor.id}/${dispenser.id}/${definition.burstSize}`,
            );
        }

        const mine: StickyMineState = {
            id: this.createStickyMineId(),

            sourceActorId: actor.id,
            sourceWeaponId: dispenser.id,

            timeToDetonationMs: Math.max(
                0,
                definition.fuseDurationMs -
                    ageMs,
            ),
            initialTimeToDetonationMs:
                definition.fuseDurationMs,

            damage: definition.damage,
        };

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

            mine.timeToDetonationMs =
                Math.max(
                    0,
                    mine.timeToDetonationMs -
                        deltaMs,
                );

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
        const mineSnapshot: StickyMineState = {
            ...mine,

            timeToDetonationMs: 0,
        };

        this.state.combat.stickyMines.splice(
            index,
            1,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .STICKY_MINE_DETONATED,

            mine: mineSnapshot,

            damage: mine.damage,
        });

        this.interruptRandomOfficerTask();
    }

    // #endregion

    // #region Projectiles

    private advanceProjectiles(deltaMs: number): void {
        // Идём с конца, потому что impacted projectiles
        // удаляются из массива во время обхода.
        for (let index = this.state.combat.projectiles.length - 1; index >= 0; index -= 1) {
            const projectile = this.state.combat.projectiles[index];

            projectile.timeToImpactMs = Math.max(0, projectile.timeToImpactMs - deltaMs);

            if (projectile.timeToImpactMs > 0) {
                continue;
            }

            this.resolveMissileImpact(index, projectile);
        }
    }

    private resolveMissileImpact(index: number, projectile: MissileCombatProjectileState): void {
        if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            throw new Error(
                `Cannot resolve missile impact for unsupported target: ` + `${projectile.id}/${projectile.target.kind}`,
            );
        }

        const missile = MISSILES[projectile.missileId];

        const projectileSnapshot: MissileCombatProjectileState = {
            ...projectile,

            timeToImpactMs: 0,
        };

        this.state.combat.projectiles.splice(index, 1);

        this.emit({
            type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

            projectile: projectileSnapshot,

            damage: missile.damage,
        });
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
