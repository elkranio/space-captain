import { SHIP_WEAPONS } from "../../../../../../engine/content/catalogs/ship_weapons";
import type {
    PlayerDefenseTurretPresentationSnapshot,
    PlayerWeaponPresentationSnapshot,
    PowerCorePresentationSnapshot,
} from "../../../../../../engine/encounter/snapshots/combat_presentation_snapshot";
import { OFFICER_ROLE, type OfficerRole } from "../../../../../../engine/defs/officer";
import type { PlayerHullState } from "../../../../../../engine/defs/player";
import type { ShieldGeneratorState } from "../../../../../../engine/defs/shield_generator";
import type { EncounterShipDriveState } from "../../../../../../engine/encounter/model/state";
import type { ActiveShieldState } from "../../../../../../engine/encounter/model/combat";
import type { OfficerTaskState } from "../../../../../../engine/encounter/model/officer_task";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponKind,
    type ShipWeaponPhase,
} from "../../../../../../engine/defs/ship_weapon";
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
} from "../../../../../../engine/encounter/model/officer_availability";
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from "../../../../../../engine/encounter/model/command";
import {
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponDashboardPayload,
} from "../../events/bridge_event";

type PlayerShipDashboardMapperInput = {
    weapons: PlayerWeaponPresentationSnapshot[];

    availableWeaponsCommands: AvailableOfficerCommand[];

    weaponsOfficerAvailability: OfficerAvailabilityState;

    // Helm context is only required when the stable player status strip
    // is requested.
    availableHelmCommands?: AvailableOfficerCommand[];

    helmOfficerAvailability?: OfficerAvailabilityState;

    // Science context is only required when at least one SPAM projector exists.
    availableScienceCommands?: AvailableOfficerCommand[];

    scienceOfficerAvailability?: OfficerAvailabilityState;

    officerTasks?: OfficerTaskState[];

    // Optional so focused mapper tests can exercise weapon rows without
    // constructing unrelated ship status.
    playerStatus?: {
        hull: PlayerHullState;

        drive: EncounterShipDriveState;

        powerCore: PowerCorePresentationSnapshot;

        defenseTurret?: PlayerDefenseTurretPresentationSnapshot;

        shieldGenerator?: ShieldGeneratorState;

        activeShield?: ActiveShieldState | null;
    };
};

// App-side projection detached encounter snapshots → captain dashboard.
//
// One output row corresponds to one installed runtime weapon. Duplicate kinds
// stay distinct by runtime id, and ACTIVE actions reuse the exact engine-resolved
// actor-weapon command for that same id.
export function mapPlayerShipToBridgeDashboardPayload(
    input: PlayerShipDashboardMapperInput,
): BridgePlayerShipDashboardUpdatedPayload {
    const weapons = input.weapons.map((weapon) => mapWeapon(weapon, input));

    return {
        ...(input.playerStatus
            ? {
                  status: mapStatus(input.playerStatus, input),
              }
            : {}),

        ...(weapons.length > 0
            ? {
                  weapons,
              }
            : {}),
    };
}

function mapStatus(
    input: NonNullable<PlayerShipDashboardMapperInput["playerStatus"]>,

    dashboardInput: PlayerShipDashboardMapperInput,
): NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]> {
    const powerCore = input.powerCore;

    return {
        hull: {
            current: input.hull.hull,
            max: input.hull.maxHull,
        },

        powerCore: {
            current: powerCore.state.charges,

            max: powerCore.capacity,

            ...(powerCore.rechargeProgress !== undefined
                ? {
                      rechargeProgress: powerCore.rechargeProgress,
                  }
                : {}),
        },

        drive: {
            status: input.drive.status,
            integrity: input.drive.integrity,
        },

        ...mapDefenseTurretStatus(input, dashboardInput.officerTasks ?? []),

        ...mapShieldStatus(input, dashboardInput.officerTasks ?? []),

        evadeAction: mapEvadeAction(dashboardInput),
    };
}

function mapDefenseTurretStatus(
    input: NonNullable<PlayerShipDashboardMapperInput["playerStatus"]>,
    officerTasks: OfficerTaskState[],
): Pick<NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>, "defenseTurret"> {
    const interceptTasks = officerTasks.filter(isDefenseTurretInterceptTask);

    if (interceptTasks.length > 1) {
        throw new Error("Captain dashboard received multiple active Defense Turret intercept tasks");
    }

    const interceptTask = interceptTasks[0];
    const defenseTurret = input.defenseTurret;

    if (!defenseTurret) {
        if (interceptTask) {
            throw new Error("Captain dashboard Defense Turret task requires an installed Defense Turret");
        }

        return {};
    }

    const cooldownProgress = getDefenseTurretCooldownProgress(defenseTurret);

    return {
        defenseTurret: {
            phase: defenseTurret.state.phase,

            ...(cooldownProgress !== undefined
                ? {
                      cooldownProgress,
                  }
                : {}),

            ...(interceptTask
                ? {
                      intercept: {
                          threatId: interceptTask.threatId,

                          progress: getTimedOfficerTaskProgress(interceptTask),
                      },
                  }
                : {}),
        },
    };
}

