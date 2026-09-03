// src/engine/defs/officer.ts

// Стабильные роли мостика.
// Роль определяет seat, доступные команды и место офицера в captain flow.
export const OFFICER_ROLE = {
    SCIENTIST: "science",
    PILOT: "helm",
    GUNNER: "weapons",
    ENGINEER: "engineer",

    // Temporary source-compatibility aliases.
    // Remove after all production consumers use the canonical role names.
    SCIENCE: "science",
    HELM: "helm",
    WEAPONS: "weapons",
} as const;

export type OfficerRole = (typeof OFFICER_ROLE)[keyof typeof OFFICER_ROLE];

// Стабильные id портретов офицеров для bridge UI.
// Это отдельный набор от generic character portraits, потому что офицерские портреты живут в crew panels.
export const OFFICER_PORTRAIT_ID = {
    SILHOUETTE_00: "silhouette_00",

    SCIENCE_HUMAN_00: "science_human_00",
    SCIENCE_ALIEN_00: "science_alien_00",

    HELM_HUMAN_00: "helm_human_00",
    HELM_ALIEN_00: "helm_alien_00",

    WEAPONS_HUMAN_00: "weapons_human_00",
    WEAPONS_ALIEN_00: "weapons_alien_00",

    ENGINEER_HUMAN_00: "engineer_human_00",
    ENGINEER_ALIEN_00: "engineer_alien_00",
} as const;

export type OfficerPortraitId = (typeof OFFICER_PORTRAIT_ID)[keyof typeof OFFICER_PORTRAIT_ID];

// Базовое описание назначенного офицера.
// Runtime-состояние вроде текущей задачи, усталости и настроения должно жить отдельно.
export type OfficerDefinition = {
    role: OfficerRole;
    name: string;
    portraitId: OfficerPortraitId;
};
