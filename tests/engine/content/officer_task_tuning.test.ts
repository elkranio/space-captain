import engineerData from '../../../src/engine/content/data/officer_tasks_engineer.json';
import gunnerData from '../../../src/engine/content/data/officer_tasks_gunner.json';
import pilotData from '../../../src/engine/content/data/officer_tasks_pilot.json';
// tests/engine/content/officer_task_tuning.test.ts

import { describe, expect, it } from 'vitest';
import { OFFICER_TASK_KIND } from '../../../src/engine/defs/officer_task';
import {
    OFFICER_TASK_TUNING,
    getOfficerTaskCancellationPolicy,
    getOfficerTaskDraftTuning,
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import { OFFICER_TASK_TUNING_SCHEMA } from '../../../src/engine/content/schemas/officer_task_tuning';

describe('Officer task tuning content', () => {
    it('reads timed-task label and duration from current tuning', () => {
        const repair = engineerData.engineer_repair_drive;
        expect(getOfficerTaskDraftTuning(OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE)).toEqual({
            label: repair.label,
            durationMs: repair.durationMs,
        });
        expect(getTimedOfficerTaskDurationMs(OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD)).toBe(
            engineerData.engineer_deploy_shield.durationMs,
        );
    });

    it('keeps external-lifecycle tasks untimed', () => {
        const beam = gunnerData.gunner_fire_beam_cannon;
        expect(getOfficerTaskDraftTuning(OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON)).toEqual({
            label: beam.label,
            durationMs: null,
        });
        const flyTo = pilotData.pilot_fly_to;
        expect(getOfficerTaskCancellationPolicy(OFFICER_TASK_KIND.PILOT_FLY_TO)).toEqual({
            canBeCancelledByPlayer: flyTo.canBeCancelledByPlayer,
            canBeInterruptedByDamage: flyTo.canBeInterruptedByDamage,
        });
    });

    it('rejects negative timed durations', () => {
        const invalid = {
            ...OFFICER_TASK_TUNING,

            [OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE]: {
                ...OFFICER_TASK_TUNING[OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE],

                durationMs: -1,
            },
        };

        expect(OFFICER_TASK_TUNING_SCHEMA.safeParse(invalid).success).toBe(false);
    });

    it('rejects durationMs on external-lifecycle tasks', () => {
        const invalid = {
            ...OFFICER_TASK_TUNING,

            [OFFICER_TASK_KIND.PILOT_FLY_TO]: {
                ...OFFICER_TASK_TUNING[OFFICER_TASK_KIND.PILOT_FLY_TO],

                durationMs: 1000,
            },
        };

        expect(OFFICER_TASK_TUNING_SCHEMA.safeParse(invalid).success).toBe(false);
    });

    it('requires a tuning record for every domain task kind', () => {
        const missingRecord: Record<string, unknown> = {
            ...OFFICER_TASK_TUNING,
        };

        delete missingRecord[OFFICER_TASK_KIND.PILOT_JUMP];

        expect(OFFICER_TASK_TUNING_SCHEMA.safeParse(missingRecord).success).toBe(false);
    });
});