function isDefenseTurretInterceptTask(
    task: OfficerTaskState,
): task is Extract<
    OfficerTaskState,
    {
        sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE;
    }
> {
    return task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE;
}

function getDefenseTurretCooldownProgress(snapshot: PlayerDefenseTurretPresentationSnapshot): number | undefined {
    const remainingMs = snapshot.state.cooldownRemainingMs;

    if (remainingMs <= 0) {
        return undefined;
    }

    const durationMs = snapshot.cooldownDurationMs;

    if (durationMs <= 0 || remainingMs > durationMs) {
        throw new Error("Captain dashboard Defense Turret has invalid cooldown timing: " + snapshot.state.id);
    }

    return clamp01(1 - remainingMs / durationMs);
}

function getTimedOfficerTaskProgress(task: OfficerTaskState): number {
    const durationMs = task.durationMs;

    if (durationMs === null || durationMs <= 0) {
        throw new Error("Captain dashboard timed officer task has invalid duration: " + task.id);
    }

    return clamp01(task.elapsedMs / durationMs);
}

function mapShieldStatus(
    input: NonNullable<PlayerShipDashboardMapperInput["playerStatus"]>,
    officerTasks: OfficerTaskState[],
): Pick<NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>, "shield"> {
    const deploymentTasks = officerTasks.filter(isShieldDeploymentTask);

    if (deploymentTasks.length > 1) {
        throw new Error("Captain dashboard received multiple active Shield deployment tasks");
    }

    const deployment = deploymentTasks[0];
    const activeShield = input.activeShield ?? null;
    const activeShieldTargetNode = activeShield?.targetNode;
    const shieldGenerator = input.shieldGenerator;

    if (!shieldGenerator) {
        if (deployment || activeShield) {
            throw new Error("Captain dashboard Shield state requires an installed Shield Generator");
        }

        return {};
    }

    if (activeShield && activeShieldTargetNode === undefined) {
        throw new Error("Captain dashboard player Active Shield is missing target node");
    }

    return {
        shield: {
            status: shieldGenerator.status,
            phase: shieldGenerator.phase,

            ...(deployment
                ? {
                      deployment: {
                          targetNode: deployment.targetNode,
                      },
                  }
                : {}),

            ...(activeShield && activeShieldTargetNode !== undefined
                ? {
                      active: {
                          targetNode: activeShieldTargetNode,

                          remainingDurationMs: activeShield.remainingDurationMs,
                          initialDurationMs: activeShield.initialDurationMs,
                      },
                  }
                : {}),
        },
    };
}

function isShieldDeploymentTask(
    task: OfficerTaskState,
): task is Extract<
    OfficerTaskState,
    {
        sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;
    }
> {
    return task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;
}

function mapEvadeAction(
    input: PlayerShipDashboardMapperInput,
): NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>["evadeAction"] {
    const commands = getRequiredHelmCommands(input);

    const matchingCommands = commands.filter((command) => {
        return (
            command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.HELM_EVADE &&
            command.target.kind === OFFICER_COMMAND_TARGET_KIND.NONE
        );
    });

    if (matchingCommands.length > 1) {
        throw new Error("Captain dashboard received multiple HELM_EVADE commands");
    }

    const command = matchingCommands[0];

    if (command) {
        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE,

            command: {
                role: OFFICER_ROLE.HELM,

                commandId: command.commandId,

                target: command.target,
            },
        };
    }

    if (getRequiredHelmAvailability(input) === OFFICER_AVAILABILITY_STATE.BUSY) {
        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_OFFICER_BUSY,
        };
    }

    return {
        state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM,
    };
}

function clamp01(value: number): number {
    return Math.max(0, Math.min(1, value));
}

function getRequiredHelmCommands(input: PlayerShipDashboardMapperInput): AvailableOfficerCommand[] {
    const commands = input.availableHelmCommands;

    if (commands === undefined) {
        throw new Error("Captain dashboard status requires Helm commands");
    }

    return commands;
}

function getRequiredHelmAvailability(input: PlayerShipDashboardMapperInput): OfficerAvailabilityState {
    const availability = input.helmOfficerAvailability;

    if (availability === undefined) {
        throw new Error("Captain dashboard status requires Helm availability");
    }

    return availability;
}

