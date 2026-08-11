import { OFFICER_ROLE } from '../../../../../../engine/defs/officer';
import {
    SHIP_WEAPON_PHASE,
} from '../../../../../../engine/defs/ship_weapon';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
} from '../../../../../../engine/encounter/model/officer_availability';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type AvailableOfficerCommand,
} from '../../../../../../engine/encounter/model/command';
import {
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponsStatusUpdatedPayload,
} from '../../events/bridge_event';

type MissileLauncherStatus =
    NonNullable<
        BridgePlayerWeaponsStatusUpdatedPayload[
            'missileLauncher'
        ]
    >;

type MissileLauncherDashboardPayload =
    NonNullable<
        BridgePlayerShipDashboardUpdatedPayload[
            'missileLauncher'
        ]
    >;

type PlayerShipDashboardMapperInput = {
    weapons:
        BridgePlayerWeaponsStatusUpdatedPayload;

    availableWeaponsCommands:
        AvailableOfficerCommand[];

    weaponsOfficerAvailability:
        OfficerAvailabilityState;
};

// App-side projection player ship runtime → captain dashboard.
//
// Здесь разрешается только presentation state.
// Domain availability не пересчитывается:
// active command приходит напрямую из getAvailableCommands(WEAPONS).
export function mapPlayerShipToBridgeDashboardPayload(
    input:
        PlayerShipDashboardMapperInput,
): BridgePlayerShipDashboardUpdatedPayload {
    const launcher =
        input.weapons
            .missileLauncher;

    if (!launcher) {
        return {};
    }

    const cooldownProgress =
        getMissileCooldownProgress(
            launcher,
        );

    return {
        missileLauncher: {
            ammo: {
                ...launcher.ammo,
            },

            ...(cooldownProgress !== undefined
                ? {
                      cooldownProgress,
                  }
                : {}),

            action:
                mapMissileAction(
                    launcher,
                    input.availableWeaponsCommands,
                    input.weaponsOfficerAvailability,
                ),
        },
    };
}

function mapMissileAction(
    launcher:
        MissileLauncherStatus,
    availableWeaponsCommands:
        AvailableOfficerCommand[],
    weaponsOfficerAvailability:
        OfficerAvailabilityState,
): MissileLauncherDashboardPayload[
    'action'
] {
    if (
        launcher.phase ===
        SHIP_WEAPON_PHASE.TARGETING
    ) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .ENGAGED_CURRENT_WORK,
        };
    }

    if (
        launcher.phase !==
            SHIP_WEAPON_PHASE.READY ||
        launcher.ammo.current <= 0
    ) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_SYSTEM,
        };
    }

    const missileCommand =
        getSingleMissileCommand(
            availableWeaponsCommands,
        );

    if (missileCommand) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .ACTIVE,

            command: {
                role:
                    OFFICER_ROLE.WEAPONS,

                commandId:
                    missileCommand
                        .commandId,

                target:
                    missileCommand
                        .target,
            },
        };
    }

    if (
        weaponsOfficerAvailability ===
        OFFICER_AVAILABILITY_STATE.BUSY
    ) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_OFFICER_BUSY,
        };
    }

    return {
        state:
            BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .DISABLED_SYSTEM,
    };
}

function getSingleMissileCommand(
    commands:
        AvailableOfficerCommand[],
): AvailableOfficerCommand | undefined {
    const missileCommands =
        commands.filter(
            (command) => {
                return (
                    command.commandId ===
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .WEAPONS_FIRE_MISSILE
                );
            },
        );

    if (
        missileCommands.length > 1
    ) {
        throw new Error(
            'Captain dashboard missile row received ' +
                'multiple resolved missile commands',
        );
    }

    return missileCommands[0];
}

function getMissileCooldownProgress(
    launcher:
        MissileLauncherStatus,
): number | undefined {
    if (
        launcher.ammo.current <= 0 ||
        launcher.phase !==
            SHIP_WEAPON_PHASE.COOLDOWN
    ) {
        return undefined;
    }

    const initialPhaseMs =
        launcher.initialPhaseMs;

    const remainingPhaseMs =
        launcher.remainingPhaseMs;

    if (
        initialPhaseMs === undefined ||
        remainingPhaseMs === undefined ||
        initialPhaseMs <= 0
    ) {
        throw new Error(
            'Missile cooldown dashboard snapshot ' +
                'requires valid phase timing',
        );
    }

    return Math.max(
        0,
        Math.min(
            1,

            1 -
                remainingPhaseMs /
                    initialPhaseMs,
        ),
    );
}
