// src/engine/encounter/snapshots/combat_presentation_snapshot.ts

import { POWER_CORES } from "../../content/catalogs/power_cores";
import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../content/catalogs/shield_generators";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import type { PowerCoreState } from "../../defs/power_core";
import { OFFICER_ROLE, type OfficerRole } from "../../defs/officer";
import type { PlayerHullState } from "../../defs/player";
import type { ShipEvadeState } from "../../defs/ship_evade";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type ShipWeaponState } from "../../defs/ship_weapon";
import type { ShieldGeneratorState } from "../../defs/shield_generator";
import { getAvailableOfficerCommands } from "../commands/queries/get_available_officer_commands";
import {
    getEnemyShipTelemetrySnapshots,
    type EnemyShipTelemetrySnapshot,
} from "../combat/queries/get_enemy_ship_telemetry_snapshots";
import {
    getBeamCannonThreatSnapshots,
    type BeamCannonThreatSnapshot,
} from "../combat/queries/get_beam_cannon_threat_snapshots";
import { getStickyMineSnapshots, type StickyMineSnapshot } from "../combat/queries/get_sticky_mine_snapshots";
import { getPlayerCrewProgressMultiplier } from "../crew_performance/get_crew_progress_multiplier";
import type { AvailableOfficerCommand } from "../model/command";
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type ActiveShieldState,
    type MissileCombatProjectileState,
    type SpamChannelState,
    type StickyMineState,
} from "../model/combat";
import type { OfficerAvailabilityStates } from "../model/officer_availability";
import type { OfficerTaskState } from "../model/officer_task";
import type { EncounterShipDriveState, EncounterState } from "../model/state";
import { getOfficerAvailabilityStates } from "../officer_availability/queries/get_officer_availability_states";
import {
    createPlayerThreatDecisionTimingSnapshot,
    type PlayerThreatDecisionTimingSnapshot,
} from "./create_player_threat_decision_timing_snapshot";

export type PowerCorePresentationSnapshot = {
    state: PowerCoreState;

    capacity: number;

    rechargeProgress?: number;
};

export type PlayerWeaponPresentationSnapshot = {
    state: ShipWeaponState;

    phaseDurationMs?: number;

    // Independent recovery clock. It may be active while
    // the weapon still owns CHARGING / CHANNELING / DISPENSING.
    cooldownDurationMs: number;

    ammoCapacity?: number;
};

export type EnemyShipPresentationSnapshot = Omit<EnemyShipTelemetrySnapshot, "powerCore"> & {
    powerCore?: PowerCorePresentationSnapshot;
};

export type MissilePresentationSnapshot = {
    id: string;
    designation: string;

    kind: MissileCombatProjectileState["kind"];

    source: MissileCombatProjectileState["source"];

    sourceWeaponId: string;

    target: MissileCombatProjectileState["target"];

    timeToImpactMs: number;
    initialTimeToImpactMs: number;

};

export type PlayerDefenseTurretPresentationSnapshot = {
    // Hard mechanical equipment probability.
    // Presentation may format it, but never recompute it.
    blindInterceptChance: number;
};

export type CombatPresentationSnapshot = {
    player: {
        hull: PlayerHullState;

        drive: EncounterShipDriveState;

        evade: ShipEvadeState;

        powerCore?: PowerCorePresentationSnapshot;

        defenseTurret?: PlayerDefenseTurretPresentationSnapshot;

        shieldGenerator?: ShieldGeneratorState;

        activeShield: ActiveShieldState | null;

        weapons: PlayerWeaponPresentationSnapshot[];

        officerAvailability: OfficerAvailabilityStates;

        officerTasks: OfficerTaskState[];
    };

    enemyShips: EnemyShipPresentationSnapshot[];

    incomingMissiles: MissilePresentationSnapshot[];

    outgoingMissiles: MissilePresentationSnapshot[];

    outgoingStickyMines: StickyMineState[];

    stickyMineSnapshots: StickyMineSnapshot[];

    beamCannonThreats: BeamCannonThreatSnapshot[];

    spamChannels: SpamChannelState[];

    playerThreatDecisionTimings: PlayerThreatDecisionTimingSnapshot;

    commandsByRole: Record<OfficerRole, AvailableOfficerCommand[]>;
};