function mapWeapon(
    snapshot: PlayerWeaponPresentationSnapshot,
    input: PlayerShipDashboardMapperInput,
): BridgePlayerWeaponDashboardPayload {
    const weapon = snapshot.state;

    const definition = SHIP_WEAPONS[weapon.weaponId];

    const cooldownProgress = getCooldownProgress(snapshot);

    const targetingProgress = getTargetingProgress(snapshot);

    const chargingProgress = getChargingProgress(snapshot);

    const integrity = snapshot.integrity;

    const action = mapWeaponAction(snapshot, input);

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER: {
            const ammo = requireAmmo(snapshot);

            return {
                id: weapon.id,

                weaponId: weapon.weaponId,

                shortName: definition.shortName,

                kind: weapon.kind,

                ammo: {
                    ...ammo,
                },

                ...(integrity
                    ? {
                          integrity: {
                              ...integrity,
                          },
                      }
                    : {}),

                ...(targetingProgress !== undefined
                    ? {
                          targetingProgress,
                      }
                    : {}),

                ...(cooldownProgress !== undefined && ammo.current > 0
                    ? {
                          cooldownProgress,
                      }
                    : {}),

                action,
            };
        }

        case SHIP_WEAPON_KIND.BEAM_CANNON: {
            if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
                throw new Error(
                    "Captain dashboard Beam Cannon definition mismatch: " +
                        weapon.id +
                        "/" +
                        weapon.weaponId,
                );
            }

            return {
                id: weapon.id,

                weaponId: weapon.weaponId,

                shortName: definition.shortName,

                kind: weapon.kind,

                powerCost: definition.powerCost,

                ...(integrity
                    ? {
                          integrity: {
                              ...integrity,
                          },
                      }
                    : {}),

                ...(chargingProgress !== undefined
                    ? {
                          chargingProgress,
                      }
                    : {}),

                ...(cooldownProgress !== undefined
                    ? {
                          cooldownProgress,
                      }
                    : {}),

                action,
            };
        }

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return {
                id: weapon.id,

                weaponId: weapon.weaponId,

                shortName: definition.shortName,

                kind: weapon.kind,

                ...(integrity
                    ? {
                          integrity: {
                              ...integrity,
                          },
                      }
                    : {}),

                ...(targetingProgress !== undefined
                    ? {
                          targetingProgress,
                      }
                    : {}),

                ...(cooldownProgress !== undefined
                    ? {
                          cooldownProgress,
                      }
                    : {}),

                action,
            };

        default: {
            const exhaustiveWeapon: never = weapon;

            return exhaustiveWeapon;
        }
    }
}

function getTargetingProgress(snapshot: PlayerWeaponPresentationSnapshot): number | undefined {
    const weapon = snapshot.state;

    if (weapon.phase !== SHIP_WEAPON_PHASE.TARGETING) {
        return undefined;
    }

    const durationMs = snapshot.phaseDurationMs;

    if (durationMs === undefined || durationMs <= 0) {
        throw new Error(
            "Player weapon presentation is missing valid targeting timing: " + weapon.id,
        );
    }

    return clamp01(weapon.phaseElapsedMs / durationMs);
}

function getChargingProgress(snapshot: PlayerWeaponPresentationSnapshot): number | undefined {
    const weapon = snapshot.state;

    if (weapon.phase !== SHIP_WEAPON_PHASE.CHARGING) {
        return undefined;
    }

    if (weapon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error("Only Beam Cannon can expose charging progress: " + weapon.id);
    }

    const durationMs = snapshot.phaseDurationMs;

    if (durationMs === undefined || durationMs <= 0) {
        throw new Error(
            "Player Beam Cannon presentation is missing valid charging timing: " + weapon.id,
        );
    }

    return clamp01(weapon.phaseElapsedMs / durationMs);
}

function mapWeaponAction(
    snapshot: PlayerWeaponPresentationSnapshot,
    input: PlayerShipDashboardMapperInput,
): BridgePlayerWeaponDashboardPayload["action"] {
    const weapon = snapshot.state;

    if (isCurrentWorkPhase(weapon.kind, weapon.phase)) {
        const cancelTaskId = getCancellableWeaponTaskId(weapon, input.officerTasks ?? []);

        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK,

            ...(cancelTaskId
                ? {
                      cancelTaskId,
                  }
                : {}),
        };
    }

    if (!isReadyForAction(snapshot)) {
        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM,
        };
    }

    const role = getOperatingRole(weapon.kind);

    const command = getResolvedWeaponCommand(
        role === OFFICER_ROLE.SCIENCE ? getRequiredScienceCommands(input) : input.availableWeaponsCommands,

        getFireCommandId(weapon.kind),

        weapon.id,
    );

    if (command) {
        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE,

            command: {
                role,

                commandId: command.commandId,

                target: command.target,
            },
        };
    }

    const availability =
        role === OFFICER_ROLE.SCIENCE ? getRequiredScienceAvailability(input) : input.weaponsOfficerAvailability;

    if (availability === OFFICER_AVAILABILITY_STATE.BUSY) {
        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_OFFICER_BUSY,
        };
    }

    return {
        state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM,
    };
}

