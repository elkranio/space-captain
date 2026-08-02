// tests/engine/encounter/enemy_offensive_pacing.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import EnemyDecisionPolicy from '../../../src/engine/encounter/combat/EnemyDecisionPolicy';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('Enemy offensive pacing', () => {
    it('blocks only the role that completed an offensive task', () => {
        const actor =
            createEnemyCombatActor();

        const policy =
            new EnemyDecisionPolicy();

        expect(
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            )?.id,
        ).toBe('missile_launcher_00');

        policy.onOffensiveTaskCompleted(
            actor,
            OFFICER_ROLE.WEAPONS,
        );

        expect(
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toBeUndefined();

        expect(
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.SCIENCE,
            )?.id,
        ).toBe('spam_projector_00');

        policy.advance(
            actor,
            actor.behavior
                .offensiveTaskDelayMs - 1,
        );

        expect(
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toBeUndefined();

        policy.advance(actor, 1);

        expect(
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            )?.id,
        ).toBe('laser_00');
    });
});

function createEnemyCombatActor() {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id: 'ship_enemy_combat_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_COMBAT_00,

            anchorId: stationId,
        }),
    );

    const engine = new EncounterEngine({
        playerHull: createPlayerHullFixture(),

        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId: stationId,
        },

        drive: createShipDriveFixture(),

        pointDefense:
            createPointDefenseFixture(),
    });

    const [loadedEvent] =
        engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT.ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    const actor =
        loadedEvent.state.actors[0];

    if (!actor) {
        throw new Error(
            'Expected enemy combat actor',
        );
    }

    return actor;
}
