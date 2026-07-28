// tests/engine/encounter/weapons_point_defense_command.test.ts

import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { POINT_DEFENSE_BEAM_BAND } from '../../../src/engine/defs/point_defense';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import { ENCOUNTER_EVENT, OFFICER_TASK_OUTCOME } from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Weapons point defense command', () => {
    it('offers both beam bands and runs a timed aiming task', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const nodeEnemy = ShipNodeActorFactory.create({
            id: 'ship_enemy_00',

            presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_00,

            anchorId: stationId,
        });

        nodeEnemy.weapons[0].ammoCount = 1;

        node.actors.push(nodeEnemy);

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
        });

        const [loadedEvent] = engine.drainEvents();

        if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
            throw new Error(`Expected encounter loaded event, received: ` + `${loadedEvent.type}`);
        }

        const enemy = loadedEvent.state.actors[0];
        const launcher = enemy.weapons[0];

        const launcherDefinition = SHIP_WEAPONS[launcher.weaponId];

        engine.step(1);

        engine.drainEvents();

        engine.step(launcherDefinition.preparationDurationMs - 1);

        engine.drainEvents();

        const commands = engine.getAvailableCommands(OFFICER_ROLE.WEAPONS);

        expect(commands).toEqual([
            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

                label: 'RED BEAM',

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                    threatId: 'projectile_1',
                },

                targetLabel: 'MISSILE M1',
            },

            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM,

                label: 'BLUE BEAM',

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                    threatId: 'projectile_1',
                },

                targetLabel: 'MISSILE M1',
            },
        ]);

        const redBeamCommand = commands.find((command) => {
            return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM;
        });

        if (!redBeamCommand) {
            throw new Error('Expected RED BEAM command');
        }

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.WEAPONS,

                commandId: redBeamCommand.commandId,

                target: redBeamCommand.target,
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toEqual([]);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: {
                    kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                    role: OFFICER_ROLE.WEAPONS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

                    targetId: 'projectile_1',

                    pointDefenseBeamBand: POINT_DEFENSE_BEAM_BAND.RED,

                    label: 'PD AIM',
                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 0,
                },
            },
        ]);

        engine.step(2999);

        expect(engine.drainEvents()).toEqual([]);

        expect(loadedEvent.state.officerTasks[OFFICER_ROLE.WEAPONS]).toEqual({
            kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

            role: OFFICER_ROLE.WEAPONS,

            sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

            targetId: 'projectile_1',

            pointDefenseBeamBand: POINT_DEFENSE_BEAM_BAND.RED,

            label: 'PD AIM',
            durationMs: 3000,

            id: 'task_1',
            elapsedMs: 2999,
        });

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: {
                    kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

                    role: OFFICER_ROLE.WEAPONS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

                    targetId: 'projectile_1',

                    pointDefenseBeamBand: POINT_DEFENSE_BEAM_BAND.RED,

                    label: 'PD AIM',
                    durationMs: 3000,

                    id: 'task_1',
                    elapsedMs: 3000,
                },

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,
            },
        ]);

        expect(engine.getAvailableCommands(OFFICER_ROLE.WEAPONS)).toEqual(commands);
    });
});
