// src/engine/content/rules/officer_tasks.ts

// Базовые длительности задач,
// которые завершаются по времени внутри EncounterEngine.
//
// Модификаторы офицеров, повреждений и стресса
// позже должны применяться поверх этих значений.
export const OFFICER_TASK_BASE_DURATION_MS = {
    SCIENCE_PLOT_COURSE: 5000,
    SCIENCE_IDENTIFY_THREAT: 3000,
    SCIENCE_PURGE_SPAM: 5000,

    ENGINEER_DEPLOY_SHIELD: 2000,
    ENGINEER_REPAIR_DRIVE: 12000,

    WEAPONS_POINT_DEFENSE_AIM: 3000,

    CLEAR_STICKY_MINE: 3000,
} as const;
