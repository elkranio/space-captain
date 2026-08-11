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
    type BridgePlayerWeaponStatusPayload,
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

type LaserDashboardPayload =
    NonNullable<
        BridgePlayerShipDashboardUpdatedPayload[
            'laser'
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

    const laser =
        input.weapons
            .laser;

    return {
        ...(launcher
            ? {
                  missileLauncher:
                      mapMissileLauncher(
                          launcher,
                          input.availableWeaponsCommands,
                          input.weaponsOfficerAvailability,
                      ),
              }
            : {}),

        ...(laser
            ? {
                  laser:
                      mapLaser(
                          laser,
                          input.availableWeaponsCommands,
                          input.weaponsOfficerAvailability,
                      ),
              }
            : {}),
    };
}

function mapMissileLauncher(
    launcher:
        MissileLauncherStatus,
    availableWeaponsCommands:
        AvailableOfficerCommand[],
    weaponsOfficerAvailability:
        OfficerAvailabilityState,
): MissileLauncherDashboardPayload {
    const cooldownProgress =
        getCooldownProgress(
            launcher,
            'Missile launcher',
        );

    return {
        ammo: {
            ...launcher.ammo,
        },

        ...(cooldownProgress !== undefined &&
        launcher.ammo.current > 0
            ? {
                  cooldownProgress,
              }
            : {}),

        action:
            mapMissileAction(
                launcher,
                availableWeaponsCommands,
                weaponsOfficerAvailability,
            ),
    };
}

function mapLaser(
    laser:
        BridgePlayerWeaponStatusPayload,
    availableWeaponsCommands:
        AvailableOfficerCommand[],
    weaponsOfficerAvailability:
        OfficerAvailabilityState,
): LaserDashboardPayload {
    const cooldownProgress =
        getCooldownProgress(
            laser,
            'Laser',
        );

    return {
        ...(cooldownProgress !== undefined
            ? {
                  cooldownProgress,
              }
            : {}),

        action:
            mapLaserAction(
                laser,
                availableWeaponsCommands,
                weaponsOfficerAvailability,
            ),
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
        getSingleCommand(
            availableWeaponsCommands,

            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,

            'missile',
        );

    if (missileCommand) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .ACTIVE,

            command:
                mapWeaponsCommand(
                    missileCommand,
                ),
        };
    }

    return mapReadyButUnavailableAction(
        weaponsOfficerAvailability,
    );
}

function mapLaserAction(
    laser:
        BridgePlayerWeaponStatusPayload,
    availableWeaponsCommands:
        AvailableOfficerCommand[],
    weaponsOfficerAvailability:
        OfficerAvailabilityState,
): LaserDashboardPayload[
    'action'
] {
    if (
        laser.phase ===
            SHIP_WEAPON_PHASE.TARGETING ||
        laser.phase ===
            SHIP_WEAPON_PHASE.CHARGING
    ) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .ENGAGED_CURRENT_WORK,
        };
    }

    if (
        laser.phase !==
        SHIP_WEAPON_PHASE.READY
    ) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .DISABLED_SYSTEM,
        };
    }

    const laserCommand =
        getSingleCommand(
            availableWeaponsCommands,

            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

            'laser',
        );

    if (laserCommand) {
        return {
            state:
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .ACTIVE,

            command:
                mapWeaponsCommand(
                    laserCommand,
                ),
        };
    }

    return mapReadyButUnavailableAction(
        weaponsOfficerAvailability,
    );
}

function mapReadyButUnavailableAction(
    weaponsOfficerAvailability:
        OfficerAvailabilityState,
):
    MissileLauncherDashboardPayload[
        'action'
    ] {
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

function mapWeaponsCommand(
    command:
        AvailableOfficerCommand,
):
    NonNullable<
        MissileLauncherDashboardPayload[
            'action'
        ][
            'command'
        ]
    > {
    return {
        role:
            OFFICER_ROLE.WEAPONS,

        commandId:
            command.commandId,

        target:
            command.target,
    };
}

function getSingleCommand(
    commands:
        AvailableOfficerCommand[],

    commandId:
        AvailableOfficerCommand[
            'commandId'
        ],

    label:
        string,
): AvailableOfficerCommand | undefined {
    const matchingCommands =
        commands.filter(
            (command) => {
                return (
                    command.commandId ===
                    commandId
                );
            },
        );

    if (
        matchingCommands.length > 1
    ) {
        throw new Error(
            'Captain dashboard ' +
                label +
                ' row received multiple ' +
                'resolved commands',
        );
    }

    return matchingCommands[0];
}

function getCooldownProgress(
    weapon:
        BridgePlayerWeaponStatusPayload,
    label:
        string,
): number | undefined {
    if (
        weapon.phase !==
        SHIP_WEAPON_PHASE.COOLDOWN
    ) {
        return undefined;
    }

    const initialPhaseMs =
        weapon.initialPhaseMs;

    const remainingPhaseMs =
        weapon.remainingPhaseMs;

    if (
        initialPhaseMs === undefined ||
        remainingPhaseMs === undefined ||
        initialPhaseMs <= 0
    ) {
        throw new Error(
            label +
                ' cooldown dashboard snapshot ' +
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
