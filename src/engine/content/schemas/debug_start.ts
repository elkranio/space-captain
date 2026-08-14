// src/engine/content/schemas/debug_start.ts

import * as z from 'zod';

const CONTENT_ID_SCHEMA =
    z.string()
        .min(1);

const WEAPON_SLOT_META = {
    description:
        'Installed weapon content id. Runtime installation ids are generated automatically.',
} as const;

export const DEBUG_START_SCHEMA =
    z.strictObject({
        player:
            z.strictObject({
                maxHull:
                    z.number()
                        .int()
                        .positive()
                        .meta({
                            title:
                                'Max Hull',
                        }),

                driveId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Drive',
                        }),

                powerCoreId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Power Core',
                        }),

                shieldGeneratorId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Shield Generator',
                        }),

                defenseTurretId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Defense Turret',
                        }),

                weaponSlot1Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 1',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot2Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 2',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot3Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 3',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot4Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 4',

                            ...WEAPON_SLOT_META,
                        }),
            }).meta({
                title:
                    'Player Ship',
            }),

        enemy:
            z.strictObject({
                chassisId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Chassis',
                        }),

                driveId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Drive',
                        }),

                powerCoreId:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Power Core',
                        }),

                shieldGeneratorId:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Shield Generator',
                        }),

                defenseTurretId:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Defense Turret',
                        }),

                weaponSlot1Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 1',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot2Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 2',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot3Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 3',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot4Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 4',

                            ...WEAPON_SLOT_META,
                        }),
            }).meta({
                title:
                    'Enemy Ship',
            }),
    });

export type DebugStartData =
    z.infer<
        typeof DEBUG_START_SCHEMA
    >;
