// tests/engine/encounter/enemy_decision_policy.test.ts

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
import {
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
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

describe('Enemy decision policy', () => {
    it('rotates weapons in loadout order and skips unavailable weapons', () => {
        const actor = createEnemyCombatActor();
        const policy =
            new EnemyDecisionPolicy();

        const missile =
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            );

        expect(missile?.id).toBe(
            'missile_launcher_00',
        );

        if (!missile) {
            throw new Error(
                'Expected missile launcher',
            );
        }

        missile.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        const laser =
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            );

        expect(laser?.id).toBe('laser_00');

        if (!laser) {
            throw new Error(
                'Expected laser',
            );
        }

        laser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        const mines =
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            );

        expect(mines?.id).toBe(
            'sticky_mine_dispenser_00',
        );

        if (!mines) {
            throw new Error(
                'Expected sticky-mine dispenser',
            );
        }

        mines.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        missile.phase =
            SHIP_WEAPON_PHASE.READY;

        const wrapped =
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.WEAPONS,
            );

        expect(wrapped?.id).toBe(
            'missile_launcher_00',
        );

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.WEAPONS
                ],
        ).toBe(1);
    });

    it('keeps science weapon selection independent from weapons', () => {
        const actor = createEnemyCombatActor();
        const policy =
            new EnemyDecisionPolicy();

        policy.selectWeapon(
            actor,
            OFFICER_ROLE.WEAPONS,
        );

        const scienceWeapon =
            policy.selectWeapon(
                actor,
                OFFICER_ROLE.SCIENCE,
            );

        expect(scienceWeapon?.id).toBe(
            'spam_projector_00',
        );

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.WEAPONS
                ],
        ).toBe(1);

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.SCIENCE
                ],
        ).toBe(0);
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
