import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    DEFENSE_TURRETS,
} from '../../src/engine/content/catalogs/defense_turrets';
import {
    SHIELD_GENERATORS,
} from '../../src/engine/content/catalogs/shield_generators';
import {
    SHIP_DRIVES,
} from '../../src/engine/content/catalogs/ship_drives';
import {
    SHIP_CHASSIS,
} from '../../src/engine/content/catalogs/ship_chassis';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';
import {
    SHIP_EVADE_PHASE,
} from '../../src/engine/defs/ship_evade';
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
    createPlayerWeaponPresentationSnapshot,
} from '../../src/engine/encounter/snapshots/combat_presentation_snapshot';
import {
    mapPlayerShipToBridgeDashboardPayload,
} from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper';
import {
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import { createAnchoredPlayerCombatTestSetup } from '../engine/encounter/combat_test_support';

describe(
    'Bridge player ship dashboard mapper',
    () => {
        it('maps real mine aiming, cancellation and release snapshots', () => {
            const { engine, targetActor } = createAnchoredPlayerCombatTestSetup();
            targetActor.crewRoles = [];
            const command = engine.getAvailableCommands(OFFICER_ROLE.GUNNER).find((candidate) =>
                candidate.commandId === ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES,
            );
            if (!command) throw new Error('Expected mine command');

            const readMine = () => {
                const snapshot = engine.getCombatPresentationSnapshot();
                return mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                    weapons: snapshot.player.weapons.filter((weapon) =>
                        weapon.state.kind === SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER,
                    ),
                    availableGunnerCommands: snapshot.commandsByRole[OFFICER_ROLE.GUNNER],
                    gunnerOfficerAvailability: snapshot.player.officerAvailability[OFFICER_ROLE.GUNNER],
                    officerTasks: snapshot.player.officerTasks,
                })).weapons![0];
            };
            const ammoBefore = readMine().ammo!.current;
            engine.executeCommand({ role: OFFICER_ROLE.GUNNER, ...command });
            const [task] =
                engine
                    .getCombatPresentationSnapshot()
                    .player.officerTasks;
            if (task.durationMs === null) throw new Error('Expected timed mine aiming');
            engine.step(task.durationMs / 2);
            expect(readMine()).toMatchObject({
                ammo: { current: ammoBefore },
                targetingProgress: 0.5,
                action: {
                    state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK,
                    cancelTaskId: task.id,
                },
            });
            expect(readMine().cooldownProgress).toBeUndefined();

            engine.cancelTask(task.id);
            expect(readMine()).toMatchObject({
                ammo: { current: ammoBefore },
                action: { state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE },
            });
            expect(readMine().targetingProgress).toBeUndefined();
            expect(readMine().cooldownProgress).toBeUndefined();

            engine.executeCommand({ role: OFFICER_ROLE.GUNNER, ...command });
            engine.step(task.durationMs);
            expect(readMine()).toMatchObject({
                ammo: { current: ammoBefore - 1 },
                cooldownProgress: 0,
                action: { state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM },
            });
            expect(readMine().targetingProgress).toBeUndefined();
            expect(readMine().action.cancelTaskId).toBeUndefined();
            expect(
                engine
                    .getCombatPresentationSnapshot()
                    .player.officerTasks,
            ).toEqual([]);
            expect(engine.getCombatPresentationSnapshot().outgoingStickyMines).toHaveLength(1);
        });

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
                            .GUNNER_FIRE_MISSILE,
                        firstId,
                    );

                const secondCommand =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .GUNNER_FIRE_MISSILE,
                        secondId,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            createMissileSnapshot(
                                firstId,
                                5,
                            ),
                            createMissileSnapshot(
                                secondId,
                                4,
                            ),
                        ],

                        equipmentLayout: {
                            chassisId:
                                'player_00',

                            mounts: [
                                {
                                    slotId:
                                        'weapon_03',
                                    equipmentId:
                                        firstId,
                                },
                                {
                                    slotId:
                                        'weapon_01',
                                    equipmentId:
                                        secondId,
                                },
                            ],
                        },

                        availableGunnerCommands: [
                            firstCommand,
                            secondCommand,
                        ],

                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    })),
                ).toMatchObject({
                    chassis: {
                        blueprintId:
                            SHIP_CHASSIS.player_00.blueprintId,

                        slots:
                            SHIP_CHASSIS.player_00.slots,
                    },

                    weapons: [
                        {
                            id: firstId,
                            weaponId:
                                SHIP_WEAPON_ID
                                    .MISSILE_LAUNCHER_00,
                            iconId:
                                SHIP_WEAPONS[
                                    SHIP_WEAPON_ID.MISSILE_LAUNCHER_00
                                ].iconId,
                            shortName:
                                'M. LAUNCHER',
                            kind:
                                SHIP_WEAPON_KIND
                                    .MISSILE_LAUNCHER,
                            slotId:
                                'weapon_03',
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
                                            .GUNNER,
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
                            iconId:
                                SHIP_WEAPONS[
                                    SHIP_WEAPON_ID.MISSILE_LAUNCHER_00
                                ].iconId,
                            shortName:
                                'M. LAUNCHER',
                            kind:
                                SHIP_WEAPON_KIND
                                    .MISSILE_LAUNCHER,
                            slotId:
                                'weapon_01',
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
                                            .GUNNER,
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
                    createMissileSnapshot(
                        'missile_launcher_player_00',
                        5,
                    );
                targeting.state.phase =
                    SHIP_WEAPON_PHASE.TARGETING;
                targeting.state.phaseElapsedMs =
                    1500;
                targeting.phaseDurationMs =
                    6000;
                const cooldown =
                    createMissileSnapshot(
                        'missile_launcher_player_01',
                        4,
                    );
                cooldown.state.phase =
                    SHIP_WEAPON_PHASE.COOLDOWN;
                cooldown.state.cooldownRemainingMs =
                    10000;

                const empty =
                    createMissileSnapshot(
                        'missile_launcher_player_02',
                        0,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            targeting,
                            cooldown,
                            empty,
                        ],
                        availableGunnerCommands: [],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                        officerTasks: [
                            {
                                id:
                                    'missile_targeting_task_00',
                                kind:
                                    'gunner_fire_missile',
                                role:
                                    OFFICER_ROLE
                                        .GUNNER,
                                sourceCommandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .GUNNER_FIRE_MISSILE,
                                label:
                                    'MISSILE AIM',
                                durationMs:
                                    null,
                                elapsedMs:
                                    0,
                                canBeCancelledByPlayer:
                                    true,
                                weaponId:
                                    targeting.state.id,
                                targetActorId:
                                    'enemy_1',
                            },
                        ],
                    })).weapons,
                ).toEqual([
                    {
                        id:
                            targeting.state.id,
                        weaponId:
                            targeting.state.weaponId,
                        iconId:
                            SHIP_WEAPONS[targeting.state.weaponId].iconId,
                        shortName:
                            'M. LAUNCHER',
                        kind:
                            targeting.state.kind,
                        slotId:
                            'weapon_01',
                        ammo: {
                            current: 5,
                            max: 5,
                        },
                        targetingProgress:
                            0.25,
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ENGAGED_CURRENT_WORK,
                            cancelTaskId:
                                'missile_targeting_task_00',
                        },
                    },
                    {
                        id:
                            cooldown.state.id,
                        weaponId:
                            cooldown.state.weaponId,
                        iconId:
                            SHIP_WEAPONS[cooldown.state.weaponId].iconId,
                        shortName:
                            'M. LAUNCHER',
                        kind:
                            cooldown.state.kind,
                        slotId:
                            'weapon_02',
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
                            empty.state.id,
                        weaponId:
                            empty.state.weaponId,
                        iconId:
                            SHIP_WEAPONS[empty.state.weaponId].iconId,
                        shortName:
                            'M. LAUNCHER',
                        kind:
                            empty.state.kind,
                        slotId:
                            'weapon_03',
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

                const beam =
                    createBeamSnapshot(
                        beamId,
                    );
                beam.state.phase =
                    SHIP_WEAPON_PHASE.CHARGING;
                beam.state.phaseElapsedMs =
                    elapsedMs;
                beam.phaseDurationMs =
                    definition.chargeDurationMs;
                beam.state.cooldownRemainingMs =
                    definition
                        .cooldownDurationMs -
                    elapsedMs;

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            beam,
                        ],
                        availableGunnerCommands: [],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    })).weapons,
                ).toEqual([
                    {
                        id:
                            beamId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .BEAM_CANNON_00,
                        iconId:
                            definition.iconId,
                        shortName:
                            definition.shortName,
                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,
                        slotId:
                            'weapon_01',
                        powerCost:
                            definition.powerCost,
                        chargingProgress:
                            elapsedMs /
                            definition.chargeDurationMs,
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
                            .GUNNER_FIRE_BEAM_CANNON,
                        beamId,
                    );

                const mineCommand =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .GUNNER_FIRE_STICKY_MINES,
                        mineId,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            createBeamSnapshot(
                                beamId,
                            ),
                            createStickyMineSnapshot(
                                mineId,
                                6,
                            ),
                        ],
                        availableGunnerCommands: [
                            beamCommand,
                            mineCommand,
                        ],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    })).weapons,
                ).toEqual([
                    {
                        id: beamId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .BEAM_CANNON_00,
                        iconId:
                            SHIP_WEAPONS[
                                SHIP_WEAPON_ID.BEAM_CANNON_00
                            ].iconId,
                        shortName:
                            'BEAM CANNON',
                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,
                        slotId:
                            'weapon_01',
                        powerCost:
                            SHIP_WEAPONS[
                                SHIP_WEAPON_ID
                                    .BEAM_CANNON_00
                            ].powerCost,
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ACTIVE,
                            command: {
                                role:
                                    OFFICER_ROLE
                                        .GUNNER,
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
                        iconId:
                            SHIP_WEAPONS[
                                SHIP_WEAPON_ID.STICKY_MINE_DISPENSER_00
                            ].iconId,
                        shortName:
                            'MINE DISPENSER',
                        kind:
                            SHIP_WEAPON_KIND
                                .STICKY_MINE_DISPENSER,
                        slotId:
                            'weapon_02',
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
                                        .GUNNER,
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
            'maps Sticky Mine targeting progress',
            () => {
                const dispenser =
                    createStickyMineSnapshot(
                        'sticky_mine_dispenser_player_00',
                        5,
                    );

                dispenser.state.phase =
                    SHIP_WEAPON_PHASE.TARGETING;
                dispenser.state.phaseElapsedMs =
                    1000;
                dispenser.phaseDurationMs =
                    2000;

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            dispenser,
                        ],
                        availableGunnerCommands: [],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .BUSY,
                    })).weapons,
                ).toEqual([
                    {
                        id:
                            dispenser.state.id,
                        weaponId:
                            dispenser.state.weaponId,
                        iconId:
                            SHIP_WEAPONS[dispenser.state.weaponId].iconId,
                        shortName:
                            'MINE DISPENSER',
                        kind:
                            dispenser.state.kind,
                        slotId:
                            'weapon_01',
                        ammo: {
                            current: 5,
                            max: 6,
                        },
                        targetingProgress:
                            0.5,
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
            'uses Scientist availability and the exact projector command for SPAM',
            () => {
                const projectorId =
                    'spam_projector_player_00';
                const command =
                    createWeaponCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENTIST_FIRE_SPAM,
                        projectorId,
                    );

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            createSpamSnapshot(
                                projectorId,
                            ),
                        ],
                        availableGunnerCommands: [],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                        availableScientistCommands: [
                            command,
                        ],
                        scientistOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    })).weapons,
                ).toEqual([
                    {
                        id:
                            projectorId,
                        weaponId:
                            SHIP_WEAPON_ID
                                .SPAM_PROJECTOR_00,
                        iconId:
                            SHIP_WEAPONS[
                                SHIP_WEAPON_ID.SPAM_PROJECTOR_00
                            ].iconId,
                        shortName:
                            'SPAM PROJECTOR',
                        kind:
                            SHIP_WEAPON_KIND
                                .SPAM_PROJECTOR,
                        slotId:
                            'weapon_01',
                        action: {
                            state:
                                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                    .ACTIVE,
                            command: {
                                role:
                                    OFFICER_ROLE
                                        .SCIENTIST,
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
            'maps the stable ship status and exact PILOT_EVADE command',
            () => {
                const evadeCommand:
                    AvailableOfficerCommand = {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .PILOT_EVADE,

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .NONE,
                        },
                    };

                expect(
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [],
                        availableGunnerCommands: [],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        availablePilotCommands: [
                            evadeCommand,
                        ],

                        pilotOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,

                        officerTasks: [
                            {
                                id:
                                    'shield_deploy_00',

                                kind:
                                    'engineer_deploy_shield',

                                role:
                                    OFFICER_ROLE
                                        .ENGINEER,

                                sourceCommandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .ENGINEER_DEPLOY_SHIELD,

                                label:
                                    'DEPLOY SHIELD',

                                durationMs: 3000,
                                elapsedMs: 1000,

                                canBeCancelledByPlayer:
                                    true,

                                targetNode:
                                    'drive',
                            },
                        ],

                        playerStatus: {
                            hull: {
                                hull: 27,
                                maxHull: 30,
                            },

                            drive: {
                                id:
                                    'drive_player_00',

                                driveId:
                                    'basic_00',

                                integrity:
                                    1,
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

                                integrity: {
                                    current: 1,
                                    max: 2,
                                },
                            },

                            defenseTurret: {
                                state: {
                                    id:
                                        'defense_turret_player_00',

                                    defenseTurretId:
                                        'defense_turret_basic_00',

                                    phase:
                                        'ready',

                                    phaseElapsedMs:
                                        0,

                                    cooldownRemainingMs:
                                        0,

                                    targetProjectileId:
                                        null,
                                },

                                cooldownDurationMs:
                                    8000,

                                integrity: {
                                    current: 2,
                                    max: 2,
                                },
                            },

                            shieldGenerator: {
                                state: {
                                    id:
                                        'shield_generator_player_00',

                                    shieldGeneratorId:
                                        'shield_generator_basic_00',

                                    status:
                                        'online',

                                    phase:
                                        'ready',

                                    phaseElapsedMs:
                                        0,
                                },

                                cooldownDurationMs:
                                    8000,

                                integrity: {
                                    current: 2,
                                    max: 2,
                                },
                            },

                            activeShield: {
                                sourceEmitterId:
                                    'shield_generator_player_00',

                                targetNode:
                                    'hull',

                                remainingDurationMs:
                                    850,

                                initialDurationMs:
                                    5000,
                            },
                        },
                    })).status,
                ).toEqual({
                    hull: {
                        current: 27,
                        max: 30,
                    },

                    powerCore: {
                        id:
                            'power_core_player_00',

                        definitionId:
                            'power_core_basic_00',

                        iconId:
                            'power_core',

                        slotId:
                            'power_core',

                        current: 4,
                        max: 4,

                        integrity: {
                            current: 1,
                            max: 2,
                        },
                    },

                    drive: {
                        iconId:
                            SHIP_DRIVES.basic_00.iconId,

                        shortName:
                            'DRIVE',

                        evadePowerCost:
                            2,

                        slotId:
                            'drive',

                        integrity:
                            1,

                        maxIntegrity:
                            2,
                    },

                    defenseTurret: {
                        iconId:
                            DEFENSE_TURRETS.defense_turret_basic_00.iconId,

                        shortName:
                            'DEF. TURRET',

                        powerCost: 1,

                        phase:
                            'ready',

                        slotId:
                            'defense_01',

                        integrity: {
                            current: 2,
                            max: 2,
                        },

                        targets: [],

                        operatorBusy: false,
                    },

                    shield: {
                        iconId:
                            SHIELD_GENERATORS.shield_generator_basic_00.iconId,

                        shortName:
                            'SHIELD GEN.',

                        powerCost: 1,

                        status:
                            'online',

                        phase:
                            'ready',

                        slotId:
                            'defense_02',

                        integrity: {
                            current: 2,
                            max: 2,
                        },

                        deployment: {
                            targetNode:
                                'drive',

                            progress:
                                1 / 3,
                        },

                        active: {
                            targetNode:
                                'hull',

                            remainingDurationMs:
                                850,

                            initialDurationMs:
                                5000,
                        },
                    },

                    evadeAction: {
                        state:
                            BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                                .ACTIVE,

                        command: {
                            role:
                                OFFICER_ROLE.PILOT,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .PILOT_EVADE,

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
                    mapPlayerShipToBridgeDashboardPayload(createMapperInput({
                        weapons: [
                            createMissileSnapshot(
                                firstId,
                                5,
                            ),
                            createMissileSnapshot(
                                secondId,
                                5,
                            ),
                        ],
                        availableGunnerCommands: [
                            createWeaponCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .GUNNER_FIRE_MISSILE,
                                firstId,
                            ),
                            createWeaponCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .GUNNER_FIRE_MISSILE,
                                secondId,
                            ),
                        ],
                        gunnerOfficerAvailability:
                            OFFICER_AVAILABILITY_STATE
                                .AVAILABLE,
                    }));
                }).not.toThrow();
            },
        );
    },
);

