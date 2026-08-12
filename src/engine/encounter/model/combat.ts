// src/engine/encounter/model/combat.ts

import type {
    DefenseCapacitorState,
} from '../../defs/defense_capacitor';
import type { MissileSpectralBand, MissileId } from '../../defs/missile';
import type {
    StickyMineId,
} from '../../defs/sticky_mine';
import type {
    ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShieldEmitterState,
} from '../../defs/shield_emitter';

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

          spectralBand: MissileSpectralBand;
      };

export type ThreatIdentificationResult = {
    kind: typeof COMBAT_THREAT_KIND.MISSILE;

    spectralBand: MissileSpectralBand;
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

// Derived snapshot of one actively channeling spam projector.
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
    defenseCapacitor?:
        DefenseCapacitorState;

    // Mutable installed shield emitter
    // текущего player ship в encounter.
    shieldEmitter?:
        ShieldEmitterState;

    // Mutable installed weapons
    // текущего player ship в encounter.
    playerWeapons: ShipWeaponState[];

    projectiles: CombatProjectileState[];
    laserAttacks: LaserAttackState[];

    stickyMines: StickyMineState[];
};
