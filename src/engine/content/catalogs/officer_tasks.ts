// src/engine/content/catalogs/officer_tasks.ts

import officerTaskTuningData from '../data/officer_tasks.json';
import {
    OFFICER_TASK_TUNING_SCHEMA,
    type OfficerTaskTuningData,
} from '../schemas/officer_task_tuning';
import {
    doesOfficerTaskUseTimedCompletion,
    type OfficerTaskCancellationPolicy,
    type OfficerTaskKind,
} from '../../defs/officer_task';

export const OFFICER_TASK_TUNING: Readonly<OfficerTaskTuningData> =
    OFFICER_TASK_TUNING_SCHEMA.parse(
        officerTaskTuningData,
    );

export type OfficerTaskDraftTuning = {
    label: string;
    showProgress: boolean;
    durationMs: number | null;
};

export function getOfficerTaskDraftTuning(
    kind: OfficerTaskKind,
): OfficerTaskDraftTuning {
    const tuning =
        OFFICER_TASK_TUNING[kind];

    let durationMs: number | null =
        null;

    if (
        doesOfficerTaskUseTimedCompletion(
            kind,
        )
    ) {
        if (!('durationMs' in tuning)) {
            throw new Error(
                'Timed officer task tuning is missing durationMs: ' +
                    kind,
            );
        }

        durationMs = tuning.durationMs;
    }

    return {
        label: tuning.label,
        showProgress:
            tuning.showProgress,
        durationMs,
    };
}

export function getTimedOfficerTaskDurationMs(
    kind: OfficerTaskKind,
): number {
    const tuning =
        getOfficerTaskDraftTuning(
            kind,
        );

    if (tuning.durationMs === null) {
        throw new Error(
            'Officer task does not use timed completion: ' +
                kind,
        );
    }

    return tuning.durationMs;
}

export function getOfficerTaskCancellationPolicy(
    kind: OfficerTaskKind,
): OfficerTaskCancellationPolicy {
    const tuning =
        OFFICER_TASK_TUNING[kind];

    return {
        canBeCancelledByPlayer:
            tuning.canBeCancelledByPlayer,

        canBeInterruptedByDamage:
            tuning.canBeInterruptedByDamage,
    };
}
