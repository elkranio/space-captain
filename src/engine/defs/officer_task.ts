// src/engine/defs/officer_task.ts

// Стабильный тип офицерской работы.
// kind отвечает на вопрос: «Что именно сейчас делает офицер?»
//
// Это domain identity, а не editable content id.
export const OFFICER_TASK_KIND = {
    SCIENCE_PLOT_COURSE: 'science_plot_course',
    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',
    SCIENCE_PURGE_SPAM: 'science_purge_spam',
    SCIENCE_FIRE_SPAM: 'science_fire_spam',

    ENGINEER_REPAIR_DRIVE: 'engineer_repair_drive',
    ENGINEER_DEPLOY_SHIELD: 'engineer_deploy_shield',

    WEAPONS_POINT_DEFENSE: 'weapons_point_defense',

    WEAPONS_FIRE_MISSILE: 'weapons_fire_missile',
    WEAPONS_FIRE_STICKY_MINES: 'weapons_fire_sticky_mines',
    WEAPONS_FIRE_LASER: 'weapons_fire_laser',

    CLEAR_STICKY_MINE: 'clear_sticky_mine',

    HELM_DOCK: 'helm_dock',
    HELM_FLY_TO: 'helm_fly_to',
    HELM_JUMP: 'helm_jump',
} as const;

export type OfficerTaskKind =
    (typeof OFFICER_TASK_KIND)[keyof typeof OFFICER_TASK_KIND];

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
export function doesOfficerTaskUseTimedCompletion(
    kind: OfficerTaskKind,
): boolean {
    switch (kind) {
        case OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE:
        case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:
        case OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM:
        case OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE:
        case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:
        case OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE:
        case OFFICER_TASK_KIND.CLEAR_STICKY_MINE:
            return true;

        case OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM:
        case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:
        case OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES:
        case OFFICER_TASK_KIND.WEAPONS_FIRE_LASER:
        case OFFICER_TASK_KIND.HELM_DOCK:
        case OFFICER_TASK_KIND.HELM_FLY_TO:
        case OFFICER_TASK_KIND.HELM_JUMP:
            return false;

        default: {
            const exhaustiveKind: never = kind;

            return exhaustiveKind;
        }
    }
}
