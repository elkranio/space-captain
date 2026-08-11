import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
} from '../../src/engine/encounter/model/command';
import {
    OFFICER_AVAILABILITY_STATE,
} from '../../src/engine/encounter/model/officer_availability';
import {
    mapPlayerShipToBridgeDashboardPayload,
} from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper';
import {
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
} from '../../src/app/scenes/game/bridge/events/bridge_event';

describe(
    'Bridge player ship dashboard mapper',
    () => {
        it(
            'uses exact resolved missile command for active action',
            () => {
                const command =
                    createMissileCommand();

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            missileLauncher: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,

                                ammo: {
                                    current: 5,
                                    max: 5,
                                },
                            },
                        },

                        availableWeaponsCommands: [
                            command,
                        ],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    missileLauncher: {
                        ammo: {
                            current: 5,
                            max: 5,
                        },

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ACTIVE,

                            command: {
                                role:
                                    OFFICER_ROLE
                                        .WEAPONS,

                                commandId:
                                    command
                                        .commandId,

                                target:
                                    command
                                        .target,
                            },
                        },
                    },
                });
            },
        );

        it(
            'shows current missile targeting as engaged work',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            missileLauncher: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .TARGETING,

                                initialPhaseMs:
                                    3000,

                                remainingPhaseMs:
                                    1500,

                                ammo: {
                                    current: 5,
                                    max: 5,
                                },
                            },
                        },

                        availableWeaponsCommands: [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }),
                ).toEqual({
                    missileLauncher: {
                        ammo: {
                            current: 5,
                            max: 5,
                        },

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ENGAGED_CURRENT_WORK,
                        },
                    },
                });
            },
        );

        it(
            'maps launcher cooldown to elapsed progress and system-disabled action',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            missileLauncher: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .COOLDOWN,

                                initialPhaseMs:
                                    15000,

                                remainingPhaseMs:
                                    10000,

                                ammo: {
                                    current: 4,
                                    max: 5,
                                },
                            },
                        },

                        availableWeaponsCommands: [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    missileLauncher: {
                        ammo: {
                            current: 4,
                            max: 5,
                        },

                        cooldownProgress:
                            1 - 10000 / 15000,

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_SYSTEM,
                        },
                    },
                });
            },
        );

        it(
            'keeps empty launcher disabled without cooldown bar',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            missileLauncher: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,

                                ammo: {
                                    current: 0,
                                    max: 5,
                                },
                            },
                        },

                        availableWeaponsCommands: [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    missileLauncher: {
                        ammo: {
                            current: 0,
                            max: 5,
                        },

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_SYSTEM,
                        },
                    },
                });
            },
        );

        it(
            'activates the ready laser from the exact resolved engine command',
            () => {
                const command =
                    createLaserCommand();

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            laser: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                            },
                        },

                        availableWeaponsCommands: [
                            command,
                        ],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    laser: {
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ACTIVE,

                            command: {
                                role:
                                    OFFICER_ROLE
                                        .WEAPONS,

                                commandId:
                                    command
                                        .commandId,

                                target:
                                    command
                                        .target,
                            },
                        },
                    },
                });
            },
        );

        it(
            'shows laser targeting and charging as current Weapons work',
            () => {
                for (
                    const phase of [
                        SHIP_WEAPON_PHASE
                            .TARGETING,

                        SHIP_WEAPON_PHASE
                            .CHARGING,
                    ]
                ) {
                    expect(
                        mapPlayerShipToBridgeDashboardPayload({
                            weapons: {
                                laser: {
                                    phase,

                                    initialPhaseMs:
                                        12000,

                                    remainingPhaseMs:
                                        8000,
                                },
                            },

                            availableWeaponsCommands:
                                [],

                            weaponsOfficerAvailability:
                                OFFICER_AVAILABILITY_STATE
                                    .BUSY,
                        }),
                    ).toEqual({
                        laser: {
                            action: {
                                state:
                                    BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                        .ENGAGED_CURRENT_WORK,
                            },
                        },
                    });
                }
            },
        );

        it(
            'maps laser cooldown to progress and releases the officer',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            laser: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .COOLDOWN,

                                initialPhaseMs:
                                    10000,

                                remainingPhaseMs:
                                    2500,
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    laser: {
                        cooldownProgress:
                            1 - 2500 / 10000,

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_SYSTEM,
                        },
                    },
                });
            },
        );

        it(
            'shows a ready laser as officer-busy when Weapons is occupied elsewhere',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            laser: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }),
                ).toEqual({
                    laser: {
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_OFFICER_BUSY,
                        },
                    },
                });
            },
        );

        it(
            'distinguishes officer busy from unavailable system',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            missileLauncher: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,

                                ammo: {
                                    current: 5,
                                    max: 5,
                                },
                            },
                        },

                        availableWeaponsCommands: [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }),
                ).toEqual({
                    missileLauncher: {
                        ammo: {
                            current: 5,
                            max: 5,
                        },

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_OFFICER_BUSY,
                        },
                    },
                });
            },
        );
    },
);

function createMissileCommand():
    AvailableOfficerCommand {
    return {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,

        label:
            'FIRE MISSILE',

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON,

            weaponId:
                'player_missile_launcher',

            actorId:
                'enemy_1',
        },
    };
}


function createLaserCommand():
    AvailableOfficerCommand {
    return {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

        label:
            'FIRE LASER',

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON,

            weaponId:
                'laser_player_00',

            actorId:
                'enemy_1',
        },
    };
}
