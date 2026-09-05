// src/engine/encounter/state/PlayerShipStore.ts

import type { PowerCoreState } from "../../defs/power_core";
import type { PlayerHullDamageResult } from "../../defs/player";
import {
    commitDefenseTurretCooldown,
    DEFENSE_TURRET_PHASE,
    DEFENSE_TURRET_SHOT_OUTCOME,
    type DefenseTurretShotOutcome,
} from "../../defs/defense_turret";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import { SHIP_DRIVES } from "../../content/catalogs/ship_drives";
import { SHIP_DRIVE_STATUS } from "../../defs/ship_drive";
import { advanceShipEvade, startShipEvade, stopShipEvade } from "../../defs/ship_evade";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIELD_GENERATOR_PHASE, SHIELD_GENERATOR_STATUS } from "../../defs/shield_generator";
import {
    commitShipWeaponCooldown,
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonState,
    type MissileLauncherState,
    type ShipWeaponState,
    type SpamProjectorState,
    type StickyMineDispenserState,
} from "../../defs/ship_weapon";
import {
    spendPowerCoreCharge as spendInstalledPowerCoreCharge,
    spendPowerCoreCharges as spendInstalledPowerCoreCharges,
} from "../combat/power_core/spend_power_core_charge";
import type { ActiveShieldState, BeamCannonTargetNode } from "../model/combat";
import {
    damageEquipmentIntegrity,
    isEquipmentOperational,
} from "../model/equipment";
import type { EncounterShipDriveState, EncounterState } from "../model/state";

// Owns player hull, drive and combat-system mutations.
export default class PlayerShipStore {
    constructor(private readonly state: EncounterState) {}

    public damagePlayerHull(damage: number): PlayerHullDamageResult {
        if (!Number.isFinite(damage) || damage < 0) {
            throw new Error("Invalid player hull damage: " + String(damage));
        }

        const playerHull = this.state.playerHull;

        const appliedDamage = Math.min(damage, playerHull.hull);

        const wasAlive = playerHull.hull > 0;

        playerHull.hull = Math.max(0, playerHull.hull - appliedDamage);

        return {
            appliedDamage,

            remainingHull: playerHull.hull,

            destroyed: wasAlive && appliedDamage > 0 && playerHull.hull === 0,
        };
    }

    public damagePlayerDrive(moduleDamage: number): EncounterShipDriveState {
        if (!Number.isInteger(moduleDamage) || moduleDamage < 0) {
            throw new Error("Invalid player drive module damage: " + String(moduleDamage));
        }

        const drive = this.state.drive;

        if (drive.status !== SHIP_DRIVE_STATUS.ONLINE) {
            throw new Error("Cannot damage player drive from status: " + drive.status);
        }

        damageEquipmentIntegrity(drive, moduleDamage);

        if (!isEquipmentOperational(drive)) {
            drive.status = SHIP_DRIVE_STATUS.DISABLED;
        }

        return {
            ...drive,
        };
    }

    public disablePlayerDrive(): EncounterShipDriveState | undefined {
        const drive = this.state.drive;

        if (drive.status === SHIP_DRIVE_STATUS.DISABLED) {
            return undefined;
        }

        drive.integrity = 0;
        drive.status = SHIP_DRIVE_STATUS.DISABLED;

        return {
            ...drive,
        };
    }

    public repairPlayerDrive(): EncounterShipDriveState {
        const drive = this.state.drive;

        if (drive.status !== SHIP_DRIVE_STATUS.DISABLED) {
            throw new Error("Cannot repair player drive from status: " + drive.status);
        }

        drive.integrity = SHIP_DRIVES[drive.driveId].maxIntegrity;
        drive.status = SHIP_DRIVE_STATUS.ONLINE;

        return {
            ...drive,
        };
    }

    public startPlayerEvade(): void {
        const drive = this.state.drive;

        if (drive.status !== SHIP_DRIVE_STATUS.ONLINE) {
            throw new Error("Cannot start player Evade with drive status: " + drive.status);
        }

        startShipEvade(this.state.evade, SHIP_DRIVES[drive.driveId]);
    }

    public advancePlayerEvade(deltaMs: number): void {
        advanceShipEvade(this.state.evade, SHIP_DRIVES[this.state.drive.driveId], deltaMs);
    }

    public stopPlayerEvade(): boolean {
        return stopShipEvade(this.state.evade, SHIP_DRIVES[this.state.drive.driveId]);
    }

    public findPlayerWeaponById(weaponId: string): ShipWeaponState | undefined {
        return this.state.combat.playerWeapons.find((weapon) => {
            return weapon.id === weaponId;
        });
    }

