// src/engine/encounter/state/player/PlayerShipStore.ts

import {
    MISSILES,
} from '../../../content/catalogs/missiles';
import type {
    DefenseCapacitorState,
} from '../../../defs/defense_capacitor';
import type {
    PlayerHullDamageResult,
} from '../../../defs/player';
import {
    POINT_DEFENSE_SHOT_OUTCOME,
    type PointDefenseBeamBand,
    type PointDefenseShotOutcome,
} from '../../../defs/point_defense';
import {
    SHIP_DRIVE_STATUS,
    type ShipDriveState,
} from '../../../defs/ship_drive';
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
    spendDefenseCapacitorCharge as spendInstalledDefenseCapacitorCharge,
} from '../../combat/defense/spend_defense_capacitor_charge';
import {
    COMBAT_THREAT_KIND,
    THREAT_IDENTIFICATION_STATUS,
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

        if (projectile) {
            if (
                projectile.identification
                    .status ===
                THREAT_IDENTIFICATION_STATUS
                    .IDENTIFIED
            ) {
                return {
                    kind:
                        COMBAT_THREAT_KIND.MISSILE,

                    spectralBand:
                        projectile.identification
                            .spectralBand,
                };
            }

            const spectralBand =
                MISSILES[
                    projectile.missileId
                ].spectralBand;

            projectile.identification = {
                status:
                    THREAT_IDENTIFICATION_STATUS
                        .IDENTIFIED,
                spectralBand,
            };

            return {
                kind:
                    COMBAT_THREAT_KIND.MISSILE,

                spectralBand,
            };
        }

        return undefined;
    }

    public spendDefenseCapacitorCharge():
        DefenseCapacitorState {
        const defenseCapacitor =
            this.state.combat
                .defenseCapacitor;

        if (!defenseCapacitor) {
            throw new Error(
                'Cannot spend defense-capacitor charge: installation missing',
            );
        }

        return spendInstalledDefenseCapacitorCharge(
            defenseCapacitor,
        );
    }

    public firePointDefense(
        threatId: string,
        beamBand:
            PointDefenseBeamBand,
    ): PointDefenseShotOutcome | undefined {
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

        const missile =
            MISSILES[
                threat.missileId
            ];

        const outcome =
            missile.spectralBand ===
            beamBand
                ? POINT_DEFENSE_SHOT_OUTCOME.HIT
                : POINT_DEFENSE_SHOT_OUTCOME.MISS;

        if (
            outcome ===
            POINT_DEFENSE_SHOT_OUTCOME.HIT
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
