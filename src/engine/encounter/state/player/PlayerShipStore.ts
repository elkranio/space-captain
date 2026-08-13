// src/engine/encounter/state/player/PlayerShipStore.ts

import type {
    PowerCoreState,
} from '../../../defs/power_core';
import type {
    PlayerHullDamageResult,
} from '../../../defs/player';
import {
    DEFENSE_TURRET_SHOT_OUTCOME,
    type DefenseTurretSignature,
    type DefenseTurretShotOutcome,
} from '../../../defs/defense_turret';
import {
    SHIP_DRIVE_STATUS,
    type ShipDriveState,
} from '../../../defs/ship_drive';
import {
    SHIELD_GENERATORS,
} from '../../../content/catalogs/shield_generators';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../defs/shield_generator';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponState,
    type MissileLauncherState,
    type ShipWeaponState,
    type SpamProjectorState,
    type StickyMineDispenserState,
} from '../../../defs/ship_weapon';
import {
    spendPowerCoreCharge as spendInstalledPowerCoreCharge,
} from '../../combat/defense/spend_power_core_charge';
import {
    COMBAT_THREAT_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
    type ActiveShieldState,
    type ThreatIdentificationResult,
} from '../../model/combat';
import type {
    EncounterState,
} from '../../model/state';

// Owns player hull, drive and combat-system mutations.
export default class PlayerShipStore {
    constructor(
        private readonly state: EncounterState,
    ) {}

    public damagePlayerHull(
        damage: number,
    ): PlayerHullDamageResult {
        if (
            !Number.isFinite(damage) ||
            damage < 0
        ) {
            throw new Error(
                'Invalid player hull damage: ' +
                    String(damage),
            );
        }

        const playerHull =
            this.state.playerHull;

        const appliedDamage =
            Math.min(
                damage,
                playerHull.hull,
            );

        const wasAlive =
            playerHull.hull > 0;

        playerHull.hull =
            Math.max(
                0,
                playerHull.hull -
                    appliedDamage,
            );

        return {
            appliedDamage,

            remainingHull:
                playerHull.hull,

            destroyed:
                wasAlive &&
                appliedDamage > 0 &&
                playerHull.hull === 0,
        };
    }

    public disablePlayerDrive():
        ShipDriveState | undefined {
        const drive =
            this.state.drive;

        if (
            drive.status ===
            SHIP_DRIVE_STATUS.DISABLED
        ) {
            return undefined;
        }

        drive.status =
            SHIP_DRIVE_STATUS.DISABLED;

        return {
            ...drive,
        };
    }

    public repairPlayerDrive():
        ShipDriveState {
        const drive =
            this.state.drive;

        if (
            drive.status !==
            SHIP_DRIVE_STATUS.DISABLED
        ) {
            throw new Error(
                'Cannot repair player drive from status: ' +
                    drive.status,
            );
        }

        drive.status =
            SHIP_DRIVE_STATUS.ONLINE;

        return {
            ...drive,
        };
    }

    public findPlayerWeaponById(
        weaponId: string,
    ): ShipWeaponState | undefined {
        return this.state.combat
            .playerWeapons
            .find((weapon) => {
                return (
                    weapon.id ===
                    weaponId
                );
            });
    }

    public startPlayerMissileTargeting(
        weaponId: string,
    ): MissileLauncherState {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            throw new Error(
                'Player weapon not found: ' +
                    weaponId,
            );
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Player weapon is not a missile launcher: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            throw new Error(
                'Player missile launcher is not ready: ' +
                    weaponId +
                    '/' +
                    weapon.phase,
            );
        }