    public startPlayerMissileTargeting(weaponId: string): MissileLauncherState {
        const weapon = this.findPlayerWeaponById(weaponId);

        if (!weapon) {
            throw new Error("Player weapon not found: " + weaponId);
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error("Player weapon is not a missile launcher: " + weaponId + "/" + weapon.kind);
        }

        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            throw new Error("Player missile launcher is not ready: " + weaponId + "/" + weapon.phase);
        }

        if (weapon.ammoCount <= 0) {
            throw new Error("Player missile launcher is empty: " + weaponId + "/" + weapon.ammoCount);
        }

        weapon.phase = SHIP_WEAPON_PHASE.TARGETING;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public startPlayerStickyMineTargeting(weaponId: string): StickyMineDispenserState {
        const weapon = this.findPlayerWeaponById(weaponId);

        if (!weapon) {
            throw new Error("Player weapon not found: " + weaponId);
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
            throw new Error("Player weapon is not a sticky-mine dispenser: " + weaponId + "/" + weapon.kind);
        }

        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            throw new Error("Player sticky-mine dispenser is not ready: " + weaponId + "/" + weapon.phase);
        }

        if (weapon.ammoCount <= 0) {
            throw new Error("Player sticky-mine dispenser is empty: " + weaponId + "/" + weapon.ammoCount);
        }

        weapon.phase = SHIP_WEAPON_PHASE.TARGETING;

        weapon.phaseElapsedMs = 0;
        weapon.dispensedMineCount = 0;
        delete weapon.salvoTargetActorId;

