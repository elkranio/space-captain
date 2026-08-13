// src/engine/content/schemas/ship_weapon_rules.ts

import * as z from 'zod';

export const SHIP_WEAPON_RULES_SCHEMA =
    z.strictObject({
        enemy_targeting:
            z.strictObject({
                durationMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Targeting duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),
            }).meta({
                title:
                    'Enemy Targeting',
            }),
    });

export type ShipWeaponRulesData =
    z.infer<
        typeof SHIP_WEAPON_RULES_SCHEMA
    >;
