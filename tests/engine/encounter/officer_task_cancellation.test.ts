// tests/engine/encounter/officer_task_cancellation.test.ts

import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import { LASER_TARGET_ZONE } from '../../../src/engine/defs/laser';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../src/engine/encounter/model/officer_task';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('Officer task cancellation policy', () => {
    it('allows the player to cancel a cancellable task', () => {
        const { engine, state } = createEngine();

        const task = createEngineerTask();

        state.officerTasks[OFFICER_ROLE.ENGINEER] = task;

        engine.cancelTask(task.id);

        expect(engine.getOfficerTasks()).toEqual([]);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task,

                outcome: OFFICER_TASK_OUTCOME.CANCELLED,
            },
        ]);
    });

    it('rejects player cancellation for FLY_TO', () => {
        const { engine, state } = createEngine();

        const task = createFlyToTask();

        state.officerTasks[OFFICER_ROLE.HELM] = task;

        expect(() => {
            engine.cancelTask(task.id);
        }).toThrow(
            'Officer task cannot be cancelled by player: ' +
                'task_fly_to/helm_fly_to',
        );

        expect(engine.getOfficerTasks()).toEqual([task]);
        expect(engine.drainEvents()).toEqual([]);
    });
});

function createEngine() {
    const { node, stationId } = createSingleStationNodeFixture();

    const engine = new EncounterEngine({
        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(
            `Expected encounter loaded event, received: ${loadedEvent.type}`,
        );
    }

    return {
        engine,
        state: loadedEvent.state,
    };
}

function createEngineerTask(): OfficerTaskState {
    return {
        id: 'task_engineer',

        kind: OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
        role: OFFICER_ROLE.ENGINEER,
        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,

        shieldZone: LASER_TARGET_ZONE.CENTER,

        label: 'SHIELD CENTER',
        showProgress: true,

        durationMs: 2000,
        elapsedMs: 500,

        canBeCancelledByPlayer: true,
        canBeInterruptedByDamage: true,
    };
}

function createFlyToTask(): OfficerTaskState {
    return {
        id: 'task_fly_to',

        kind: OFFICER_TASK_KIND.HELM_FLY_TO,
        role: OFFICER_ROLE.HELM,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

        targetAnchorId: 'target_anchor',

        label: 'FLY TO',
        showProgress: false,

        durationMs: null,
        elapsedMs: 0,

        canBeCancelledByPlayer: false,
        canBeInterruptedByDamage: false,
    };
}
