// src/engine/content/catalogs/enemy_behavior_rules.ts

import enemyBehaviorRulesData from "../data/enemy_behavior_rules.json";
import { ENEMY_BEHAVIOR_RULES_SCHEMA } from "../schemas/enemy_behavior_rules";

export const ENEMY_BEHAVIOR_RULES = ENEMY_BEHAVIOR_RULES_SCHEMA.parse(enemyBehaviorRulesData);
