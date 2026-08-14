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
            'activates the ready beamCannon from the exact resolved engine command',
            () => {
                const command =
                    createBeamCannonCommand();

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            beamCannon: {
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
                    beamCannon: {
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
            'shows beamCannon targeting and charging as current Weapons work',
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
                                beamCannon: {
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
                        beamCannon: {
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
            'maps beamCannon cooldown to progress and releases the officer',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            beamCannon: {
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
                    beamCannon: {
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
            'shows a ready beamCannon as officer-busy when Weapons is occupied elsewhere',
            () => {
                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            beamCannon: {
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
                    beamCannon: {
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
            'maps sticky mine ready, engaged, cooldown and officer-busy states',
            () => {
                const command =
                    createStickyMineCommand();

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            stickyMineDispenser: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,

                                ammo: {
                                    current: 6,
                                    max: 6,
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
                    stickyMineDispenser: {
                        ammo: {
                            current: 6,
                            max: 6,
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

                for (
                    const phase of [
                        SHIP_WEAPON_PHASE
                            .TARGETING,

                        SHIP_WEAPON_PHASE
                            .DISPENSING,
                    ]
                ) {
                    expect(
                        mapPlayerShipToBridgeDashboardPayload({
                            weapons: {
                                stickyMineDispenser: {
                                    phase,

                                    initialPhaseMs:
                                        2000,

                                    remainingPhaseMs:
                                        1000,

                                    ammo: {
                                        current: 5,
                                        max: 6,
                                    },
                                },
                            },

                            availableWeaponsCommands:
                                [],

                            weaponsOfficerAvailability:
                                OFFICER_AVAILABILITY_STATE
                                    .BUSY,
                        }),
                    ).toEqual({
                        stickyMineDispenser: {
                            ammo: {
                                current: 5,
                                max: 6,
                            },

                            action: {
                                state:
                                    BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                        .ENGAGED_CURRENT_WORK,
                            },
                        },
                    });
                }

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            stickyMineDispenser: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .COOLDOWN,

                                initialPhaseMs:
                                    15000,

                                remainingPhaseMs:
                                    9000,

                                ammo: {
                                    current: 3,
                                    max: 6,
                                },
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    stickyMineDispenser: {
                        ammo: {
                            current: 3,
                            max: 6,
                        },

                        cooldownProgress:
                            1 - 9000 / 15000,

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_SYSTEM,
                        },
                    },
                });

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            stickyMineDispenser: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,

                                ammo: {
                                    current: 6,
                                    max: 6,
                                },
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }),
                ).toEqual({
                    stickyMineDispenser: {
                        ammo: {
                            current: 6,
                            max: 6,
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

        it(
            'maps spam ready, engaged, cooldown and Science-busy states',
            () => {
                const command =
                    createSpamCommand();

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            spamProjector: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        availableScienceCommands: [
                            command,
                        ],

                        scienceOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    spamProjector: {
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ACTIVE,

                            command: {
                                role:
                                    OFFICER_ROLE
                                        .SCIENCE,

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

                for (
                    const phase of [
                        SHIP_WEAPON_PHASE
                            .TARGETING,

                        SHIP_WEAPON_PHASE
                            .CHANNELING,
                    ]
                ) {
                    expect(
                        mapPlayerShipToBridgeDashboardPayload({
                            weapons: {
                                spamProjector: {
                                    phase,

                                    initialPhaseMs:
                                        20000,

                                    remainingPhaseMs:
                                        10000,
                                },
                            },

                            availableWeaponsCommands:
                                [],

                            weaponsOfficerAvailability:
                                OFFICER_AVAILABILITY_STATE
                                    .AVAILABLE,

                            availableScienceCommands:
                                [],

                            scienceOfficerAvailability:
                                OFFICER_AVAILABILITY_STATE
                                    .BUSY,
                        }),
                    ).toEqual({
                        spamProjector: {
                            action: {
                                state:
                                    BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                        .ENGAGED_CURRENT_WORK,
                            },
                        },
                    });
                }

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            spamProjector: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .COOLDOWN,

                                initialPhaseMs:
                                    15000,

                                remainingPhaseMs:
                                    9000,
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        availableScienceCommands:
                            [],

                        scienceOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    spamProjector: {
                        cooldownProgress:
                            1 - 9000 / 15000,

                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_SYSTEM,
                        },
                    },
                });

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: {
                            spamProjector: {
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                            },
                        },

                        availableWeaponsCommands:
                            [],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        availableScienceCommands:
                            [],

                        scienceOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }),
                ).toEqual({
                    spamProjector: {
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


function createSpamCommand():
    AvailableOfficerCommand {
    return {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_FIRE_SPAM,

        label:
            'FIRE SPAM',

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON,

            weaponId:
                'spam_projector_player_00',

            actorId:
                'enemy_1',
        },
    };
}


function createStickyMineCommand():
    AvailableOfficerCommand {
    return {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_STICKY_MINES,

        label:
            'FIRE MINES',

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON,

            weaponId:
                'sticky_mine_dispenser_player_00',

            actorId:
                'enemy_1',
        },
    };
}


function createBeamCannonCommand():
    AvailableOfficerCommand {
    return {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_BEAM_CANNON,

        label:
            'FIRE BEAM CANNON',

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON,

            weaponId:
                'beam_cannon_player_00',

            actorId:
                'enemy_1',
        },
    };
}
