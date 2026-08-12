// tests/engine/encounter/new_game_enemy_defense_sandbox.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import NewGameUniverseFactory from '../../../src/engine/content/new_game/NewGameUniverseFactory';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    POINT_DEFENSE_ID,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

describe('New-game enemy defense sandbox', () => {
    it('wires the configured fully crewed enemy combat sandbox', () => {
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

        const enemy = startNode.actors[0];

        if (!enemy) {
            throw new Error(
                'Expected new-game enemy ship',
            );
        }

        expect(enemy.weapons).toEqual([
            {
                id:
                    'spam_projector_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .SPAM_PROJECTOR_00,

                kind:
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,

                phase:
                    SHIP_WEAPON_PHASE.READY,
                phaseElapsedMs: 0,

                activeChannelId: null,
            },
        ]);

        expect(enemy.pointDefense).toEqual({
            id: 'point_defense_00',

            pointDefenseId:
                POINT_DEFENSE_ID.BASIC_00,

            phase:
                POINT_DEFENSE_PHASE.READY,
            phaseElapsedMs: 0,

            loadedBand: null,
            targetProjectileId: null,
        });

        expect(
            enemy.defenseCapacitor,
        ).toEqual({
            id:
                'defense_capacitor_00',

            defenseCapacitorId:
                DEFENSE_CAPACITOR_ID
                    .BASIC_00,

            charges: 4,
            rechargeElapsedMs: 0,
        });

        expect(enemy.crewRoles).toEqual([
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.HELM,
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.ENGINEER,
        ]);

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

        const runtimeEnemy =
            getMutableEncounterStateForTest(
                engine,
            ).actors[0];

        if (!runtimeEnemy) {
            throw new Error(
                'Expected runtime enemy ship',
            );
        }

        expect(runtimeEnemy.pointDefense)
            .toEqual(enemy.pointDefense);

        expect(runtimeEnemy.pointDefense)
            .not.toBe(enemy.pointDefense);

        const runtimeProjector =
            runtimeEnemy.weapons[0];

        if (
            !runtimeProjector ||
            runtimeProjector.kind !==
                SHIP_WEAPON_KIND
                    .SPAM_PROJECTOR
        ) {
            throw new Error(
                'Expected runtime enemy spam projector',
            );
        }

        expect(runtimeProjector.phase)
            .toBe(
                SHIP_WEAPON_PHASE.READY,
            );

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );

        expect(runtimeProjector.phase)
            .toBe(
                SHIP_WEAPON_PHASE
                    .CHANNELING,
            );

        expect(
            runtimeEnemy.crewTasks[
                OFFICER_ROLE.SCIENCE
            ],
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.SCIENCE,

            weaponId:
                runtimeProjector.id,
        });

        const [spamChannel] =
            engine.getSpamChannels();

        if (!spamChannel) {
            throw new Error(
                'Expected active hostile spam channel',
            );
        }

        engine.step(
            spamChannel.durationMs - 1,
        );

        expect(runtimeProjector.phase)
            .toBe(
                SHIP_WEAPON_PHASE
                    .CHANNELING,
            );

        expect(
            runtimeEnemy.crewTasks[
                OFFICER_ROLE.SCIENCE
            ],
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.SCIENCE,

            weaponId:
                runtimeProjector.id,
        });

        engine.step(1);

        expect(
            engine.getSpamChannels(),
        ).toEqual([]);

        expect(runtimeProjector.phase)
            .toBe(
                SHIP_WEAPON_PHASE
                    .COOLDOWN,
            );

        expect(
            runtimeEnemy.crewTasks[
                OFFICER_ROLE.SCIENCE
            ],
        ).toBeUndefined();
    });
});
