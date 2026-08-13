// src/engine/content/schemas/officer_task_tuning.ts

import * as z from 'zod';
import {
    OFFICER_TASK_KIND,
    doesOfficerTaskUseTimedCompletion,
    type OfficerTaskKind,
} from '../../defs/officer_task';

const COMMON_OFFICER_TASK_TUNING_SHAPE = {
    label: z.string().min(1).meta({
        title: 'Label',
    }),

    showProgress: z.boolean().meta({
        title: 'Show progress',
    }),

    canBeCancelledByPlayer: z.boolean().meta({
        title: 'Player can cancel',
    }),

    canBeInterruptedByDamage: z.boolean().meta({
        title: 'Damage can interrupt',
    }),
} as const;

export const OFFICER_TASK_TIMED_TUNING_ENTRY_SCHEMA =
    z.strictObject({
        ...COMMON_OFFICER_TASK_TUNING_SHAPE,

        durationMs: z
            .number()
            .int()
            .nonnegative()
            .meta({
                title: 'Duration',
                unit: 'ms',
                'x-editor-control': 'duration',
            }),
    });

export const OFFICER_TASK_LIFECYCLE_TUNING_ENTRY_SCHEMA =
    z.strictObject({
        ...COMMON_OFFICER_TASK_TUNING_SHAPE,
    });

const OFFICER_TASK_TUNING_SHAPE =
    Object.fromEntries(
        Object.values(
            OFFICER_TASK_KIND,
        ).map((kind) => {
            return [
                kind,
                doesOfficerTaskUseTimedCompletion(
                    kind,
                )
                    ? OFFICER_TASK_TIMED_TUNING_ENTRY_SCHEMA
                    : OFFICER_TASK_LIFECYCLE_TUNING_ENTRY_SCHEMA,
            ];
        }),
    ) as Record<
        OfficerTaskKind,
        | typeof OFFICER_TASK_TIMED_TUNING_ENTRY_SCHEMA
        | typeof OFFICER_TASK_LIFECYCLE_TUNING_ENTRY_SCHEMA
    >;

// Top-level strict object:
// - каждый domain task kind обязан иметь tuning record;
// - лишний/неизвестный task kind не принимается;
// - external-lifecycle tasks физически не имеют durationMs
//   в своей schema.
export const OFFICER_TASK_TUNING_SCHEMA =
    z.strictObject(
        OFFICER_TASK_TUNING_SHAPE,
    );

export type OfficerTaskTuningData =
    z.infer<
        typeof OFFICER_TASK_TUNING_SCHEMA
    >;
