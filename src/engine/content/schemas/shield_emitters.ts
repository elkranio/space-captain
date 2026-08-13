// src/engine/content/schemas/shield_emitters.ts

import * as z from 'zod';
import {
    SHIELD_EMITTER_ID,
} from '../../defs/shield_emitter';

const DURATION_SCHEMA =
    z.number()
        .int()
        .nonnegative();

export const SHIELD_EMITTER_TUNING_SCHEMA =
    z.strictObject({
        [SHIELD_EMITTER_ID.BASIC_00]:
            z.strictObject({
                name:
                    z.string()
                        .min(1)
                        .meta({
                            title: 'Name',
                        }),

                shieldDurationMs:
                    DURATION_SCHEMA
                        .meta({
                            title:
                                'Shield duration',
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
                    'Basic Shield Emitter',
            }),
    });

export type ShieldEmitterTuningData =
    z.infer<
        typeof SHIELD_EMITTER_TUNING_SCHEMA
    >;
