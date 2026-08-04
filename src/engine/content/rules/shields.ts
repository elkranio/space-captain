// src/engine/content/rules/shields.ts

// Shared lifetime of one temporary directional shield field.
// Player and enemy crews differ in decision policy, not physical duration.
export const SHIP_SHIELD_DURATION_MS = 5000;

// Desired field lifetime still remaining when the incoming player laser hits.
//
// A value above the final-second warning threshold keeps normal interceptions
// from always landing on an already blinking shield. The range also prevents
// every enemy from revealing one exact deployment timestamp.
export const ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS = {
    min: 1100,
    max: 1800,
} as const;

// Compatibility name for the existing player shield pipeline.
export const PLAYER_SHIELD_DURATION_MS =
    SHIP_SHIELD_DURATION_MS;
