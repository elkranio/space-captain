// src/engine/content/schemas/ship_behaviors.ts

import * as z from 'zod';
import {
    SHIP_BEHAVIOR_PRESET_ID,
} from '../../defs/ship_behavior';

export const SHIP_BEHAVIOR_TUNING_SCHEMA =
    z.strictObject({
        [SHIP_BEHAVIOR_PRESET_ID
            .STANDARD_COMBAT_00]:
            z.strictObject({
                offensiveTaskDelayMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Offensive task delay',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),
            }).meta({
                title:
                    'Standard Combat',
            }),
    });

export type ShipBehaviorTuningData =
    z.infer<
        typeof SHIP_BEHAVIOR_TUNING_SCHEMA
    >;
