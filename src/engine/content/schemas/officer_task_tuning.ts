import * as z from "zod";
import { OFFICER_TASK_KIND, doesOfficerTaskTrackTimedProgress, type OfficerTaskKind } from "../../defs/officer_task";

const COMMON_OFFICER_TASK_TUNING_SHAPE = {
    label: z.string().min(1).meta({
        title: "Label",
    }),

    showProgress: z.boolean().meta({
        title: "Show progress",
    }),

    canBeCancelledByPlayer: z.boolean().meta({
        title: "Player can cancel",
    }),

    canBeInterruptedByDamage: z.boolean().meta({
        title: "Damage can interrupt",
    }),
} as const;

export const OFFICER_TASK_TIMED_TUNING_ENTRY_SCHEMA = z.strictObject({
    ...COMMON_OFFICER_TASK_TUNING_SHAPE,

    durationMs: z.number().int().nonnegative().meta({
        title: "Duration",
        unit: "ms",
        "x-editor-control": "duration",
    }),
});

export const OFFICER_TASK_LIFECYCLE_TUNING_ENTRY_SCHEMA = z.strictObject({
    ...COMMON_OFFICER_TASK_TUNING_SHAPE,
});

const OFFICER_TASK_TUNING_SHAPE = Object.fromEntries(
    Object.values(OFFICER_TASK_KIND).map((kind) => {
        return [
            kind,
            doesOfficerTaskTrackTimedProgress(kind)
                ? OFFICER_TASK_TIMED_TUNING_ENTRY_SCHEMA
                : OFFICER_TASK_LIFECYCLE_TUNING_ENTRY_SCHEMA,
        ];
    }),
) as Record<
    OfficerTaskKind,
    typeof OFFICER_TASK_TIMED_TUNING_ENTRY_SCHEMA | typeof OFFICER_TASK_LIFECYCLE_TUNING_ENTRY_SCHEMA
>;

export const SCIENTIST_OFFICER_TASK_TUNING_SCHEMA = z.strictObject({
    [OFFICER_TASK_KIND.SCIENTIST_PLOT_COURSE]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.SCIENTIST_PLOT_COURSE],

    [OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM],

    [OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM],
});

export const GUNNER_OFFICER_TASK_TUNING_SCHEMA = z.strictObject({
    [OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET],

    [OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE],

    [OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES]:
        OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES],

    [OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON],
});

export const PILOT_OFFICER_TASK_TUNING_SCHEMA = z.strictObject({
    [OFFICER_TASK_KIND.PILOT_DOCK]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.PILOT_DOCK],

    [OFFICER_TASK_KIND.PILOT_FLY_TO]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.PILOT_FLY_TO],

    [OFFICER_TASK_KIND.PILOT_JUMP]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.PILOT_JUMP],

    [OFFICER_TASK_KIND.PILOT_EVADE]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.PILOT_EVADE],
});

export const ENGINEER_OFFICER_TASK_TUNING_SCHEMA = z.strictObject({
    [OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE],

    [OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD],

    [OFFICER_TASK_KIND.CLEAR_STICKY_MINE]: OFFICER_TASK_TUNING_SHAPE[OFFICER_TASK_KIND.CLEAR_STICKY_MINE],
});

// Runtime still receives one complete tuning map.
// This final strict schema proves that the physical role split did not
// drop a domain task or add an unknown one.
export const OFFICER_TASK_TUNING_SCHEMA = z.strictObject(OFFICER_TASK_TUNING_SHAPE);

export type OfficerTaskTuningData = z.infer<typeof OFFICER_TASK_TUNING_SCHEMA>;