        if (
            weapon.loadedMissileId ===
                null ||
            weapon.ammoCount <= 0
        ) {
            throw new Error(
                'Player missile launcher is empty: ' +
                    weaponId +
                    '/' +
                    weapon.ammoCount,
            );
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.TARGETING;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public startPlayerStickyMineDispensing(
        weaponId: string,
    ): StickyMineDispenserState {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            throw new Error(
                'Player weapon not found: ' +
                    weaponId,
            );
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Player weapon is not a sticky-mine dispenser: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            throw new Error(
                'Player sticky-mine dispenser is not ready: ' +
                    weaponId +
                    '/' +
                    weapon.phase,
            );
        }

        if (
            weapon.loadedMineId ===
                null ||
            weapon.ammoCount <= 0
        ) {
            throw new Error(
                'Player sticky-mine dispenser is empty: ' +
                    weaponId +
                    '/' +
                    weapon.ammoCount,
            );
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.DISPENSING;

        weapon.phaseElapsedMs = 0;
        weapon.dispensedMineCount = 0;

        return {
            ...weapon,
        };
    }

    public cancelPlayerStickyMineDispensing(
        weaponId: string,
    ): StickyMineDispenserState | undefined {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            return undefined;
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Player sticky-mine task references non-dispenser weapon: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.DISPENSING
        ) {
            throw new Error(
                'Cannot cancel player sticky-mine salvo from phase: ' +
                    weaponId +
                    '/' +
                    weapon.phase,
            );
        }

        weapon.phase =
            weapon.dispensedMineCount > 0
                ? SHIP_WEAPON_PHASE.COOLDOWN
                : SHIP_WEAPON_PHASE.READY;

        weapon.phaseElapsedMs = 0;

        if (
            weapon.phase ===
            SHIP_WEAPON_PHASE.READY
        ) {
            weapon.dispensedMineCount = 0;
        }

        return {
            ...weapon,
        };
    }

    public startPlayerSpamTargeting(
        weaponId: string,
    ): SpamProjectorState {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            throw new Error(
                'Player weapon not found: ' +
                    weaponId,
            );
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR
        ) {
            throw new Error(
                'Player weapon is not a spam projector: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            throw new Error(
                'Player spam projector is not ready: ' +
                    weaponId +
                    '/' +
                    weapon.phase,
            );
        }

