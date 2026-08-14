import {
    describe,
    expect,
    it,
} from 'vitest';
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
                targeting.initialPhaseMs =
                    3000;
                targeting.remainingPhaseMs =
                    1500;

                const cooldown =
                    createMissileStatus(
                        'missile_launcher_player_01',
                        4,
                    );
                cooldown.phase =
                    SHIP_WEAPON_PHASE.COOLDOWN;
                cooldown.initialPhaseMs =
                    15000;
                cooldown.remainingPhaseMs =
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
                            1 - 10000 / 15000,
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
