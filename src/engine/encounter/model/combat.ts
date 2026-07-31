// src/engine/encounter/model/combat.ts

import type { LaserTargetZone } from '../../defs/laser';
import type { MissileSpectralBand, MissileId } from '../../defs/missile';
import type { PointDefenseState } from '../../defs/point_defense';
import type { ShieldGeneratorState } from '../../defs/shield_generator';

export const COMBAT_PROJECTILE_KIND = {
    MISSILE: 'missile',
} as const;

export const COMBAT_THREAT_KIND = {
    MISSILE: 'missile',
    LASER: 'laser',
} as const;

export type CombatThreatKind = (typeof COMBAT_THREAT_KIND)[keyof typeof COMBAT_THREAT_KIND];

export const LASER_SHOT_OUTCOME = {
    BLOCKED: 'blocked',
    HIT: 'hit',
} as const;

export type LaserShotOutcome = (typeof LASER_SHOT_OUTCOME)[keyof typeof LASER_SHOT_OUTCOME];

export const SPAM_CHANNEL_OUTCOME = {
    EXPIRED: 'expired',
    PURGED: 'purged',
} as const;

export type SpamChannelOutcome =
    (typeof SPAM_CHANNEL_OUTCOME)[keyof typeof SPAM_CHANNEL_OUTCOME];

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

export type LaserThreatIdentification =
    | {
          status: typeof THREAT_IDENTIFICATION_STATUS.UNKNOWN;
      }
    | {
          status: typeof THREAT_IDENTIFICATION_STATUS.IDENTIFIED;

          targetZone: LaserTargetZone;
      };

export type ThreatIdentificationResult =
    | {
          kind: typeof COMBAT_THREAT_KIND.MISSILE;

          spectralBand: MissileSpectralBand;
      }
    | {
          kind: typeof COMBAT_THREAT_KIND.LASER;

          targetZone: LaserTargetZone;
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

// Существует только во время CHARGING.
// Общая TARGETING-фаза ещё не создаёт видимую laser threat.
export type LaserAttackState = {
    id: string;

    // Использует общую encounter-последовательность
    // обозначений угроз: M1, L2, M3.
    designation: string;

    sourceActorId: string;
    sourceWeaponId: string;

    target: {
        kind: typeof COMBAT_TARGET_KIND.PLAYER_SHIP;
    };

    // targetZone — объективно выбранная зона.
    // identification — текущее знание игрока о ней.
    targetZone: LaserTargetZone;
    identification: LaserThreatIdentification;
};

// Derived snapshot of one actively channeling spam projector.
// The mutable elapsed time remains authoritative on the weapon phase.
export type SpamChannelState = {
    id: string;

    sourceActorId: string;
    sourceWeaponId: string;

    elapsedMs: number;
    durationMs: number;
};

export type ActiveShieldState = {
    zone: LaserTargetZone;

    elapsedMs: number;
    durationMs: number;
};

// После прикрепления мина живёт независимо
// от дальнейшего состояния launcher.
// Поэтому fuse и damage хранятся в runtime state.
export type StickyMineState = {
    id: string;

    sourceActorId: string;
    sourceWeaponId: string;

    timeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    damage: number;
};

export type EncounterCombatState = {
    pointDefense: PointDefenseState;

    // Некоторые ships могут не иметь shield generator.
    // Starter player ship передаёт его явно.
    shieldGenerator?: ShieldGeneratorState;

    // Временное поле существует только внутри encounter.
    // Новый shield заменяет предыдущий целиком.
    activeShield?: ActiveShieldState;

    projectiles: CombatProjectileState[];
    laserAttacks: LaserAttackState[];

    stickyMines: StickyMineState[];
};
