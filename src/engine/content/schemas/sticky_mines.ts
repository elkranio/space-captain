// src/engine/content/schemas/sticky_mines.ts

import * as z from 'zod';
import {
    STICKY_MINE_ID,
} from '../../defs/sticky_mine';

export const STICKY_MINE_TUNING_SCHEMA =
    z.strictObject({
        [STICKY_MINE_ID.BASIC_00]:
            z.strictObject({
                name:
                    z.string()
                        .min(1)
                        .meta({
                            title: 'Name',
                        }),

                fuseDurationMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Fuse duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),

                damage:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title: 'Damage',
                        }),
            }).meta({
                title:
                    'Basic Sticky Mine',
            }),
    });

export type StickyMineTuningData =
    z.infer<
        typeof STICKY_MINE_TUNING_SCHEMA
    >;
