// src/engine/content/schemas/enemy_behavior_rules.ts

import * as z from 'zod';

export const ENEMY_BEHAVIOR_RULES_SCHEMA =
    z.strictObject({
        shield_placement:
            z.strictObject({
                impactReserveMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Impact reserve',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),
            }).meta({
                title:
                    'Shield Placement',
            }),
    });

export type EnemyBehaviorRulesData =
    z.infer<
        typeof ENEMY_BEHAVIOR_RULES_SCHEMA
    >;
