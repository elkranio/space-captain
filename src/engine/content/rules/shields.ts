// src/engine/content/rules/shields.ts

// Shared lifetime of one temporary directional shield field.
// Player and enemy crews differ in decision policy, not physical duration.
export const SHIP_SHIELD_DURATION_MS = 5000;

// Compatibility name for the existing player shield pipeline.
export const PLAYER_SHIELD_DURATION_MS =
    SHIP_SHIELD_DURATION_MS;
