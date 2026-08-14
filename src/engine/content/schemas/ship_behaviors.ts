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

                            description:
                                'Base interval between captain decision attempts. ' +
                                'The next interval also uses Decision tick wiggle.',

                            ...DURATION_META,
                        }),

                decisionTickWiggleMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Decision tick wiggle',

                            description:
                                'Random +/- offset applied once when scheduling ' +
                                'the next captain decision tick, preventing a fixed rhythm.',

                            ...DURATION_META,
                        }),

                threatTimingWiggleMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Threat timing wiggle',

                            description:
                                'Random +/- timing error used when the captain estimates ' +
                                'whether a known threat can still be mitigated in time.',

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

                            description:
                                '0-100 tendency to prefer offense and accept defensive risk. ' +
                                'Higher values mean more aggressive decisions.',
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
