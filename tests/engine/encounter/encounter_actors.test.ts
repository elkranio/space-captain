// tests/engine/encounter/encounter_actors.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_CHASSIS,
} from '../../../src/engine/content/catalogs/ship_chassis';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_CHASSIS_ID,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_ACTOR_KIND,
} from '../../../src/engine/encounter/actors/encounter_actor';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import {
    createEncounterState,
} from '../../../src/engine/encounter/state/create_encounter_state';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createShipBehaviorFixture,
} from '../../fixtures/engine/ship_behavior_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('encounter actors', () => {
    it('spawns a runtime ship separately from navigation anchors', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const state = createEncounterState({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,
                anchorId: stationId,
            },

            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
        });

        const store =
            new EncounterStateStore(state);

        expect(state.actors).toEqual([]);

        const drive =
            createShipDriveFixture();

        const behavior =
            createShipBehaviorFixture();

        const actor = store.spawnShipActor({
            actorId: 'ship_test_00',
            chassisId:
                SHIP_CHASSIS_ID.GENERIC_00,
            anchorId: stationId,

            team: ENCOUNTER_TEAM.NEUTRAL,

            hull: 3,
            maxHull: 3,

            drive,            behavior,

            crewRoles: [
                OFFICER_ROLE.WEAPONS,
            ],

            weapons: [],
        });

        expect(actor).toEqual({
            id: 'ship_test_00',
            kind: ENCOUNTER_ACTOR_KIND.SHIP,

            displayName:
                SHIP_CHASSIS[
                    SHIP_CHASSIS_ID.GENERIC_00
                ].name,

            team: ENCOUNTER_TEAM.NEUTRAL,

            anchorId: stationId,
            chassisId:
                SHIP_CHASSIS_ID.GENERIC_00,

            hull: 3,
            maxHull: 3,

            drive: {
                ...drive,
            },

            behavior: {
                ...behavior,
            },

            crewRoles: [
                OFFICER_ROLE.WEAPONS,
            ],

            crewTraitsByRole: {
                [OFFICER_ROLE.WEAPONS]: [],
            },

            decision: {
                decisionTickRemainingMs: 0,
            },

            crewTasks: {},

            threatObservations: [],

            hasUsedOpeningDisruptionPulse: false,

            weapons: [],
        });

        expect(actor.drive).not.toBe(drive);
        expect(actor.behavior).not.toBe(
            behavior,
        );

        expect(
            store.findAnchorById(actor.id),
        ).toBeUndefined();

        expect(
            store.findActorById(actor.id),
        ).toEqual(actor);

        expect(
            store.getActorsAtAnchor(stationId),
        ).toEqual([actor]);

        expect(
            store.getActorsAtAnchor(
                'another_anchor',
            ),
        ).toEqual([]);
    });

    it('rejects an unknown anchor and duplicate actor id', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const state = createEncounterState({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,
                anchorId: stationId,
            },

            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
        });

        const store =
            new EncounterStateStore(state);

        expect(() => {
            store.spawnShipActor({
                actorId:
                    'ship_missing_anchor',
                chassisId:
                    SHIP_CHASSIS_ID
                        .GENERIC_00,
                anchorId: 'missing_anchor',

                team:
                    ENCOUNTER_TEAM.NEUTRAL,

                hull: 3,
                maxHull: 3,

                drive:
                    createShipDriveFixture(),
                behavior:
                    createShipBehaviorFixture(),

                crewRoles: [
                    OFFICER_ROLE.WEAPONS,
                ],

                weapons: [],
            });
        }).toThrow(
            'Cannot spawn ship actor: ' +
            'anchor not found: missing_anchor',
        );

        store.spawnShipActor({
            actorId: 'ship_test_00',
            chassisId:
                SHIP_CHASSIS_ID.GENERIC_00,
            anchorId: stationId,

            team: ENCOUNTER_TEAM.NEUTRAL,

            hull: 3,
            maxHull: 3,

            drive:
                createShipDriveFixture(),
            behavior:
                createShipBehaviorFixture(),

            crewRoles: [
                OFFICER_ROLE.WEAPONS,
            ],

            weapons: [],
        });

        expect(() => {
            store.spawnShipActor({
                actorId: 'ship_test_00',
                chassisId:
                    SHIP_CHASSIS_ID
                        .GENERIC_00,
                anchorId: stationId,

                team:
                    ENCOUNTER_TEAM.NEUTRAL,

                hull: 3,
                maxHull: 3,

                drive:
                    createShipDriveFixture(),
                behavior:
                    createShipBehaviorFixture(),

                crewRoles: [
                    OFFICER_ROLE.WEAPONS,
                ],

                weapons: [],
            });
        }).toThrow(
            'Encounter actor already exists: ' +
            'ship_test_00',
        );
    });

    it('copies persistent node ship state into encounter runtime state', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const nodeActor =
            ShipNodeActorFactory.create({
                id: 'ship_generic_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_00,

                anchorId: stationId,
            });

        const nodeWeapon =
            nodeActor.weapons[0];

        if (
            nodeWeapon.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected persistent missile launcher',
            );
        }

        const initialAmmoCount =
            nodeWeapon.ammoCount;

        node.actors.push(nodeActor);

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },
        });

        const [event] =
            engine.drainEvents();

        expect(event).toEqual({
            type:
                ENCOUNTER_EVENT
                    .ENCOUNTER_LOADED,
        });

        if (
            event.type !==
            ENCOUNTER_EVENT.ENCOUNTER_LOADED
        ) {
            throw new Error(
                'Expected encounter loaded event, ' +
                'received: ' + event.type,
            );
        }

        const encounterActor =
            getMutableEncounterStateForTest(
                engine,
            ).actors[0];

        expect(encounterActor).toMatchObject({
            id:
                nodeActor.id,

            kind:
                ENCOUNTER_ACTOR_KIND
                    .SHIP,

            displayName:
                SHIP_CHASSIS[
                    nodeActor.chassisId
                ].name,

            team:
                nodeActor.team,

            anchorId:
                nodeActor.anchorId,

            chassisId:
                nodeActor.chassisId,

            hull:
                nodeActor.hull,

            maxHull:
                nodeActor.maxHull,

            drive:
                nodeActor.drive,

            behavior:
                nodeActor.behavior,

            crewRoles:
                nodeActor.crewRoles,

            weapons: [
                nodeWeapon,
            ],
        });

        expect(encounterActor).not.toBe(
            nodeActor,
        );

        expect(encounterActor.drive).not.toBe(
            nodeActor.drive,
        );

        expect(
            encounterActor.behavior,
        ).not.toBe(nodeActor.behavior);

        expect(
            encounterActor.crewRoles,
        ).not.toBe(nodeActor.crewRoles);

        expect(
            encounterActor.crewTraitsByRole,
        ).not.toBe(
            nodeActor.crewTraitsByRole,
        );

        for (const role of nodeActor.crewRoles) {
            expect(
                encounterActor
                    .crewTraitsByRole[role],
            ).not.toBe(
                nodeActor
                    .crewTraitsByRole[role],
            );
        }

        expect(
            encounterActor.weapons,
        ).not.toBe(nodeActor.weapons);

        const encounterWeapon =
            encounterActor.weapons[0];

        expect(encounterWeapon).not.toBe(
            nodeWeapon,
        );

        if (
            encounterWeapon.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Expected encounter missile launcher',
            );
        }

        encounterActor.hull = 1;

        encounterActor.drive.status =
            SHIP_DRIVE_STATUS.DISABLED;

        encounterActor.behavior
            .aggression = 0;

        encounterActor.crewRoles.length = 0;

        encounterWeapon.ammoCount = 4;
        encounterWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        expect(nodeActor.hull).toBe(
            nodeActor.maxHull,
        );

        expect(nodeActor.drive.status).toBe(
            SHIP_DRIVE_STATUS.ONLINE,
        );

        expect(
            nodeActor.behavior
                .aggression,
        ).toBe(50);

        expect(
            nodeActor.crewRoles.length,
        ).toBeGreaterThan(0);

        expect(nodeWeapon.ammoCount).toBe(
            initialAmmoCount,
        );

        expect(nodeWeapon.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });
});