type MapperInput = Parameters<
    typeof mapPlayerShipToBridgeDashboardPayload
>[0];

type MapperTestOverrides = {
    weapons?: MapperInput["player"]["weapons"];

    equipmentLayout?: {
        chassisId: string;
        mounts: MapperInput["player"]["mounts"];
    };

    availableGunnerCommands?: AvailableOfficerCommand[];

    gunnerOfficerAvailability?: MapperInput["player"]["officerAvailability"][typeof OFFICER_ROLE.GUNNER];

    availablePilotCommands?: AvailableOfficerCommand[];

    pilotOfficerAvailability?: MapperInput["player"]["officerAvailability"][typeof OFFICER_ROLE.PILOT];

    availableScientistCommands?: AvailableOfficerCommand[];

    scientistOfficerAvailability?: MapperInput["player"]["officerAvailability"][typeof OFFICER_ROLE.SCIENTIST];

    officerTasks?: MapperInput["player"]["officerTasks"];

    incomingMissiles?: MapperInput["incomingMissiles"];

    playerStatus?: Pick<
        MapperInput["player"],
        "hull" | "drive"
    > &
        Partial<
            Pick<
                MapperInput["player"],
                "powerCore" | "defenseTurret" | "shieldGenerator" | "activeShield"
            >
        >;
};

