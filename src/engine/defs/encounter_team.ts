// src/engine/defs/encounter_team.ts

export const ENCOUNTER_TEAM = {
    PLAYER: "player",
    NEUTRAL: "neutral",
    ENEMY: "enemy",
} as const;

export type EncounterTeam = (typeof ENCOUNTER_TEAM)[keyof typeof ENCOUNTER_TEAM];
