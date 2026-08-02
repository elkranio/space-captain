// tests/engine/encounter/new_game_enemy_combat_sequence.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
import {
    SHIP_BEHAVIOR_PRESETS,
    SHIP_BEHAVIOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_behaviors';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_ID,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';

const OFFENSIVE_TASK_DELAY_MS =
    SHIP_BEHAVIOR_PRESETS[
        SHIP_BEHAVIOR_PRESET_ID
            .STANDARD_COMBAT_00
    ].offensiveTaskDelayMs;

const LASER_CHARGE_DURATION_MS =
    SHIP_WEAPONS[
        SHIP_WEAPON_ID.LASER_00
    ].chargeDurationMs;

describe('New-game enemy combat sequence', () => {
    it('runs the dev weapons sequence without activating spam', () => {
        const generation =
            NewGameUniverseFactory.create();

        const startNode =
            generation.universe.nodes.find(
                (node) => {
                    return (
                        node.id ===
                        'node_start'
                    );
                },
            );

        if (!startNode) {
            throw new Error(
                'Expected new-game start node',
            );
        }

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            node: startNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    startNode.arrivalAnchorId,
            },

            drive:
                createShipDriveFixture(),

            pointDefense:
                createPointDefenseFixture(),

            random: () => 0,
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

        const enemy =
            loadedEvent.state.actors[0];

        if (!enemy) {
            throw new Error(
                'Expected new-game enemy ship',
            );
        }

        expect(
            enemy.weapons.map((weapon) => {
                return weapon.id;
            }),
        ).toEqual([
            'missile_launcher_00',
            'laser_00',
            'sticky_mine_dispenser_00',
            'spam_projector_00',
        ]);

        expect(
            enemy.crewRoles,
        ).not.toContain(
            OFFICER_ROLE.SCIENCE,
        );

        engine.step(0);

        expect(
            drainTargetedWeaponIds(engine),
        ).toEqual([
            'missile_launcher_00',
        ]);

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );
        engine.drainEvents();

        engine.step(
            OFFENSIVE_TASK_DELAY_MS,
        );

        expect(
            drainTargetedWeaponIds(engine),
        ).toEqual([
            'laser_00',
        ]);

        const remainingLaserTargetingMs =
            SHIP_WEAPON_TARGETING_DURATION_MS -
            OFFENSIVE_TASK_DELAY_MS;

        expect(
            remainingLaserTargetingMs,
        ).toBeGreaterThan(0);

        engine.step(
            remainingLaserTargetingMs,
        );
        engine.drainEvents();

        engine.step(
            LASER_CHARGE_DURATION_MS,
        );
        engine.drainEvents();

        engine.step(
            OFFENSIVE_TASK_DELAY_MS,
        );

        expect(
            drainTargetedWeaponIds(engine),
        ).toEqual([
            'sticky_mine_dispenser_00',
        ]);
    });
});

function drainTargetedWeaponIds(
    engine: EncounterEngine,
): string[] {
    return engine
        .drainEvents()
        .filter((event) => {
            return (
                event.type ===
                ENCOUNTER_EVENT
                    .PLAYER_SHIP_TARGETING_DETECTED
            );
        })
        .map((event) => {
            return event.sourceWeaponId;
        });
}