        if (
            weapon.activeChannelId !==
            null
        ) {
            throw new Error(
                'Ready player spam projector ' +
                    'still has an active channel: ' +
                    weaponId +
                    '/' +
                    weapon.activeChannelId,
            );
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.TARGETING;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public cancelPlayerSpamProjection(
        weaponId: string,
    ): string | undefined {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            return undefined;
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR
        ) {
            throw new Error(
                'Player spam task references ' +
                    'non-projector weapon: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        switch (weapon.phase) {
            case SHIP_WEAPON_PHASE.TARGETING:
                weapon.phase =
                    SHIP_WEAPON_PHASE.READY;

                weapon.phaseElapsedMs = 0;
                weapon.activeChannelId =
                    null;

                return undefined;

            case SHIP_WEAPON_PHASE.CHANNELING: {
                const channelId =
                    weapon.activeChannelId;

                if (!channelId) {
                    throw new Error(
                        'Player spam channel id ' +
                            'is missing during cancellation: ' +
                            weaponId,
                    );
                }

                weapon.activeChannelId =
                    null;

                weapon.phase =
                    SHIP_WEAPON_PHASE
                        .COOLDOWN;

                weapon.phaseElapsedMs = 0;

                return channelId;
            }

            default:
                throw new Error(
                    'Cannot cancel player spam ' +
                        'projection from phase: ' +
                        weaponId +
                        '/' +
                        weapon.phase,
                );
        }
    }

    public startPlayerLaserTargeting(
        weaponId: string,
    ): LaserWeaponState {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            throw new Error(
                'Player weapon not found: ' +
                    weaponId,
            );
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Player weapon is not a laser: ' +
                    weaponId +
                    '/' +
                    weapon.kind,
            );
        }

        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            throw new Error(
                'Player laser is not ready: ' +
                    weaponId +
                    '/' +
                    weapon.phase,
            );
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.TARGETING;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public resetPlayerWeapon(
        weaponId: string,
    ): ShipWeaponState | undefined {
        const weapon =
            this.findPlayerWeaponById(
                weaponId,
            );

        if (!weapon) {
            return undefined;
        }

        weapon.phase =
            SHIP_WEAPON_PHASE.READY;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public identifyThreat(
        threatId: string,
    ): ThreatIdentificationResult | undefined {
        const projectile =
            this.state.combat
                .projectiles
                .find((candidate) => {
                    return (
                        candidate.id ===
                        threatId
                    );
                });

        if (!projectile) {
            return undefined;
        }

        if (
            projectile.identification
                .status ===
            MISSILE_SIGNATURE_INTEL_STATUS
                .CONFIRMED
        ) {
            return {
                kind:
                    COMBAT_THREAT_KIND.MISSILE,

                status:
                    MISSILE_SIGNATURE_INTEL_STATUS
                        .CONFIRMED,

                hypothesis:
                    projectile.identification
                        .hypothesis,
            };
        }

        const hypothesis =
            projectile.signature;

        projectile.identification = {
            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .CONFIRMED,

            hypothesis,
        };

        return {
            kind:
                COMBAT_THREAT_KIND.MISSILE,

            status:
                MISSILE_SIGNATURE_INTEL_STATUS
                    .CONFIRMED,

            hypothesis,
        };
    }

    public deployPlayerShield():
        ActiveShieldState {
        const emitter =
            this.state.combat
                .shieldGenerator;

        if (!emitter) {
            throw new Error(
                'Cannot deploy player shield: emitter missing',
            );
        }

        if (
            emitter.status !==
            SHIELD_GENERATOR_STATUS.ONLINE
        ) {
            throw new Error(
                'Cannot deploy player shield from emitter status: ' +
                    emitter.status,
            );
        }

        if (
            emitter.phase !==
            SHIELD_GENERATOR_PHASE.READY
        ) {
            throw new Error(
                'Cannot deploy player shield from emitter phase: ' +
                    emitter.phase,
            );
        }

        if (
            this.state.combat
                .activeShield
        ) {
            throw new Error(
                'Cannot deploy player shield while another shield is active',
            );
        }

        const definition =
            SHIELD_GENERATORS[
                emitter
                    .shieldGeneratorId
            ];

        emitter.phase =
            SHIELD_GENERATOR_PHASE
                .COOLDOWN;

        emitter.phaseElapsedMs = 0;

        const shield:
            ActiveShieldState = {
                sourceEmitterId:
                    emitter.id,

                remainingDurationMs:
                    definition
                        .shieldDurationMs,

                initialDurationMs:
                    definition
                        .shieldDurationMs,
            };

        this.state.combat
            .activeShield =
                shield;

        return {
            ...shield,
        };
    }

    public consumeActiveShield():
        ActiveShieldState | undefined {
        const shield =
            this.state.combat
                .activeShield;

        if (!shield) {
            return undefined;
        }

        this.state.combat
            .activeShield =
                null;

        return {
            ...shield,
        };
    }

    public spendPowerCoreCharge():
        PowerCoreState {
        const powerCore =
            this.state.combat
                .powerCore;

        if (!powerCore) {
            throw new Error(
                'Cannot spend defense-powerCore charge: installation missing',
            );
        }

        return spendInstalledPowerCoreCharge(
            powerCore,
        );
    }

    public fireDefenseTurret(
        threatId: string,
        signature:
            DefenseTurretSignature,
    ): DefenseTurretShotOutcome | undefined {
        const threatIndex =
            this.state.combat
                .projectiles
                .findIndex((projectile) => {
                    return (
                        projectile.id ===
                        threatId
                    );
                });

        // Threat may resolve before
        // the Weapons task completes.
        // Charge was already spent at aim start.
        if (threatIndex < 0) {
            return undefined;
        }

        const threat =
            this.state.combat
                .projectiles[
                    threatIndex
                ];

        const outcome =
            threat.signature ===
            signature
                ? DEFENSE_TURRET_SHOT_OUTCOME.HIT
                : DEFENSE_TURRET_SHOT_OUTCOME.MISS;

        if (
            outcome ===
            DEFENSE_TURRET_SHOT_OUTCOME.HIT
        ) {
            this.state.combat
                .projectiles.splice(
                    threatIndex,
                    1,
                );
        }

        return outcome;
    }
}
