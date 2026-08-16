// src/engine/content/catalogs/officer_tasks.ts

import scienceOfficerTaskTuningData from '../data/officer_tasks_science.json';
import weaponsOfficerTaskTuningData from '../data/officer_tasks_weapons.json';
import helmOfficerTaskTuningData from '../data/officer_tasks_helm.json';
import engineerOfficerTaskTuningData from '../data/officer_tasks_engineer.json';
import {
    ENGINEER_OFFICER_TASK_TUNING_SCHEMA,
    HELM_OFFICER_TASK_TUNING_SCHEMA,
    OFFICER_TASK_TUNING_SCHEMA,
    SCIENCE_OFFICER_TASK_TUNING_SCHEMA,
    WEAPONS_OFFICER_TASK_TUNING_SCHEMA,
    type OfficerTaskTuningData,
} from '../schemas/officer_task_tuning';
import {
    doesOfficerTaskUseTimedCompletion,
    type OfficerTaskCancellationPolicy,
    type OfficerTaskKind,
} from '../../defs/officer_task';

const SCIENCE_OFFICER_TASK_TUNING =
    SCIENCE_OFFICER_TASK_TUNING_SCHEMA.parse(
        scienceOfficerTaskTuningData,
    );

const WEAPONS_OFFICER_TASK_TUNING =
    WEAPONS_OFFICER_TASK_TUNING_SCHEMA.parse(
        weaponsOfficerTaskTuningData,
    );

const HELM_OFFICER_TASK_TUNING =
    HELM_OFFICER_TASK_TUNING_SCHEMA.parse(
        helmOfficerTaskTuningData,
    );

const ENGINEER_OFFICER_TASK_TUNING =
    ENGINEER_OFFICER_TASK_TUNING_SCHEMA.parse(
        engineerOfficerTaskTuningData,
    );

export const OFFICER_TASK_TUNING: Readonly<OfficerTaskTuningData> =
    OFFICER_TASK_TUNING_SCHEMA.parse({
        ...SCIENCE_OFFICER_TASK_TUNING,
        ...WEAPONS_OFFICER_TASK_TUNING,
        ...HELM_OFFICER_TASK_TUNING,
        ...ENGINEER_OFFICER_TASK_TUNING,
    });

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
