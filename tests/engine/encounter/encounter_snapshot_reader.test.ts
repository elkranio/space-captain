// tests/engine/encounter/encounter_snapshot_reader.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_DRIVE_STATUS } from '../../../src/engine/defs/ship_drive';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import EncounterSnapshotReader from '../../../src/engine/encounter/snapshots/EncounterSnapshotReader';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { MISSILE_ID } from '../../../src/engine/defs/missile';

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
            drive: createShipDriveFixture(),        });

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
            identification: {
                status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
            },
            missileId: MISSILE_ID.RED_00,
            timeToImpactMs: 1000,
            initialTimeToImpactMs: 1000,
        });

        const reader = new EncounterSnapshotReader(state);
        const [snapshot] = reader.getCombatProjectiles();

        expect(snapshot).not.toBe(state.combat.projectiles[0]);
        expect(snapshot.source).not.toBe(state.combat.projectiles[0].source);
        expect(snapshot.target).not.toBe(state.combat.projectiles[0].target);
        expect(snapshot.identification).not.toBe(
            state.combat.projectiles[0].identification,
        );

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

    it('detaches the complete encounter-loaded event from engine state', () => {
        const { node, stationId } = createSingleStationNodeFixture();
        const engine = new EncounterEngine({
            node,
            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
            playerHull: createPlayerHullFixture(),
            drive: createShipDriveFixture(),        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error('Expected encounter-loaded event');
        }

        loadedEvent.state.playerHull.hull = 0;
        loadedEvent.state.drive.status = SHIP_DRIVE_STATUS.DISABLED;

        expect(engine.getPlayerHullState().hull).toBeGreaterThan(0);
        expect(engine.getDriveState().status).toBe(SHIP_DRIVE_STATUS.ONLINE);
    });
});
