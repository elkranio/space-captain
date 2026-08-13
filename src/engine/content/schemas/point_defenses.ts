// src/engine/content/schemas/point_defenses.ts

import * as z from 'zod';
import {
    POINT_DEFENSE_ID,
} from '../../defs/point_defense';

const DURATION_SCHEMA =
    z.number()
        .int()
        .nonnegative();

export const POINT_DEFENSE_TUNING_SCHEMA =
    z.strictObject({
        [POINT_DEFENSE_ID.BASIC_00]:
            z.strictObject({
                name:
                    z.string()
                        .min(1)
                        .meta({
                            title: 'Name',
                        }),

                loadDurationMs:
                    DURATION_SCHEMA
                        .meta({
                            title:
                                'Load duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),

                cooldownDurationMs:
                    DURATION_SCHEMA
                        .meta({
                            title:
                                'Cooldown duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),
            }).meta({
                title:
                    'Basic Point Defense',
            }),
    });

export type PointDefenseTuningData =
    z.infer<
        typeof POINT_DEFENSE_TUNING_SCHEMA
    >;
