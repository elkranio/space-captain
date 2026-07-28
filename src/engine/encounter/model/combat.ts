// src/engine/encounter/model/combat.ts

import type { MissileSpectralBand, MissileId } from '../../defs/missile';

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

export const THREAT_IDENTIFICATION_STATUS = {
    UNKNOWN: 'unknown',
    IDENTIFIED: 'identified',
} as const;

export type MissileThreatIdentification =
    | {
          status: typeof THREAT_IDENTIFICATION_STATUS.UNKNOWN;
      }
    | {
          status: typeof THREAT_IDENTIFICATION_STATUS.IDENTIFIED;

          spectralBand: MissileSpectralBand;
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

    // Знание игрока о свойствах угрозы.
    // Объективный тип ракеты остаётся в missileId.
    identification: MissileThreatIdentification;

    missileId: MissileId;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;
};

export type CombatProjectileState = MissileCombatProjectileState;

export type EncounterCombatState = {
    projectiles: CombatProjectileState[];
};