// Единый read-model одного combat frame.
//
// Mutable truth остаётся только в EncounterState.
// Snapshot ничего не кэширует и не становится вторым state:
// он один раз собирает все presentation/query данные
// из одного состояния, после чего EncounterSnapshotReader
// рекурсивно отсоединяет результат от engine.
export function createCombatPresentationSnapshot(state: EncounterState): CombatPresentationSnapshot {
    return {
        player: {
            hull: state.playerHull,

            drive: state.drive,

            evade: state.evade,

            ...(state.combat.powerCore
                ? {
                      powerCore: createPowerCorePresentationSnapshot(state.combat.powerCore),
                  }
                : {}),

            ...(state.combat.defenseTurret
                ? {
                      defenseTurret: createPlayerDefenseTurretPresentationSnapshot(
                          state.combat.defenseTurret.defenseTurretId,
                      ),
                  }
                : {}),

            ...(state.combat.shieldGenerator
                ? {
                      shieldGenerator: state.combat.shieldGenerator,
                  }
                : {}),

            activeShield: state.combat.activeShield,

            weapons: state.combat.playerWeapons.map(createPlayerWeaponPresentationSnapshot),

            officerAvailability: getOfficerAvailabilityStates(state),

            officerTasks: Object.values(state.officerTasks).filter((task): task is OfficerTaskState => {
                return task !== undefined;
            }),
        },

        enemyShips: getEnemyShipTelemetrySnapshots(state).map(createEnemyShipPresentationSnapshot),

        incomingMissiles: state.combat.projectiles
            .filter((projectile) => {
                return (
                    projectile.source.kind === COMBAT_SOURCE_KIND.ACTOR &&
                    projectile.target.kind === COMBAT_TARGET_KIND.PLAYER_SHIP
                );
            })
            .map(createMissilePresentationSnapshot),

        outgoingMissiles: state.combat.projectiles
            .filter((projectile) => {
                return (
                    projectile.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                    projectile.target.kind === COMBAT_TARGET_KIND.ACTOR
                );
            })
            .map(createMissilePresentationSnapshot),

        outgoingStickyMines: state.combat.stickyMines.filter((mine) => {
            return mine.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP && mine.target.kind === COMBAT_TARGET_KIND.ACTOR;
        }),

        stickyMineSnapshots: getStickyMineSnapshots(state),

        beamCannonThreats: getBeamCannonThreatSnapshots(state),

        spamChannels: selectSpamChannels(state),

        playerThreatDecisionTimings: createPlayerThreatDecisionTimingSnapshot({
            crewProgressMultiplier: getPlayerCrewProgressMultiplier(state),

            shieldDurationMs: getPlayerShieldDurationMs(state),
        }),

        commandsByRole: {
            [OFFICER_ROLE.SCIENCE]: getAvailableOfficerCommands(state, OFFICER_ROLE.SCIENCE),

            [OFFICER_ROLE.HELM]: getAvailableOfficerCommands(state, OFFICER_ROLE.HELM),

            [OFFICER_ROLE.WEAPONS]: getAvailableOfficerCommands(state, OFFICER_ROLE.WEAPONS),

            [OFFICER_ROLE.ENGINEER]: getAvailableOfficerCommands(state, OFFICER_ROLE.ENGINEER),
        },
    };
}

function getPlayerShieldDurationMs(state: EncounterState): number | undefined {
    const shieldGenerator = state.combat.shieldGenerator;

    if (!shieldGenerator) {
        return undefined;
    }

    const definition = SHIELD_GENERATORS[shieldGenerator.shieldGeneratorId];

    if (!definition) {
        throw new Error("Shield Generator definition not found: " + shieldGenerator.shieldGeneratorId);
    }

    return definition.shieldDurationMs;
}

function createMissilePresentationSnapshot(projectile: MissileCombatProjectileState): MissilePresentationSnapshot {
    return {
        id: projectile.id,

        designation: projectile.designation,

        kind: projectile.kind,

        source: projectile.source,

        sourceWeaponId: projectile.sourceWeaponId,

        target: projectile.target,

        timeToImpactMs: projectile.timeToImpactMs,

        initialTimeToImpactMs: projectile.initialTimeToImpactMs,

    };
}

function createPlayerDefenseTurretPresentationSnapshot(
    defenseTurretId: string,
): PlayerDefenseTurretPresentationSnapshot {
    const definition = DEFENSE_TURRETS[defenseTurretId];

    if (!definition) {
        throw new Error("Defense Turret definition not found: " + defenseTurretId);
    }

    return {
        blindInterceptChance: definition.blindInterceptChance,
    };
}

