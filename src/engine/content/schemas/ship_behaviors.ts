// src/engine/content/schemas/ship_behaviors.ts

import * as z from 'zod';
import {
    SHIP_BEHAVIOR_PRESET_ID,
} from '../../defs/ship_behavior';

const DURATION_META = {
    unit: 'ms',
    'x-editor-control':
        'duration',
} as const;

export const SHIP_BEHAVIOR_TUNING_SCHEMA =
    z.strictObject({
        [SHIP_BEHAVIOR_PRESET_ID
            .STANDARD_COMBAT_00]:
            z.strictObject({
                decisionTickDurationMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Captain decision tick',
                            ...DURATION_META,
                        }),

                decisionTickWiggleMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Decision tick wiggle',
                            ...DURATION_META,
                        }),

                threatTimingWiggleMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Threat timing wiggle',
                            ...DURATION_META,
                        }),

                aggression:
                    z.number()
                        .int()
                        .min(0)
                        .max(100)
                        .meta({
                            title:
                                'Aggression',
                        }),

                offensiveTaskDelayMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Offensive task delay',
                            ...DURATION_META,
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
