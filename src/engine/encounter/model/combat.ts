// src/engine/encounter/model/combat.ts

import type { PowerCoreState } from "../../defs/power_core";
import type { ShipDefenseTurretState } from "../../defs/defense_turret";
import type { ShipWeaponState } from "../../defs/ship_weapon";
import type { ShieldGeneratorState } from "../../defs/shield_generator";

export const COMBAT_PROJECTILE_KIND = {
    MISSILE: "missile",
} as const;

export const COMBAT_THREAT_KIND = {
    MISSILE: "missile",
    BEAM_CANNON: "beam_cannon",
} as const;

export type CombatThreatKind = (typeof COMBAT_THREAT_KIND)[keyof typeof COMBAT_THREAT_KIND];

export const BEAM_CANNON_SHOT_OUTCOME = {
    HIT: "hit",
    ABSORBED: "absorbed",
    MISS: "miss",
} as const;

export type BeamCannonShotOutcome = (typeof BEAM_CANNON_SHOT_OUTCOME)[keyof typeof BEAM_CANNON_SHOT_OUTCOME];

export const PLAYER_MISSILE_OUTCOME = {
    TARGET_LOST: "target_lost",
    INTERCEPTED: "intercepted",
    MISS: "miss",
    HIT: "hit",
} as const;

export type PlayerMissileOutcome = (typeof PLAYER_MISSILE_OUTCOME)[keyof typeof PLAYER_MISSILE_OUTCOME];

export const PLAYER_STICKY_MINE_OUTCOME = {
    TARGET_LOST: "target_lost",
    CLEARED: "cleared",
    DETONATED: "detonated",
} as const;

export type PlayerStickyMineOutcome = (typeof PLAYER_STICKY_MINE_OUTCOME)[keyof typeof PLAYER_STICKY_MINE_OUTCOME];

export const PLAYER_SPAM_CHANNEL_OUTCOME = {
    EXPIRED: "expired",
    CANCELLED: "cancelled",
    PURGED: "purged",
} as const;

export type PlayerSpamChannelOutcome = (typeof PLAYER_SPAM_CHANNEL_OUTCOME)[keyof typeof PLAYER_SPAM_CHANNEL_OUTCOME];

export const SPAM_CHANNEL_OUTCOME = {
    EXPIRED: "expired",
    PURGED: "purged",
} as const;

export type SpamChannelOutcome = (typeof SPAM_CHANNEL_OUTCOME)[keyof typeof SPAM_CHANNEL_OUTCOME];

export const COMBAT_SOURCE_KIND = {
    PLAYER_SHIP: "player_ship",
    ACTOR: "actor",
} as const;

export type CombatSource =
    | {
          kind: typeof COMBAT_SOURCE_KIND.PLAYER_SHIP;
      }
    | {
          kind: typeof COMBAT_SOURCE_KIND.ACTOR;

          actorId: string;
      };

export const COMBAT_TARGET_KIND = {
    PLAYER_SHIP: "player_ship",
    ACTOR: "actor",
} as const;

export type CombatTarget =
    | {
          kind: typeof COMBAT_TARGET_KIND.PLAYER_SHIP;
      }
    | {
          kind: typeof COMBAT_TARGET_KIND.ACTOR;

          actorId: string;
      };

export const BEAM_CANNON_TARGET_NODE = {
    HULL: "hull",
    DRIVE: "drive",
} as const;

export type BeamCannonTargetNode =
    (typeof BEAM_CANNON_TARGET_NODE)[keyof typeof BEAM_CANNON_TARGET_NODE];

export type MissileCombatProjectileState = {
    id: string;

    // Короткое стабильное обозначение
    // конкретной угрозы внутри encounter.
    designation: string;

    kind: typeof COMBAT_PROJECTILE_KIND.MISSILE;

    source: CombatSource;
    sourceWeaponId: string;

    target: CombatTarget;

    // Physical snapshot copied from launcher content at launch.
    // An in-flight projectile never re-reads weapon tuning.
    damage: number;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;
};

export type CombatProjectileState = MissileCombatProjectileState;

// Существует только во время CHARGING.
// Общая TARGETING-фаза ещё не создаёт видимую beamCannon threat.
export type BeamCannonAttackSnapshot = {
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

export type BeamCannonAttackState = BeamCannonAttackSnapshot & {
    targetNode: BeamCannonTargetNode;
};

export function createBeamCannonAttackSnapshot(attack: BeamCannonAttackSnapshot): BeamCannonAttackSnapshot {
    return {
        id: attack.id,
        designation: attack.designation,

        sourceActorId: attack.sourceActorId,
        sourceWeaponId: attack.sourceWeaponId,

        target: {
            ...attack.target,
        },
    };
}

// Temporary shield created by the installed Shield Generator.
export type ActiveShieldState = {
    sourceEmitterId: string;

    // Player shield protects one Beam Cannon target node.
    // Whole-ship enemy shields intentionally leave it undefined.
    targetNode?: BeamCannonTargetNode;

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

    source: CombatSource;
    sourceWeaponId: string;

    target: CombatTarget;

    timeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    damage: number;
};

export type EncounterCombatState = {
    // Installed player Defense Turret system.
    defenseTurret?: ShipDefenseTurretState;

    // Shared defensive-energy installation.
    // Some test/minimal encounters may omit it.
    powerCore?: PowerCoreState;

    // Mutable installed shield generator
    // текущего player ship в encounter.
    shieldGenerator?: ShieldGeneratorState;

    // Encounter-only temporary shield.
    activeShield: ActiveShieldState | null;

    // Mutable installed weapons
    // текущего player ship в encounter.
    playerWeapons: ShipWeaponState[];

    projectiles: CombatProjectileState[];
    beamCannonAttacks: BeamCannonAttackState[];

    stickyMines: StickyMineState[];
};
