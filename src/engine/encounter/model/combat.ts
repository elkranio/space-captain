// src/engine/encounter/model/combat.ts

import type {
    PowerCoreState,
} from '../../defs/power_core';
import type { MissileSignature, MissileId } from '../../defs/missile';
import type {
    StickyMineId,
} from '../../defs/sticky_mine';
import type {
    ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShieldGeneratorState,
} from '../../defs/shield_generator';

export const COMBAT_PROJECTILE_KIND = {
    MISSILE: 'missile',
} as const;

export const COMBAT_THREAT_KIND = {
    MISSILE: 'missile',
    LASER: 'laser',
} as const;

export type CombatThreatKind = (typeof COMBAT_THREAT_KIND)[keyof typeof COMBAT_THREAT_KIND];

export const LASER_SHOT_OUTCOME = {
    HIT: 'hit',
    ABSORBED: 'absorbed',
} as const;

export type LaserShotOutcome = (typeof LASER_SHOT_OUTCOME)[keyof typeof LASER_SHOT_OUTCOME];

export const PLAYER_MISSILE_OUTCOME = {
    TARGET_LOST: 'target_lost',
    INTERCEPTED: 'intercepted',
    HIT: 'hit',
} as const;

export type PlayerMissileOutcome =
    (typeof PLAYER_MISSILE_OUTCOME)[keyof typeof PLAYER_MISSILE_OUTCOME];

export const PLAYER_STICKY_MINE_OUTCOME = {
    TARGET_LOST: 'target_lost',
    CLEARED: 'cleared',
    DETONATED: 'detonated',
} as const;

export type PlayerStickyMineOutcome =
    (typeof PLAYER_STICKY_MINE_OUTCOME)[keyof typeof PLAYER_STICKY_MINE_OUTCOME];

export const PLAYER_SPAM_CHANNEL_OUTCOME = {
    EXPIRED: 'expired',
    CANCELLED: 'cancelled',
    PURGED: 'purged',
} as const;

export type PlayerSpamChannelOutcome =
    (typeof PLAYER_SPAM_CHANNEL_OUTCOME)[keyof typeof PLAYER_SPAM_CHANNEL_OUTCOME];

export const SPAM_CHANNEL_OUTCOME = {
    EXPIRED: 'expired',
    PURGED: 'purged',
} as const;

export type SpamChannelOutcome =
    (typeof SPAM_CHANNEL_OUTCOME)[keyof typeof SPAM_CHANNEL_OUTCOME];

export const COMBAT_SOURCE_KIND = {
    PLAYER_SHIP: 'player_ship',
    ACTOR: 'actor',
} as const;

export type CombatSource =
    | {
          kind:
              typeof COMBAT_SOURCE_KIND
                  .PLAYER_SHIP;
      }
    | {
          kind:
              typeof COMBAT_SOURCE_KIND
                  .ACTOR;

          actorId: string;
      };

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

          signature: MissileSignature;
      };

export type ThreatIdentificationResult = {
    kind: typeof COMBAT_THREAT_KIND.MISSILE;

    signature: MissileSignature;
};

export type MissileCombatProjectileState = {
    id: string;

    // Короткое стабильное обозначение
    // конкретной угрозы внутри encounter.
    designation: string;

    kind: typeof COMBAT_PROJECTILE_KIND.MISSILE;

    source: CombatSource;
    sourceWeaponId: string;

    target: CombatTarget;

    // Objective hidden truth of this concrete projectile.
    // missileId identifies ammo model and cannot reveal this value.
    signature: MissileSignature;

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

};

// Temporary shield created by the installed Shield Generator.
export type ActiveShieldState = {
    sourceEmitterId: string;

    remainingDurationMs: number;
    initialDurationMs: number;
};

// The mutable elapsed time remains authoritative on the weapon phase.
export type SpamChannelState = {
    id: string;

    sourceActorId: string;
    sourceWeaponId: string;

    elapsedMs: number;
    durationMs: number;
};


// После прикрепления мина живёт независимо
// от дальнейшего состояния dispenser.
//
// mineId сохраняет тип боеприпаса,
// source/target позволяют одной runtime-модели
// обслуживать оба направления атаки.
//
// Fuse и damage остаются snapshot payload,
// чтобы активная мина не зависела
// от последующих content-изменений.
export type StickyMineState = {
    id: string;

    mineId: StickyMineId;

    source: CombatSource;
    sourceWeaponId: string;

    target: CombatTarget;

    timeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    damage: number;
};

export type EncounterCombatState = {
    // Shared defensive-energy installation.
    // Some test/minimal encounters may omit it.
    powerCore?:
        PowerCoreState;

    // Mutable installed shield generator
    // текущего player ship в encounter.
    shieldGenerator?:
        ShieldGeneratorState;

    // Encounter-only temporary shield.
    activeShield:
        ActiveShieldState | null;

    // Mutable installed weapons
    // текущего player ship в encounter.
    playerWeapons: ShipWeaponState[];

    projectiles: CombatProjectileState[];
    laserAttacks: LaserAttackState[];

    stickyMines: StickyMineState[];
};
