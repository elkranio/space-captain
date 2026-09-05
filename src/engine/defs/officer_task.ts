// src/engine/defs/officer_task.ts

// Стабильный тип офицерской работы.
// kind отвечает на вопрос: «Что именно сейчас делает офицер?»
//
// Это domain identity, а не editable content id.
export const OFFICER_TASK_KIND = {
    SCIENTIST_PLOT_COURSE: "scientist_plot_course",
    SCIENTIST_PURGE_SPAM: "scientist_purge_spam",
    SCIENTIST_FIRE_SPAM: "scientist_fire_spam",

    ENGINEER_REPAIR_DRIVE: "engineer_repair_drive",
    ENGINEER_DEPLOY_SHIELD: "engineer_deploy_shield",

    GUNNER_DEFENSE_TURRET: "gunner_defense_turret",

    GUNNER_FIRE_MISSILE: "gunner_fire_missile",
    GUNNER_FIRE_STICKY_MINES: "gunner_fire_sticky_mines",
    GUNNER_FIRE_BEAM_CANNON: "gunner_fire_beam_cannon",

    CLEAR_STICKY_MINE: "clear_sticky_mine",

    PILOT_DOCK: "pilot_dock",
    PILOT_FLY_TO: "pilot_fly_to",
    PILOT_JUMP: "pilot_jump",
    PILOT_EVADE: "pilot_evade",
} as const;

export type OfficerTaskKind = (typeof OFFICER_TASK_KIND)[keyof typeof OFFICER_TASK_KIND];

export type OfficerTaskCancellationPolicy = {
    // Можно ли показать игроку CANCEL TASK
    // и принять ручную отмену из bridge UI.
    canBeCancelledByPlayer: boolean;

    // Может ли damage consequence
    // принудительно прервать эту task.
    canBeInterruptedByDamage: boolean;
};

// Completion ownership — domain semantics, а не баланс.
//
// true:
// task завершается обычным OfficerTaskRunner timer.
//
// false:
// lifetime завершает внешний gameplay/visual flow
// (weapon runner, travel, docking, jump и т.п.).
//
// Content editor не должен превращать external-lifecycle task
// в timed task изменением одного числа.
// A task may own operator-timed progress even when another gameplay system
// owns the final completion edge. Missile aiming is the first such case:
// OfficerTaskRunner advances the aim, while the weapon runner commits launch.
export function doesOfficerTaskTrackTimedProgress(kind: OfficerTaskKind): boolean {
    return doesOfficerTaskUseTimedCompletion(kind) || kind === OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE;
}

export function doesOfficerTaskUseTimedCompletion(kind: OfficerTaskKind): boolean {
    switch (kind) {
        case OFFICER_TASK_KIND.SCIENTIST_PLOT_COURSE:
        case OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM:
        case OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE:
        case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:
        case OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET:
        case OFFICER_TASK_KIND.CLEAR_STICKY_MINE:
            return true;

        case OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM:
        case OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE:
        case OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES:
        case OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON:
        case OFFICER_TASK_KIND.PILOT_DOCK:
        case OFFICER_TASK_KIND.PILOT_FLY_TO:
        case OFFICER_TASK_KIND.PILOT_JUMP:
        case OFFICER_TASK_KIND.PILOT_EVADE:
            return false;

        default: {
            const exhaustiveKind: never = kind;

            return exhaustiveKind;
        }
    }
}
