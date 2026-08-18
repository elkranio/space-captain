import type { PowerCorePresentationSnapshot } from "../../../../../../engine/encounter/snapshots/combat_presentation_snapshot";
import { OFFICER_ROLE, type OfficerRole } from "../../../../../../engine/defs/officer";
import type { PlayerHullState } from "../../../../../../engine/defs/player";
import type { ShipDriveState } from "../../../../../../engine/defs/ship_drive";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type ShipWeaponKind } from "../../../../../../engine/defs/ship_weapon";
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
    type BridgePlayerWeaponStatusPayload,
    type BridgePlayerWeaponsStatusUpdatedPayload,
} from "../../events/bridge_event";

type PlayerShipDashboardMapperInput = {
    weapons: BridgePlayerWeaponsStatusUpdatedPayload;

    availableWeaponsCommands: AvailableOfficerCommand[];

    weaponsOfficerAvailability: OfficerAvailabilityState;

    // Helm context is only required when the stable player status strip
    // is requested.
    availableHelmCommands?: AvailableOfficerCommand[];

    helmOfficerAvailability?: OfficerAvailabilityState;

    // Science context is only required when at least one SPAM projector exists.
    availableScienceCommands?: AvailableOfficerCommand[];

    scienceOfficerAvailability?: OfficerAvailabilityState;

    // Optional so focused mapper tests can exercise weapon rows without
    // constructing unrelated ship status.
    playerStatus?: {
        hull: PlayerHullState;

        drive: ShipDriveState;

        powerCore: PowerCorePresentationSnapshot;
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
        },

        evadeAction: mapEvadeAction(dashboardInput),
    };
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
    weapon: BridgePlayerWeaponStatusPayload,
    input: PlayerShipDashboardMapperInput,
): BridgePlayerWeaponDashboardPayload {
    const cooldownProgress = getCooldownProgress(weapon);

    const action = mapWeaponAction(weapon, input);

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER: {
            const ammo = requireAmmo(weapon);

            return {
                id: weapon.id,

                weaponId: weapon.weaponId,

                kind: weapon.kind,

                ammo: {
                    ...ammo,
                },

                ...(cooldownProgress !== undefined && ammo.current > 0
                    ? {
                          cooldownProgress,
                      }
                    : {}),

                action,
            };
        }

        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return {
                id: weapon.id,

                weaponId: weapon.weaponId,

                kind: weapon.kind,

                ...(cooldownProgress !== undefined
                    ? {
                          cooldownProgress,
                      }
                    : {}),

                action,
            };

        default: {
            const exhaustiveKind: never = weapon.kind;

            return exhaustiveKind;
        }
    }
}

function mapWeaponAction(
    weapon: BridgePlayerWeaponStatusPayload,
    input: PlayerShipDashboardMapperInput,
): BridgePlayerWeaponDashboardPayload["action"] {
    if (isCurrentWorkPhase(weapon.kind, weapon.phase)) {
        return {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK,
        };
    }

    if (!isReadyForAction(weapon)) {
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

function isCurrentWorkPhase(kind: ShipWeaponKind, phase: BridgePlayerWeaponStatusPayload["phase"]): boolean {
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

function isReadyForAction(weapon: BridgePlayerWeaponStatusPayload): boolean {
    if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
        return false;
    }

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return requireAmmo(weapon).current > 0;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return true;

        default: {
            const exhaustiveKind: never = weapon.kind;

            return exhaustiveKind;
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

function requireAmmo(weapon: BridgePlayerWeaponStatusPayload): NonNullable<BridgePlayerWeaponStatusPayload["ammo"]> {
    if (weapon.ammo) {
        return weapon.ammo;
    }

    throw new Error("Captain dashboard ammo-backed weapon is missing ammo: " + weapon.id);
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

function getCooldownProgress(weapon: BridgePlayerWeaponStatusPayload): number | undefined {
    const initialCooldownMs = weapon.initialCooldownMs;

    const remainingCooldownMs = weapon.remainingCooldownMs;

    if (initialCooldownMs === undefined && remainingCooldownMs === undefined) {
        return undefined;
    }

    if (
        initialCooldownMs === undefined ||
        remainingCooldownMs === undefined ||
        initialCooldownMs <= 0 ||
        remainingCooldownMs < 0 ||
        remainingCooldownMs > initialCooldownMs
    ) {
        throw new Error("Captain dashboard weapon cooldown requires valid independent timing: " + weapon.id);
    }

    return Math.max(
        0,
        Math.min(
            1,

            1 - remainingCooldownMs / initialCooldownMs,
        ),
    );
}