export function createPowerCorePresentationSnapshot(state: PowerCoreState): PowerCorePresentationSnapshot {
    const definition = POWER_CORES[state.powerCoreId];

    const rechargeProgress =
        state.charges < definition.capacity
            ? clamp01(state.rechargeElapsedMs / definition.rechargeDurationMs)
            : undefined;

    return {
        state,
        capacity: definition.capacity,

        ...(rechargeProgress !== undefined
            ? {
                  rechargeProgress,
              }
            : {}),
    };
}

export function createPlayerWeaponPresentationSnapshot(weapon: ShipWeaponState): PlayerWeaponPresentationSnapshot {
    const definition = SHIP_WEAPONS[weapon.weaponId];

    if (!definition) {
        throw new Error("Player weapon definition not found: " + weapon.weaponId);
    }

    const phaseDurationMs = getWeaponPhaseDurationMs(weapon);

    const ammoCapacity = getWeaponAmmoCapacity(weapon);

    return {
        state: weapon,

        cooldownDurationMs: definition.cooldownDurationMs,

        ...(phaseDurationMs !== undefined
            ? {
                  phaseDurationMs,
              }
            : {}),

        ...(ammoCapacity !== undefined
            ? {
                  ammoCapacity,
              }
            : {}),
    };
}

function createEnemyShipPresentationSnapshot(enemy: EnemyShipTelemetrySnapshot): EnemyShipPresentationSnapshot {
    const { powerCore, ...rest } = enemy;

    return {
        ...rest,

        ...(powerCore
            ? {
                  powerCore: createPowerCorePresentationSnapshot(powerCore),
              }
            : {}),
    };
}

function getWeaponAmmoCapacity(weapon: ShipWeaponState): number | undefined {
    const definition = SHIP_WEAPONS[weapon.weaponId];

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            if (definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
                throw new Error("Player missile launcher " + "definition mismatch: " + weapon.id);
            }

            return definition.ammoCapacity;

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            if (definition.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
                throw new Error("Player sticky mine dispenser " + "definition mismatch: " + weapon.id);
            }

            return definition.ammoCapacity;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return undefined;
    }
}

function getWeaponPhaseDurationMs(weapon: ShipWeaponState): number | undefined {
    const definition = SHIP_WEAPONS[weapon.weaponId];

    switch (weapon.phase) {
        case SHIP_WEAPON_PHASE.READY:
            return undefined;

        case SHIP_WEAPON_PHASE.TARGETING:
            if (
                definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER ||
                weapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER
            ) {
                throw new Error("Only player missile launcher can be " + "in targeting phase: " + weapon.id);
            }

            return definition.targetingDurationMs;

        case SHIP_WEAPON_PHASE.CHARGING:
            if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
                throw new Error("Only player beamCannon can be " + "in charging phase: " + weapon.id);
            }

            return definition.chargeDurationMs;

        case SHIP_WEAPON_PHASE.COOLDOWN:
            return definition.cooldownDurationMs;

        case SHIP_WEAPON_PHASE.CHANNELING:
            if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                throw new Error("Only player spam projector can be " + "in channeling phase: " + weapon.id);
            }

            return definition.channelDurationMs;

        case SHIP_WEAPON_PHASE.DISPENSING:
            if (
                definition.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER ||
                weapon.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
            ) {
                throw new Error("Only player sticky mine dispenser can be " + "in dispensing phase: " + weapon.id);
            }

            // Первая мина выходит в начале DISPENSING.
            // Duration покрывает только интервалы
            // между оставшимися минами salvo.
            const plannedMineCount = Math.min(
                definition.salvoSize,

                weapon.ammoCount + weapon.dispensedMineCount,
            );

            return Math.max(
                0,

                (plannedMineCount - 1) * definition.launchIntervalMs,
            );
    }
}

function selectSpamChannels(state: EncounterState): SpamChannelState[] {
    const channels: SpamChannelState[] = [];

    for (const actor of state.actors) {
        if (actor.hull <= 0) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR || weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING) {
                continue;
            }

            const channelId = weapon.activeChannelId;

            if (!channelId) {
                throw new Error("Spam projector channel id is missing: " + `${actor.id}/${weapon.id}/${weapon.phase}`);
            }

            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                throw new Error("Spam projector definition mismatch: " + `${actor.id}/${weapon.id}/${weapon.weaponId}`);
            }

            channels.push({
                id: channelId,

                sourceActorId: actor.id,

                sourceWeaponId: weapon.id,

                elapsedMs: Math.min(
                    weapon.phaseElapsedMs,

                    definition.channelDurationMs,
                ),

                durationMs: definition.channelDurationMs,
            });
        }
    }

    return channels;
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}