        return {
            ...weapon,
        };
    }

    public startPlayerSpamChanneling(weaponId: string): SpamProjectorState {
        const weapon = this.findPlayerWeaponById(weaponId);

        if (!weapon) {
            throw new Error("Player weapon not found: " + weaponId);
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error("Player weapon is not a spam projector: " + weaponId + "/" + weapon.kind);
        }

        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            throw new Error("Player spam projector is not ready: " + weaponId + "/" + weapon.phase);
        }

        if (weapon.activeChannelId !== null) {
            throw new Error(
                "Ready player spam projector " +
                    "still has an active channel: " +
                    weaponId +
                    "/" +
                    weapon.activeChannelId,
            );
        }

        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error("Player spam projector definition mismatch: " + weapon.id + "/" + weapon.weaponId);
        }

        weapon.phase = SHIP_WEAPON_PHASE.CHANNELING;

        weapon.phaseElapsedMs = 0;
        weapon.channelPurged = false;

        return {
            ...weapon,
        };
    }

    public cancelPlayerSpamProjection(weaponId: string): string | undefined {
        const weapon = this.findPlayerWeaponById(weaponId);

        if (!weapon) {
            return undefined;
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error("Player spam task references " + "non-projector weapon: " + weaponId + "/" + weapon.kind);
        }

        if (weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING) {
            throw new Error("Cannot cancel player spam " + "projection from phase: " + weaponId + "/" + weapon.phase);
        }

        const channelId = weapon.activeChannelId;

        weapon.activeChannelId = null;
        weapon.channelPurged = false;

        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error("Player spam projector definition mismatch: " + weapon.id + "/" + weapon.weaponId);
        }

        commitShipWeaponCooldown(weapon, definition.cooldownDurationMs);

        finishShipWeaponAction(weapon, definition.cooldownDurationMs);

        return channelId ?? undefined;
    }

    public startPlayerBeamCannonCharging(weaponId: string): BeamCannonState {
        const weapon = this.findPlayerWeaponById(weaponId);

        if (!weapon) {
            throw new Error("Player weapon not found: " + weaponId);
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error("Player weapon is not a beamCannon: " + weaponId + "/" + weapon.kind);
        }

        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            throw new Error("Player beamCannon is not ready: " + weaponId + "/" + weapon.phase);
        }

        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error("Player beamCannon definition mismatch: " + weapon.id + "/" + weapon.weaponId);
        }

        weapon.phase = SHIP_WEAPON_PHASE.CHARGING;

        weapon.phaseElapsedMs = 0;

        return {
            ...weapon,
        };
    }

    public finishCancelledPlayerWeapon(weaponId: string): ShipWeaponState | undefined {
        const weapon = this.findPlayerWeaponById(weaponId);

        if (!weapon) {
            return undefined;
        }

        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== weapon.kind) {
            throw new Error("Cancelled player weapon definition mismatch: " + weapon.id + "/" + weapon.weaponId);
        }

        if (weapon.kind === SHIP_WEAPON_KIND.BEAM_CANNON) {
            commitShipWeaponCooldown(weapon, definition.cooldownDurationMs);
        }

        if (weapon.kind === SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
            delete weapon.salvoTargetActorId;
        }

        finishShipWeaponAction(weapon, definition.cooldownDurationMs);

        return {
            ...weapon,
        };
    }

    public startPlayerShieldGeneratorCooldown(): void {
        const emitter = this.state.combat.shieldGenerator;

        if (!emitter) {
            throw new Error("Cannot start player shield cooldown: emitter missing");
        }

        if (emitter.status !== SHIELD_GENERATOR_STATUS.ONLINE || emitter.phase !== SHIELD_GENERATOR_PHASE.READY) {
            throw new Error(
                "Cannot start player shield cooldown from emitter state: " + emitter.status + "/" + emitter.phase,
            );
        }

        emitter.phase = SHIELD_GENERATOR_PHASE.COOLDOWN;
        emitter.phaseElapsedMs = 0;
    }

    public startPlayerDefenseTurretLoading(threatId: string): void {
        const defenseTurret = this.state.combat.defenseTurret;

        if (!defenseTurret) {
            throw new Error("Cannot start player Defense Turret loading: installation missing");
        }

        if (defenseTurret.phase !== DEFENSE_TURRET_PHASE.READY) {
            throw new Error("Cannot start player Defense Turret loading from phase: " + defenseTurret.phase);
        }

        if (defenseTurret.cooldownRemainingMs !== 0) {
            throw new Error(
                "Ready player Defense Turret still has cooldown: " +
                    defenseTurret.id +
                    "/" +
                    String(defenseTurret.cooldownRemainingMs),
            );
        }

        defenseTurret.phase = DEFENSE_TURRET_PHASE.LOADING;
        defenseTurret.phaseElapsedMs = 0;
        defenseTurret.targetProjectileId = threatId;
    }

    public finishPlayerDefenseTurretAttempt(): void {
        const defenseTurret = this.state.combat.defenseTurret;

        if (!defenseTurret) {
            throw new Error("Cannot finish player Defense Turret attempt: installation missing");
        }

        if (defenseTurret.phase !== DEFENSE_TURRET_PHASE.LOADING) {
            throw new Error("Cannot finish player Defense Turret attempt from phase: " + defenseTurret.phase);
        }

        const definition = DEFENSE_TURRETS[defenseTurret.defenseTurretId];

        commitDefenseTurretCooldown(defenseTurret, definition.cooldownDurationMs);

        defenseTurret.phase = DEFENSE_TURRET_PHASE.COOLDOWN;
        defenseTurret.phaseElapsedMs = 0;
        defenseTurret.targetProjectileId = null;
    }

    public deployPlayerShield(targetNode: BeamCannonTargetNode): ActiveShieldState {
        const emitter = this.state.combat.shieldGenerator;

        if (!emitter) {
            throw new Error("Cannot deploy player shield: emitter missing");
        }

        if (emitter.status !== SHIELD_GENERATOR_STATUS.ONLINE) {
            throw new Error("Cannot deploy player shield from emitter status: " + emitter.status);
        }

        if (this.state.combat.activeShield) {
            throw new Error("Cannot deploy player shield while another shield is active");
        }

        const definition = SHIELD_GENERATORS[emitter.shieldGeneratorId];

        const shield: ActiveShieldState = {
            sourceEmitterId: emitter.id,
            targetNode,

            remainingDurationMs: definition.shieldDurationMs,

            initialDurationMs: definition.shieldDurationMs,
        };

        this.state.combat.activeShield = shield;

        return {
            ...shield,
        };
    }

    public consumeActiveShield(): ActiveShieldState | undefined {
        const shield = this.state.combat.activeShield;

        if (!shield) {
            return undefined;
        }

        this.state.combat.activeShield = null;

        return {
            ...shield,
        };
    }

    public spendPowerCoreCharge(): PowerCoreState {
        const powerCore = this.requirePlayerPowerCore();

        return spendInstalledPowerCoreCharge(powerCore);
    }

    public spendPowerCoreCharges(count: number): PowerCoreState {
        const powerCore = this.requirePlayerPowerCore();

        return spendInstalledPowerCoreCharges(powerCore, count);
    }

    private requirePlayerPowerCore(): PowerCoreState {
        const powerCore = this.state.combat.powerCore;

        if (!powerCore) {
            throw new Error("Cannot spend defense-powerCore charge: installation missing");
        }

        return powerCore;
    }

    public fireDefenseTurret(threatId: string): DefenseTurretShotOutcome | undefined {
        const projectileIndex = this.state.combat.projectiles.findIndex((candidate) => {
            return candidate.id === threatId;
        });

        // Threat may resolve before the Gunner task completes.
        // Charge was already spent at aim start.
        if (projectileIndex < 0) {
            return undefined;
        }

        const defenseTurret = this.state.combat.defenseTurret;

        if (!defenseTurret) {
            throw new Error("Cannot fire player defense turret: installation missing");
        }

        this.state.combat.projectiles.splice(projectileIndex, 1);

        return DEFENSE_TURRET_SHOT_OUTCOME.HIT;
    }
}
