// tests/engine/encounter/encounter_state_snapshot.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { SHIP_DRIVES } from '../../../src/engine/content/catalogs/ship_drives';
import { describe, expect, it } from 'vitest';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SPACE_ANCHOR_KIND } from '../../../src/engine/defs/universe';
import { ENCOUNTER_ANCHOR_KIND } from '../../../src/engine/encounter/anchors/encounter_anchor';
import { createEncounterState } from '../../../src/engine/encounter/state/create_encounter_state';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('encounter state snapshot', () => {
    it('does not share mutable station state with the persistent space node', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        } as const;

        const drive =
            createShipDriveFixture();
        const state = createEncounterState({
            node,

            navigation,

            playerHull: createPlayerHullFixture(),

            drive,
        });

        const persistentAnchor = node.anchors[0];
        const encounterAnchor = state.anchors[0];

        if (persistentAnchor.kind !== SPACE_ANCHOR_KIND.STATION) {
            throw new Error(`Expected persistent station anchor, received: ${persistentAnchor.kind}`);
        }

        if (encounterAnchor.kind !== ENCOUNTER_ANCHOR_KIND.STATION) {
            throw new Error(`Expected encounter station anchor, received: ${encounterAnchor.kind}`);
        }

        expect(state.navigation).not.toBe(navigation);
        expect(state.drive).not.toBe(drive);
        expect(state.drive.integrity).toBe(SHIP_DRIVES[drive.driveId].maxIntegrity);
        expect(drive).not.toHaveProperty('integrity');
        expect(encounterAnchor.localPosition).not.toBe(persistentAnchor.localPosition);
        expect(encounterAnchor.station).not.toBe(persistentAnchor.station);
        expect(encounterAnchor.station.contact).not.toBe(persistentAnchor.station.contact);

        encounterAnchor.localPosition.x = 999;
        encounterAnchor.station.name = 'CHANGED IN ENCOUNTER';
        encounterAnchor.station.contact.name = 'CHANGED CONTACT';

        expect(persistentAnchor.localPosition.x).toBe(0);
        expect(persistentAnchor.station.name).toBe('TEST STATION');
        expect(persistentAnchor.station.contact.name).toBe('TEST OPERATOR');
    });
});