function createMapperInput(
    overrides: MapperTestOverrides,
): MapperInput {
    const hull =
        overrides.playerStatus?.hull ?? {
            hull: 30,
            maxHull: 30,
        };

    const drive =
        overrides.playerStatus?.drive ?? {
            id: 'drive_player_test',
            driveId: 'basic_00',
            integrity: 2,
        };

    const playerStatus =
        overrides.playerStatus;

    const weapons =
        overrides.weapons ?? [];

    const weaponSlotIds = [
        'weapon_01',
        'weapon_02',
        'weapon_03',
    ];

    const weaponMounts =
        weapons.map((weapon, index) => {
            const slotId =
                weaponSlotIds[index];

            if (!slotId) {
                throw new Error(
                    'Bridge dashboard mapper test fixture has no weapon slot',
                );
            }

            return {
                slotId,
                equipmentId:
                    weapon.state.id,
            };
        });

    const mounts =
        overrides.equipmentLayout
            ? [
                  ...overrides.equipmentLayout.mounts,

                  ...(overrides.equipmentLayout.mounts.some((mount) => {
                      return mount.equipmentId === drive.id;
                  })
                      ? []
                      : [
                            {
                                slotId: 'drive',
                                equipmentId: drive.id,
                            },
                        ]),
              ]
            : [
                  {
                      slotId: 'drive',
                      equipmentId: drive.id,
                  },

                  ...(playerStatus?.powerCore
                      ? [
                            {
                                slotId: 'power_core',
                                equipmentId:
                                    playerStatus.powerCore.state.id,
                            },
                        ]
                      : []),

                  ...(playerStatus?.defenseTurret
                      ? [
                            {
                                slotId: 'defense_01',
                                equipmentId:
                                    playerStatus.defenseTurret.state.id,
                            },
                        ]
                      : []),

                  ...(playerStatus?.shieldGenerator
                      ? [
                            {
                                slotId: 'defense_02',
                                equipmentId:
                                    playerStatus.shieldGenerator.state.id,
                            },
                        ]
                      : []),

                  ...weaponMounts,
              ];

    return {
        player: {
            hull,
            drive,

            evade: {
                phase:
                    SHIP_EVADE_PHASE.READY,

                phaseElapsedMs: 0,
                cooldownRemainingMs: 0,
            },

            mounts,

            weapons,

            ...(playerStatus?.powerCore
                ? {
                      powerCore: playerStatus.powerCore,
                  }
                : {}),

            ...(playerStatus?.defenseTurret
                ? {
                      defenseTurret: playerStatus.defenseTurret,
                  }
                : {}),

            ...(playerStatus?.shieldGenerator
                ? {
                      shieldGenerator: playerStatus.shieldGenerator,
                  }
                : {}),

            activeShield:
                playerStatus?.activeShield ?? null,

            officerAvailability: {
                [OFFICER_ROLE.SCIENTIST]:
                    overrides.scientistOfficerAvailability ??
                    OFFICER_AVAILABILITY_STATE.AVAILABLE,

                [OFFICER_ROLE.PILOT]:
                    overrides.pilotOfficerAvailability ??
                    OFFICER_AVAILABILITY_STATE.AVAILABLE,

                [OFFICER_ROLE.GUNNER]:
                    overrides.gunnerOfficerAvailability ??
                    OFFICER_AVAILABILITY_STATE.AVAILABLE,

                [OFFICER_ROLE.ENGINEER]:
                    OFFICER_AVAILABILITY_STATE.AVAILABLE,
            },

            officerTasks:
                overrides.officerTasks ?? [],

            officerStatuses: [],
        },

        commandsByRole: {
            [OFFICER_ROLE.SCIENTIST]:
                overrides.availableScientistCommands ?? [],

            [OFFICER_ROLE.PILOT]:
                overrides.availablePilotCommands ?? [],

            [OFFICER_ROLE.GUNNER]:
                overrides.availableGunnerCommands ?? [],

            [OFFICER_ROLE.ENGINEER]:
                [],
        },

        incomingMissiles:
            overrides.incomingMissiles ?? [],

        chassisId:
            overrides.equipmentLayout?.chassisId ??
            'player_00',
    };
}

