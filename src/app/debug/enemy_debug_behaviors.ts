// src/app/debug/enemy_debug_behaviors.ts

import enemyDebugBehaviorsData from "./data/enemy_debug_behaviors.json";
import { ENEMY_DEBUG_BEHAVIORS_SCHEMA } from "./enemy_debug_behaviors_schema";

const parsed = ENEMY_DEBUG_BEHAVIORS_SCHEMA.parse(enemyDebugBehaviorsData);

// Development-only app configuration.
// Engine never imports this module.
export const ENEMY_DEBUG_BEHAVIORS = parsed.enemy;