function getCancellableWeaponTaskId(
    weapon: PlayerWeaponPresentationSnapshot["state"],
    officerTasks: OfficerTaskState[],
): string | undefined {
    const sourceCommandId = getFireCommandId(weapon.kind);

    const matchingTasks = officerTasks.filter((task) => {
        return (
            task.sourceCommandId === sourceCommandId &&
            "weaponId" in task &&
            task.weaponId === weapon.id
        );
    });

    if (matchingTasks.length > 1) {
        throw new Error(
            "Captain dashboard weapon has multiple active tasks: " + weapon.id,
        );
    }

    const task = matchingTasks[0];

    if (!task?.canBeCancelledByPlayer) {
        return undefined;
    }

    return task.id;
}

function isCurrentWorkPhase(kind: ShipWeaponKind, phase: ShipWeaponPhase): boolean {
    switch (kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            return phase === SHIP_WEAPON_PHASE.TARGETING;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return phase === SHIP_WEAPON_PHASE.TARGETING || phase === SHIP_WEAPON_PHASE.CHARGING;

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return phase === SHIP_WEAPON_PHASE.TARGETING || phase === SHIP_WEAPON_PHASE.DISPENSING;

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return phase === SHIP_WEAPON_PHASE.TARGETING || phase === SHIP_WEAPON_PHASE.CHANNELING;

        default: {
            const exhaustiveKind: never = kind;

            return exhaustiveKind;
        }
    }
}

function isReadyForAction(snapshot: PlayerWeaponPresentationSnapshot): boolean {
    const weapon = snapshot.state;

    if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
        return false;
    }

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return requireAmmo(snapshot).current > 0;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return true;

        default: {
            const exhaustiveWeapon: never = weapon;

            return exhaustiveWeapon;
        }
    }
}

function getOperatingRole(kind: ShipWeaponKind): OfficerRole {
    switch (kind) {
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return OFFICER_ROLE.SCIENCE;

        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return OFFICER_ROLE.WEAPONS;

        default: {
            const exhaustiveKind: never = kind;

            return exhaustiveKind;
        }
    }
}

function getFireCommandId(kind: ShipWeaponKind): EncounterOfficerCommandId {
    switch (kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            return ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BEAM_CANNON;

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_STICKY_MINES;

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_FIRE_SPAM;

        default: {
            const exhaustiveKind: never = kind;

            return exhaustiveKind;
        }
    }
}

function getResolvedWeaponCommand(
    commands: AvailableOfficerCommand[],
    commandId: EncounterOfficerCommandId,
    weaponId: string,
): AvailableOfficerCommand | undefined {
    const matchingCommands = commands.filter((command) => {
        return (
            command.commandId === commandId &&
            command.target.kind === OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON &&
            command.target.weaponId === weaponId
        );
    });

    if (matchingCommands.length > 1) {
        throw new Error(
            "Captain dashboard weapon row received multiple " + "resolved commands for runtime weapon: " + weaponId,
        );
    }

    return matchingCommands[0];
}

function requireAmmo(snapshot: PlayerWeaponPresentationSnapshot): { current: number; max: number } {
    const weapon = snapshot.state;

    if (weapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER && weapon.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
        throw new Error("Captain dashboard weapon is not ammo-backed: " + weapon.id);
    }

    const max = snapshot.ammoCapacity;

    if (max === undefined) {
        throw new Error("Player weapon presentation is missing ammo capacity: " + weapon.id);
    }

    return {
        current: weapon.ammoCount,
        max,
    };
}

function getRequiredScienceCommands(input: PlayerShipDashboardMapperInput): AvailableOfficerCommand[] {
    const commands = input.availableScienceCommands;

    if (commands === undefined) {
        throw new Error("Captain dashboard SPAM row requires Science commands");
    }

    return commands;
}

function getRequiredScienceAvailability(input: PlayerShipDashboardMapperInput): OfficerAvailabilityState {
    const availability = input.scienceOfficerAvailability;

    if (availability === undefined) {
        throw new Error("Captain dashboard SPAM row requires Science availability");
    }

    return availability;
}

function getCooldownProgress(snapshot: PlayerWeaponPresentationSnapshot): number | undefined {
    const remainingCooldownMs = snapshot.state.cooldownRemainingMs;

    if (remainingCooldownMs <= 0) {
        return undefined;
    }

    const initialCooldownMs = snapshot.cooldownDurationMs;

    if (initialCooldownMs <= 0 || remainingCooldownMs > initialCooldownMs) {
        throw new Error("Player weapon presentation has invalid cooldown timing: " + snapshot.state.id);
    }

    return Math.max(
        0,
        Math.min(
            1,

            1 - remainingCooldownMs / initialCooldownMs,
        ),
    );
}
