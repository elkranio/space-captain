// src/engine/encounter/model/combat.ts

import type { MissileId } from '../../defs/missile';

export const COMBAT_PROJECTILE_KIND = {
    MISSILE: 'missile',
} as const;

export const COMBAT_TARGET_KIND = {
    PLAYER_SHIP: 'player_ship',
    ACTOR: 'actor',
} as const;

export type CombatTarget =
    | {
          kind: typeof COMBAT_TARGET_KIND.PLAYER_SHIP;
      }
    | {
          kind: typeof COMBAT_TARGET_KIND.ACTOR;

          actorId: string;
      };

export type MissileCombatProjectileState = {
    id: string;

    // Короткое стабильное обозначение
    // конкретной угрозы внутри encounter.
    designation: string;

    kind: typeof COMBAT_PROJECTILE_KIND.MISSILE;

    sourceActorId: string;
    sourceWeaponId: string;

    target: CombatTarget;

    missileId: MissileId;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;
};

export type CombatProjectileState = MissileCombatProjectileState;

export type EncounterCombatState = {
    projectiles: CombatProjectileState[];
};
