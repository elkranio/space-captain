import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../src/engine/encounter/model/command';
import {
    OFFICER_AVAILABILITY_STATE,
} from '../../src/engine/encounter/model/officer_availability';
import {
    mapPlayerShipToBridgeDashboardPayload,
} from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper';
import {
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerWeaponStatusPayload,
} from '../../src/app/scenes/game/bridge/events/bridge_event';

describe(
    'Bridge player ship dashboard mapper',
    () => {
        it(
            'maps multiple same-kind weapons to their exact resolved commands',
            () => {
                const firstId =
                    'missile_launcher_player_00';
                const secondId =
                    'missile_launcher_player_01';

                const firstCommand =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE,
                        firstId,
                    );

                const secondCommand =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_MISSILE,
                        secondId,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [
                            createMissileStatus(
                                firstId,
                                5,
                            ),
                            createMissileStatus(
                                secondId,
                                4,
                            ),
                        ],

                        availableWeaponsCommands: [
                            firstCommand,
                            secondCommand,
                        ],

                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }),
                ).toEqual({
                    weapons: [
                        {
                            id: firstId,
                            weaponId:
                                SHIP_WEAPON_ID
                                    .MISSILE_LAUNCHER_00,
                            kind:
                                SHIP_WEAPON_KIND
                                    .MISSILE_LAUNCHER,
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
                                        firstCommand
                                            .commandId,
                                    target:
                                        firstCommand
                                            .target,
                                },
                            },
                        },
                        {
                            id: secondId,
                            weaponId:
                                SHIP_WEAPON_ID
                                    .MISSILE_LAUNCHER_00,
                            kind:
                                SHIP_WEAPON_KIND
                                    .MISSILE_LAUNCHER,
                            ammo: {
                                current: 4,
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
                                        secondCommand
                                            .commandId,
                                    target:
                                        secondCommand
                                            .target,
                                },
                            },
                        },
                    ],
                });
            },
        );

        it(
            'keeps per-instance engaged, cooldown and empty-ammo states independent',
            () => {
                const targeting =
                    createMissileStatus(
                        'missile_launcher_player_00',
                        5,
                    );
                targeting.phase =
                    SHIP_WEAPON_PHASE.TARGETING;
                const cooldown =
                    createMissileStatus(
                        'missile_launcher_player_01',
                        4,
                    );
                cooldown.phase =
                    SHIP_WEAPON_PHASE.COOLDOWN;
                cooldown.initialCooldownMs =
                    15000;
                cooldown.remainingCooldownMs =
                    10000;

                const empty =
                    createMissileStatus(
                        'missile_launcher_player_02',
                        0,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [
                            targeting,
                            cooldown,
                            empty,
                        ],
                        availableWeaponsCommands: [],
                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }).weapons,
                ).toEqual([
                    {
                        id:
                            targeting.id,
                        weaponId:
                            targeting.weaponId,
                        kind:
                            targeting.kind,
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
                    {
                        id:
                            cooldown.id,
                        weaponId:
                            cooldown.weaponId,
                        kind:
                            cooldown.kind,
                        ammo: {
                            current: 4,
                            max: 5,
                        },
                        cooldownProgress:
                            expect.closeTo(
                                1 - 10000 / 15000,
                                10,
                            ),
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .DISABLED_SYSTEM,
                        },
                    },
                    {
                        id:
                            empty.id,
                        weaponId:
                            empty.weaponId,
                        kind:
                            empty.kind,
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
                ]);
            },
        );

        it(
            'shows committed Beam cooldown while the Beam is still charging',
            () => {
                const definition =
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ];

                if (
                    definition.kind !==
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON
                ) {
                    throw new Error(
                        'Expected Beam Cannon definition',
                    );
                }

                const elapsedMs = 3000;
                const beamId =
                    'beam_cannon_player_00';

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [
                            {
                                id:
                                    beamId,
                                weaponId:
                                    SHIP_WEAPON_ID
                                        .BEAM_CANNON_00,
                                kind:
                                    SHIP_WEAPON_KIND
                                        .BEAM_CANNON,
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .CHARGING,
                                initialCooldownMs:
                                    definition
                                        .cooldownDurationMs,
                                remainingCooldownMs:
                                    definition
                                        .cooldownDurationMs -
                                    elapsedMs,
                            },
                        ],
                        availableWeaponsCommands: [],
                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    }).weapons,
                ).toEqual([
                    {
                        id:
                            beamId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .BEAM_CANNON_00,
                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,
                        cooldownProgress:
                            1 -
                            (definition
                                .cooldownDurationMs -
                                elapsedMs) /
                                definition
                                    .cooldownDurationMs,
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ENGAGED_CURRENT_WORK,
                        },
                    },
                ]);
            },
        );

        it(
            'maps every weapon kind without collapsing the installed list',
            () => {
                const beamId =
                    'beam_cannon_player_00';
                const mineId =
                    'sticky_mine_dispenser_player_00';

                const beamCommand =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_BEAM_CANNON,
                        beamId,
                    );

                const mineCommand =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_STICKY_MINES,
                        mineId,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [
                            {
                                id: beamId,
                                weaponId:
                                    SHIP_WEAPON_ID
                                        .BEAM_CANNON_00,
                                kind:
                                    SHIP_WEAPON_KIND
                                        .BEAM_CANNON,
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                            },
                            {
                                id: mineId,
                                weaponId:
                                    SHIP_WEAPON_ID
                                        .STICKY_MINE_DISPENSER_00,
                                kind:
                                    SHIP_WEAPON_KIND
                                        .STICKY_MINE_DISPENSER,
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                                ammo: {
                                    current: 6,
                                    max: 6,
                                },
                            },
                        ],
                        availableWeaponsCommands: [
                            beamCommand,
                            mineCommand,
                        ],
                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }).weapons,
                ).toEqual([
                    {
                        id: beamId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .BEAM_CANNON_00,
                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ACTIVE,
                            command: {
                                role:
                                    OFFICER_ROLE
                                        .WEAPONS,
                                commandId:
                                    beamCommand
                                        .commandId,
                                target:
                                    beamCommand
                                        .target,
                            },
                        },
                    },
                    {
                        id: mineId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .STICKY_MINE_DISPENSER_00,
                        kind:
                            SHIP_WEAPON_KIND
                                .STICKY_MINE_DISPENSER,
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
                                    mineCommand
                                        .commandId,
                                target:
                                    mineCommand
                                        .target,
                            },
                        },
                    },
                ]);
            },
        );

        it(
            'uses Science availability and the exact projector command for SPAM',
            () => {
                const projectorId =
                    'spam_projector_player_00';
                const command =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENCE_FIRE_SPAM,
                        projectorId,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [
                            {
                                id:
                                    projectorId,
                                weaponId:
                                    SHIP_WEAPON_ID
                                        .SPAM_PROJECTOR_00,
                                kind:
                                    SHIP_WEAPON_KIND
                                        .SPAM_PROJECTOR,
                                phase:
                                    SHIP_WEAPON_PHASE
                                        .READY,
                            },
                        ],
                        availableWeaponsCommands: [],
                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                        availableScienceCommands: [
                            command,
                        ],
                        scienceOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }).weapons,
                ).toEqual([
                    {
                        id:
                            projectorId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .SPAM_PROJECTOR_00,
                        kind:
                            SHIP_WEAPON_KIND
                                .SPAM_PROJECTOR,
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
                ]);
            },
        );

        it(
            'maps the stable ship status and exact HELM_EVADE command',
            () => {
                const evadeCommand:
                    AvailableOfficerCommand = {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .HELM_EVADE,

                        label:
                            'EVADE',

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .NONE,
                        },
                    };

                expect(
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [],
                        availableWeaponsCommands: [],
                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        availableHelmCommands: [
                            evadeCommand,
                        ],

                        helmOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        playerStatus: {
                            hull: {
                                hull: 27,
                                maxHull: 30,
                            },

                            drive: {
                                id:
                                    'drive_player_00',

                                driveId:
                                    'drive_basic_00',

                                status:
                                    'online',
                            },

                            powerCore: {
                                state: {
                                    id:
                                        'power_core_player_00',

                                    powerCoreId:
                                        'power_core_basic_00',

                                    charges: 4,

                                    rechargeElapsedMs:
                                        0,
                                },

                                capacity: 4,
                            },
                        },
                    }).status,
                ).toEqual({
                    hull: {
                        current: 27,
                        max: 30,
                    },

                    powerCore: {
                        current: 4,
                        max: 4,
                    },

                    drive: {
                        status:
                            'online',
                    },

                    evadeAction: {
                        state:
                            BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                .ACTIVE,

                        command: {
                            role:
                                OFFICER_ROLE.HELM,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .HELM_EVADE,

                            target:
                                evadeCommand.target,
                        },
                    },
                });
            },
        );

        it(
            'distinguishes duplicate command ids by runtime weapon target',
            () => {
                const firstId =
                    'missile_launcher_player_00';
                const secondId =
                    'missile_launcher_player_01';

                expect(() => {
                    mapPlayerShipToBridgeDashboardPayload({
                        weapons: [
                            createMissileStatus(
                                firstId,
                                5,
                            ),
                            createMissileStatus(
                                secondId,
                                5,
                            ),
                        ],
                        availableWeaponsCommands: [
                            createWeaponCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_MISSILE,
                                firstId,
                            ),
                            createWeaponCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_MISSILE,
                                secondId,
                            ),
                        ],
                        weaponsOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    });
                }).not.toThrow();
            },
        );
    },
);

function createMissileStatus(
    id:
        string,
    ammoCurrent:
        number,
): BridgePlayerWeaponStatusPayload {
    return {
        id,
        weaponId:
            SHIP_WEAPON_ID
                .MISSILE_LAUNCHER_00,
        kind:
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER,
        phase:
            SHIP_WEAPON_PHASE.READY,
        ammo: {
            current:
                ammoCurrent,
            max: 5,
        },
    };
}

function createWeaponCommand(
    commandId:
        EncounterOfficerCommandId,
    weaponId:
        string,
): AvailableOfficerCommand {
    return {
        commandId,
        label:
            'FIRE',
        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON,
            weaponId,
            actorId:
                'enemy_1',
        },
    };
}
