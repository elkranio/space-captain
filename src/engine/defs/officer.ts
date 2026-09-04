// src/engine/defs/officer.ts

// Стабильные роли мостика.
// Роль определяет seat, доступные команды и место офицера в captain flow.
export const OFFICER_ROLE = {
    SCIENTIST: "scientist",
    PILOT: "pilot",
    GUNNER: "gunner",
    ENGINEER: "engineer",
} as const;

export type OfficerRole = (typeof OFFICER_ROLE)[keyof typeof OFFICER_ROLE];

// Стабильные id портретов офицеров для bridge UI.
// Это отдельный набор от generic character portraits, потому что офицерские портреты живут в crew panels.
export const OFFICER_PORTRAIT_ID = {
    SILHOUETTE_00: "silhouette_00",

    SCIENTIST_HUMAN_00: "scientist_human_00",
    SCIENTIST_ALIEN_00: "scientist_alien_00",

    PILOT_HUMAN_00: "pilot_human_00",
    PILOT_ALIEN_00: "pilot_alien_00",

    GUNNER_HUMAN_00: "gunner_human_00",
    GUNNER_ALIEN_00: "gunner_alien_00",

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
