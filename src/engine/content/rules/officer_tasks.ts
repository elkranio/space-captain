// src/engine/content/rules/officer_tasks.ts

// Базовые длительности задач,
// которые завершаются по времени внутри EncounterEngine.
//
// Модификаторы офицеров, повреждений и стресса
// позже должны применяться поверх этих значений.
export const OFFICER_TASK_BASE_DURATION_MS = {
    COMMS_REQUEST_DOCKING: 3000,

    SCIENCE_PLOT_COURSE: 5000,
    SCIENCE_IDENTIFY_THREAT: 3000,

    ENGINEER_DEPLOY_SHIELD: 2000,

    WEAPONS_POINT_DEFENSE_AIM: 3000,
} as const;
