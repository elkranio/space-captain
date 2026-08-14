// tests/engine/content/officer_task_tuning.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/defs/officer_task';
import {
    OFFICER_TASK_TUNING,
    getOfficerTaskCancellationPolicy,
    getOfficerTaskDraftTuning,
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    OFFICER_TASK_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/officer_task_tuning';

describe('Officer task tuning content', () => {
    it('preserves current timed-task baseline values', () => {
        expect(
            getOfficerTaskDraftTuning(
                OFFICER_TASK_KIND
                    .SCIENCE_IDENTIFY_THREAT,
            ),
        ).toEqual({
            label: 'IDENTIFY',
            showProgress: true,
            durationMs: 3000,
        });

        expect(
            getOfficerTaskDraftTuning(
                OFFICER_TASK_KIND
                    .ENGINEER_REPAIR_DRIVE,
            ),
        ).toEqual({
            label: 'REPAIR ENGINE',
            showProgress: true,
            durationMs: 12000,
        });

        expect(
            getTimedOfficerTaskDurationMs(
                OFFICER_TASK_KIND
                    .ENGINEER_DEPLOY_SHIELD,
            ),
        ).toBe(3000);
    });

    it('keeps external-lifecycle tasks untimed', () => {
        expect(
            getOfficerTaskDraftTuning(
                OFFICER_TASK_KIND
                    .WEAPONS_FIRE_BEAM_CANNON,
            ),
        ).toEqual({
            label: 'BEAM CANNON AIM',
            showProgress: false,
            durationMs: null,
        });

        expect(
            getOfficerTaskCancellationPolicy(
                OFFICER_TASK_KIND
                    .HELM_FLY_TO,
            ),
        ).toEqual({
            canBeCancelledByPlayer:
                false,
            canBeInterruptedByDamage:
                false,
        });
    });

    it('rejects negative timed durations', () => {
        const invalid = {
            ...OFFICER_TASK_TUNING,

            [OFFICER_TASK_KIND
                .SCIENCE_IDENTIFY_THREAT]: {
                ...OFFICER_TASK_TUNING[
                    OFFICER_TASK_KIND
                        .SCIENCE_IDENTIFY_THREAT
                ],

                durationMs: -1,
            },
        };

        expect(
            OFFICER_TASK_TUNING_SCHEMA
                .safeParse(invalid)
                .success,
        ).toBe(false);
    });

    it('rejects durationMs on external-lifecycle tasks', () => {
        const invalid = {
            ...OFFICER_TASK_TUNING,

            [OFFICER_TASK_KIND
                .HELM_FLY_TO]: {
                ...OFFICER_TASK_TUNING[
                    OFFICER_TASK_KIND
                        .HELM_FLY_TO
                ],

                durationMs: 1000,
            },
        };

        expect(
            OFFICER_TASK_TUNING_SCHEMA
                .safeParse(invalid)
                .success,
        ).toBe(false);
    });

    it('requires a tuning record for every domain task kind', () => {
        const missingRecord: Record<
            string,
            unknown
        > = {
            ...OFFICER_TASK_TUNING,
        };

        delete missingRecord[
            OFFICER_TASK_KIND.HELM_JUMP
        ];

        expect(
            OFFICER_TASK_TUNING_SCHEMA
                .safeParse(missingRecord)
                .success,
        ).toBe(false);
    });
});
