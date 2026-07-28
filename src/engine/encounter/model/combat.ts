// src/engine/encounter/model/combat.ts

import type { MissileId } from '../../defs/missile';

export const COMBAT_PROJECTILE_KIND = {
    MISSILE: 'missile',
} as const;

export type MissileCombatProjectileState = {
    id: string;

    // Короткое стабильное обозначение
    // конкретной угрозы внутри encounter.
    designation: string;

    kind: typeof COMBAT_PROJECTILE_KIND.MISSILE;

    sourceActorId: string;
    sourceWeaponId: string;

    missileId: MissileId;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;
};

export type CombatProjectileState = MissileCombatProjectileState;

export type EncounterCombatState = {
    projectiles: CombatProjectileState[];
};
