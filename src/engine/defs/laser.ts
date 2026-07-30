// src/engine/defs/laser.ts

export const LASER_TARGET_ZONE = {
    LEFT: 'left',
    CENTER: 'center',
    RIGHT: 'right',
} as const;

export type LaserTargetZone = (typeof LASER_TARGET_ZONE)[keyof typeof LASER_TARGET_ZONE];

export const LASER_TARGET_ZONES = [
    LASER_TARGET_ZONE.LEFT,
    LASER_TARGET_ZONE.CENTER,
    LASER_TARGET_ZONE.RIGHT,
] as const;
