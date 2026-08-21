import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
// tests/engine/encounter/encounter_snapshot_reader.test.ts

import {
    describe, expect, it } from 'vitest';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import EncounterSnapshotReader from '../../../src/engine/encounter/snapshots/EncounterSnapshotReader';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';

describe('EncounterSnapshotReader', () => {
    it('recursively detaches nested public read models', () => {
        const { node, stationId } = createSingleStationNodeFixture();
        const state = createEncounterState({
            node,
            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
            playerHull: createPlayerHullFixture(),
            drive: createShipDriveFixture(),
        });

        state.combat.projectiles.push({
            id: 'projectile_test',
            designation: 'M1',
            kind: COMBAT_PROJECTILE_KIND.MISSILE,
            source: {
                kind: COMBAT_SOURCE_KIND.ACTOR,
                actorId: 'enemy_test',
            },
            sourceWeaponId: 'launcher_test',
            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },
            signature:
                MISSILE_SIGNATURE.A,

            damage: 1,
            timeToImpactMs: 1000,
            initialTimeToImpactMs: 1000,
        });

        const reader = new EncounterSnapshotReader(state);
        const [snapshot] = reader.getCombatProjectiles();

        expect(snapshot).not.toBe(state.combat.projectiles[0]);
        expect(snapshot.source).not.toBe(state.combat.projectiles[0].source);
        expect(snapshot.target).not.toBe(state.combat.projectiles[0].target);

        if (snapshot.source.kind !== COMBAT_SOURCE_KIND.ACTOR) {
            throw new Error('Expected actor projectile source');
        }

        snapshot.source.actorId = 'mutated_snapshot_actor';
        snapshot.timeToImpactMs = 0;

        expect(state.combat.projectiles[0]).toMatchObject({
            source: {
                kind: COMBAT_SOURCE_KIND.ACTOR,
                actorId: 'enemy_test',
            },
            timeToImpactMs: 1000,
        });
    });

    it('returns one detached safe encounter presentation frame', () => {
        const { node, stationId } = createSingleStationNodeFixture();
        const state = createEncounterState({
            node,
            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
            playerHull: createPlayerHullFixture(),
            drive: createShipDriveFixture(),
        });

        state.combat.projectiles.push({
            id: 'projectile_presentation',
            designation: 'M1',
            kind: COMBAT_PROJECTILE_KIND.MISSILE,
            source: {
                kind: COMBAT_SOURCE_KIND.ACTOR,
                actorId: 'enemy_test',
            },
            sourceWeaponId: 'launcher_test',
            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },
            signature:
                MISSILE_SIGNATURE.B,

            damage: 1,

            timeToImpactMs: 1000,
            initialTimeToImpactMs: 1000,
        });

        const reader =
            new EncounterSnapshotReader(
                state,
            );

        const snapshot =
            reader
                .getPresentationSnapshot();

        expect(
            snapshot.navigation,
        ).toEqual(
            state.navigation,
        );

        expect(
            snapshot.navigation,
        ).not.toBe(
            state.navigation,
        );

        expect(
            snapshot.player.hull,
        ).not.toBe(
            state.playerHull,
        );

        expect(
            snapshot.player.evade,
        ).toEqual(
            state.evade,
        );

        expect(
            snapshot.player.evade,
        ).not.toBe(
            state.evade,
        );

        expect(
            snapshot.space.anchors,
        ).toHaveLength(
            state.anchors.length,
        );

        expect(
            snapshot.space.anchors[0],
        ).not.toBe(
            state.anchors[0],
        );

        expect(
            snapshot.space.anchors[0],
        ).not.toHaveProperty(
            'station.contact',
        );

        expect(
            snapshot.incomingMissiles,
        ).toHaveLength(1);

        expect(
            snapshot.incomingMissiles[0],
        ).not.toHaveProperty(
            'signature',
        );

        snapshot.player.hull.hull = 0;

        expect(
            state.playerHull.hull,
        ).toBeGreaterThan(0);

        if (
            snapshot.navigation.kind !==
            PLAYER_SPACE_NAVIGATION_KIND
                .ANCHORED
        ) {
            throw new Error(
                'Expected anchored presentation navigation',
            );
        }

        snapshot.navigation.anchorId =
            'mutated_snapshot_anchor';

        expect(
            state.navigation,
        ).toEqual({
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId:
                stationId,
        });
    });

    it('keeps encounter-loaded event as a marker without engine state', () => {
        const { node, stationId } =
            createSingleStationNodeFixture();

        const engine =
            new EncounterEngine({
                node,

                navigation: {
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        stationId,
                },

                playerHull:
                    createPlayerHullFixture(),

                drive:
                    createShipDriveFixture(),
            });

        const [loadedEvent] =
            engine.drainEvents();

        expect(
            loadedEvent,
        ).toEqual({
            type:
                ENCOUNTER_EVENT
                    .ENCOUNTER_LOADED,
        });

        expect(
            loadedEvent,
        ).not.toHaveProperty(
            'state',
        );
    });
});
