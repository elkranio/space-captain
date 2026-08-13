// src/engine/content/schemas/defense_capacitors.ts

import * as z from 'zod';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../defs/defense_capacitor';

export const DEFENSE_CAPACITOR_TUNING_SCHEMA =
    z.strictObject({
        [DEFENSE_CAPACITOR_ID.BASIC_00]:
            z.strictObject({
                name:
                    z.string()
                        .min(1)
                        .meta({
                            title: 'Name',
                        }),

                capacity:
                    z.number()
                        .int()
                        .positive()
                        .meta({
                            title:
                                'Charge capacity',
                        }),

                rechargeDurationMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Recharge duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),
            }).meta({
                title:
                    'MK.I Defense Capacitor',
            }),
    });

export type DefenseCapacitorTuningData =
    z.infer<
        typeof DEFENSE_CAPACITOR_TUNING_SCHEMA
    >;
