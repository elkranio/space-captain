// src/engine/content/schemas/ship_weapons.ts

import * as z from 'zod';

const CONTENT_ID_PATTERN =
    /^[a-z][a-z0-9_]*$/;

const CONTENT_ID_SCHEMA =
    z.string()
        .regex(
            CONTENT_ID_PATTERN,
        );

const WEAPON_NAME_SCHEMA =
    z.string()
        .min(1)
        .meta({
            title: 'Name',
        });

const DAMAGE_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title: 'Damage',
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

export const MISSILE_LAUNCHER_RECORD_SCHEMA =
    z.strictObject({
        name:
            WEAPON_NAME_SCHEMA,

        damage:
            DAMAGE_SCHEMA,

        flightDurationMs:
            z.number()
                .int()
                .nonnegative()
                .meta({
                    title:
                        'Flight duration',
                    unit: 'ms',
                    'x-editor-control':
                        'duration',
                }),

        ammoCapacity:
            AMMO_CAPACITY_SCHEMA,

        cooldownDurationMs:
            COOLDOWN_DURATION_SCHEMA,
    }).meta({
        title:
            'Missile Launcher',
    });

export const MISSILE_LAUNCHER_TUNING_SCHEMA =
    z.record(
        CONTENT_ID_SCHEMA,
        MISSILE_LAUNCHER_RECORD_SCHEMA,
    ).meta({
        title:
            'Missile Launchers',
    });

export const LASER_EMITTER_RECORD_SCHEMA =
    z.strictObject({
        name:
            WEAPON_NAME_SCHEMA,

        damage:
            DAMAGE_SCHEMA,

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
    });

export const LASER_EMITTER_TUNING_SCHEMA =
    z.record(
        CONTENT_ID_SCHEMA,
        LASER_EMITTER_RECORD_SCHEMA,
    ).meta({
        title:
            'Laser Emitters',
    });

export const SPAM_PROJECTOR_RECORD_SCHEMA =
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
    });

export const SPAM_PROJECTOR_TUNING_SCHEMA =
    z.record(
        CONTENT_ID_SCHEMA,
        SPAM_PROJECTOR_RECORD_SCHEMA,
    ).meta({
        title:
            'Spam Projectors',
    });

export const STICKY_MINE_DISPENSER_RECORD_SCHEMA =
    z.strictObject({
        name:
            WEAPON_NAME_SCHEMA,

        damage:
            DAMAGE_SCHEMA,

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
    });

export const STICKY_MINE_DISPENSER_TUNING_SCHEMA =
    z.record(
        CONTENT_ID_SCHEMA,
        STICKY_MINE_DISPENSER_RECORD_SCHEMA,
    ).meta({
        title:
            'Sticky Mine Dispensers',
    });

export type MissileLauncherTuningData =
    z.infer<
        typeof MISSILE_LAUNCHER_TUNING_SCHEMA
    >;

export type LaserEmitterTuningData =
    z.infer<
        typeof LASER_EMITTER_TUNING_SCHEMA
    >;

export type SpamProjectorTuningData =
    z.infer<
        typeof SPAM_PROJECTOR_TUNING_SCHEMA
    >;

export type StickyMineDispenserTuningData =
    z.infer<
        typeof STICKY_MINE_DISPENSER_TUNING_SCHEMA
    >;
