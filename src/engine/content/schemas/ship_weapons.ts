// src/engine/content/schemas/ship_weapons.ts

import * as z from 'zod';
import {
    SHIP_WEAPON_ID,
} from '../../defs/ship_weapon';

const WEAPON_NAME_SCHEMA =
    z.string()
        .min(1)
        .meta({
            title: 'Name',
        });

const COOLDOWN_DURATION_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title:
                'Cooldown duration',
            unit: 'ms',
            'x-editor-control':
                'duration',
        });

const AMMO_CAPACITY_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title:
                'Ammo capacity',
        });

export const SHIP_WEAPON_TUNING_SCHEMA =
    z.strictObject({
        [SHIP_WEAPON_ID
            .MISSILE_LAUNCHER_00]:
            z.strictObject({
                name:
                    WEAPON_NAME_SCHEMA,

                ammoCapacity:
                    AMMO_CAPACITY_SCHEMA,

                cooldownDurationMs:
                    COOLDOWN_DURATION_SCHEMA,
            }).meta({
                title:
                    'Missile Launcher',
            }),

        [SHIP_WEAPON_ID.LASER_00]:
            z.strictObject({
                name:
                    WEAPON_NAME_SCHEMA,

                damage:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title: 'Damage',
                        }),

                chargeDurationMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Charge duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),

                cooldownDurationMs:
                    COOLDOWN_DURATION_SCHEMA,
            }).meta({
                title:
                    'Laser Emitter',
            }),

        [SHIP_WEAPON_ID
            .SPAM_PROJECTOR_00]:
            z.strictObject({
                name:
                    WEAPON_NAME_SCHEMA,

                channelDurationMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Channel duration',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),

                officerTaskProgressMultiplier:
                    z.number()
                        .positive()
                        .meta({
                            title:
                                'Officer task progress multiplier',
                        }),

                cooldownDurationMs:
                    COOLDOWN_DURATION_SCHEMA,
            }).meta({
                title:
                    'Spam Projector',
            }),

        [SHIP_WEAPON_ID
            .STICKY_MINE_DISPENSER_00]:
            z.strictObject({
                name:
                    WEAPON_NAME_SCHEMA,

                ammoCapacity:
                    AMMO_CAPACITY_SCHEMA,

                salvoSize:
                    z.number()
                        .int()
                        .positive()
                        .meta({
                            title:
                                'Salvo size',
                        }),

                launchIntervalMs:
                    z.number()
                        .int()
                        .nonnegative()
                        .meta({
                            title:
                                'Launch interval',
                            unit: 'ms',
                            'x-editor-control':
                                'duration',
                        }),

                cooldownDurationMs:
                    COOLDOWN_DURATION_SCHEMA,
            }).meta({
                title:
                    'Sticky Mine Dispenser',
            }),
    });

export type ShipWeaponTuningData =
    z.infer<
        typeof SHIP_WEAPON_TUNING_SCHEMA
    >;