function createMissileSnapshot(
    id:
        string,
    ammoCurrent:
        number,
) {
    return createPlayerWeaponPresentationSnapshot({
        id,
        weaponId:
            SHIP_WEAPON_ID
                .MISSILE_LAUNCHER_00,
        kind:
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER,
        phase:
            SHIP_WEAPON_PHASE.READY,
        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,
        ammoCount:
            ammoCurrent,
    });
}

function createBeamSnapshot(
    id:
        string,
) {
    return createPlayerWeaponPresentationSnapshot({
        id,
        weaponId:
            SHIP_WEAPON_ID
                .BEAM_CANNON_00,
        kind:
            SHIP_WEAPON_KIND
                .BEAM_CANNON,
        phase:
            SHIP_WEAPON_PHASE.READY,
        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,
    });
}

function createStickyMineSnapshot(
    id:
        string,
    ammoCurrent:
        number,
) {
    return createPlayerWeaponPresentationSnapshot({
        id,
        weaponId:
            SHIP_WEAPON_ID
                .STICKY_MINE_DISPENSER_00,
        kind:
            SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER,
        phase:
            SHIP_WEAPON_PHASE.READY,
        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,
        ammoCount:
            ammoCurrent,
    });
}

function createSpamSnapshot(
    id:
        string,
) {
    return createPlayerWeaponPresentationSnapshot({
        id,
        weaponId:
            SHIP_WEAPON_ID
                .SPAM_PROJECTOR_00,
        kind:
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR,
        phase:
            SHIP_WEAPON_PHASE.READY,
        phaseElapsedMs: 0,
        cooldownRemainingMs: 0,
        activeChannelId: null,
        activeTargetActorId: null,
        channelPurged: false,
    });
}

function createWeaponCommand(
    commandId:
        EncounterOfficerCommandId,
    weaponId:
        string,
): AvailableOfficerCommand {
    if (commandId === ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON) {
        return {
            commandId,
            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE,
                weaponId, actorId: 'enemy_1', node: { kind: 'hull' },
            },
        };
    }
    return {
        commandId,
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
