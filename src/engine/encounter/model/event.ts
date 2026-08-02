// src/engine/encounter/model/event.ts

import type { CharacterPortraitId } from '../../defs/character';
import type {
    LaserTargetZone,
} from '../../defs/laser';
import type { PlayerSpaceNavigationState } from '../../defs/player_location';
import type { PointDefenseBeamBand, PointDefenseShotOutcome } from '../../defs/point_defense';
import type { ShieldGeneratorState } from '../../defs/shield_generator';
import type { ShipDriveState } from '../../defs/ship_drive';
import type { EncounterAnchorState } from '../anchors/encounter_anchor';
import type { JumpPointEncounterAnchorState } from '../anchors/jump_point/jump_point_encounter_anchor';
import {
    LASER_SHOT_OUTCOME,
    PLAYER_MISSILE_OUTCOME,
    PLAYER_STICKY_MINE_OUTCOME,
} from './combat';
import type {
    ActiveShieldState,
    LaserAttackState,
    MissileCombatProjectileState,
    SpamChannelOutcome,
    SpamChannelState,
    StickyMineState,
    ThreatIdentificationResult,
} from './combat';
import type { OfficerTaskState } from './officer_task';
import type { EncounterState } from './state';

// События, которые EncounterEngine отдаёт наружу
// через outbox.
//
// Engine сообщает только о доменных изменениях,
// app-слой сам решает, как это показать.
export const ENCOUNTER_EVENT = {
    ENCOUNTER_LOADED: 'encounter_loaded',
    CONTACT_STARTED: 'contact_started',
    CONTACT_MESSAGE_ADDED: 'contact_message_added',
    CONTACT_ENDED: 'contact_ended',
    TRAVEL_STARTED: 'travel_started',
    JUMP_STARTED: 'jump_started',
    DOCKING_STARTED: 'docking_started',
    OFFICER_TASK_STARTED: 'officer_task_started',
    OFFICER_TASK_ENDED: 'officer_task_ended',
    PLAYER_POINT_DEFENSE_CHARGE_SPENT: 'player_point_defense_charge_spent',
    PLAYER_SHIELD_GENERATOR_STATE_CHANGED: 'player_shield_generator_state_changed',
    PLAYER_SHIP_DRIVE_STATE_CHANGED: 'player_ship_drive_state_changed',
    PLAYER_SHIP_DRIVE_DISRUPTED: 'player_ship_drive_disrupted',
    PLAYER_SHIP_TARGETING_DETECTED: 'player_ship_targeting_detected',

    PLAYER_LASER_CHARGING_STARTED:
        'player_laser_charging_started',

    PLAYER_LASER_FIRED:
        'player_laser_fired',

    PLAYER_MISSILE_LAUNCHED:
        'player_missile_launched',

    PLAYER_MISSILE_RESOLVED:
        'player_missile_resolved',

    PLAYER_STICKY_MINE_ATTACHED:
        'player_sticky_mine_attached',

    PLAYER_STICKY_MINE_RESOLVED:
        'player_sticky_mine_resolved',

    ENEMY_SHIP_DESTROYED:
        'enemy_ship_destroyed',

    MISSILE_LAUNCHED: 'missile_launched',
    MISSILE_IMPACTED_PLAYER_SHIP: 'missile_impacted_player_ship',
    LASER_ATTACK_STARTED: 'laser_attack_started',
    LASER_FIRED: 'laser_fired',
    SPAM_CHANNEL_STARTED: 'spam_channel_started',
    SPAM_CHANNEL_ENDED: 'spam_channel_ended',
    STICKY_MINE_ATTACHED: 'sticky_mine_attached',
    STICKY_MINE_DETONATED: 'sticky_mine_detonated',
} as const;

export const OFFICER_TASK_OUTCOME = {
    COMPLETED: 'completed',

    CANCELLED: 'cancelled',
} as const;

export type OfficerTaskOutcome = (typeof OFFICER_TASK_OUTCOME)[keyof typeof OFFICER_TASK_OUTCOME];

export const OFFICER_TASK_RESULT_KIND = {
    DOCKING_CLEARANCE_GRANTED: 'docking_clearance_granted',
    JUMP_POINT_CALCULATED: 'jump_point_calculated',
    THREAT_IDENTIFIED: 'threat_identified',
    SHIELD_DEPLOYED: 'shield_deployed',
    POINT_DEFENSE_FIRED: 'point_defense_fired',
    STICKY_MINE_CLEARED: 'sticky_mine_cleared',
} as const;

export type OfficerTaskResult =
    | {
          kind: typeof OFFICER_TASK_RESULT_KIND.DOCKING_CLEARANCE_GRANTED;
          targetAnchorId: string;
      }
    | {
          kind: typeof OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED;
          anchor: JumpPointEncounterAnchorState;
      }
    | {
          kind: typeof OFFICER_TASK_RESULT_KIND.THREAT_IDENTIFIED;

          threatId: string;
          identification: ThreatIdentificationResult;
      }
    | {
          kind: typeof OFFICER_TASK_RESULT_KIND.SHIELD_DEPLOYED;

          shield: ActiveShieldState;
      }
    | {
          kind: typeof OFFICER_TASK_RESULT_KIND.POINT_DEFENSE_FIRED;

          threatId: string;

          beamBand: PointDefenseBeamBand;
          outcome: PointDefenseShotOutcome;
      }
    | {
          kind: typeof OFFICER_TASK_RESULT_KIND.STICKY_MINE_CLEARED;

          mineId: string;
      };

// Полный snapshot encounter после создания
// или пересборки состояния.
export type EncounterLoadedEvent = {
    type: typeof ENCOUNTER_EVENT.ENCOUNTER_LOADED;

    state: EncounterState;
};

// Начало структурного contact/dialogue flow
// с внешним собеседником.
export type ContactStartedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_STARTED;

    contactName: string;

    contactPortraitId: CharacterPortraitId;
};

// Новая реплика внутри active contact flow.
export type ContactMessageAddedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED;

    speakerName: string;

    text: string;
};

// Завершение active contact flow.
export type ContactEndedEvent = {
    type: typeof ENCOUNTER_EVENT.CONTACT_ENDED;
};

// Начало локального перелёта
// между encounter anchors.
//
// Визуальный travel flow выполняет app-слой.
//
// taskId связывает visual flow
// с конкретной runtime task instance.
export type TravelStartedEvent = {
    type: typeof ENCOUNTER_EVENT.TRAVEL_STARTED;

    taskId: string;

    fromAnchorId: string;

    target: EncounterAnchorState;
};

// Начало межнодового прыжка.
//
// Visual flow выполняет app-слой.
// После его завершения GameRuntime переносит игрока
// в destination node и пересоздаёт encounter.
export type JumpStartedEvent = {
    type: typeof ENCOUNTER_EVENT.JUMP_STARTED;

    taskId: string;

    targetNodeId: string;
};

// Начало docking flow
// с конкретной encounter-целью.
//
// Визуальную анимацию docking
// выполняет app-слой.
export type DockingStartedEvent = {
    type: typeof ENCOUNTER_EVENT.DOCKING_STARTED;

    taskId: string;

    targetId: string;
};

// Начало officer task.
//
// task — единый snapshot,
// описывающий конкретную runtime task.
export type OfficerTaskStartedEvent = {
    type: typeof ENCOUNTER_EVENT.OFFICER_TASK_STARTED;

    task: OfficerTaskState;
};

// Завершение officer task.
//
// Событие сохраняет snapshot завершённой task
// вместе с outcome и возможным domain result.
export type OfficerTaskEndedEvent = {
    type: typeof ENCOUNTER_EVENT.OFFICER_TASK_ENDED;

    task: OfficerTaskState;

    outcome: OfficerTaskOutcome;

    result?: OfficerTaskResult;
};

export type PlayerPointDefenseChargeSpentEvent = {
    type: typeof ENCOUNTER_EVENT.PLAYER_POINT_DEFENSE_CHARGE_SPENT;

    remainingCharges: number;
};

export type PlayerShieldGeneratorStateChangedEvent = {
    type: typeof ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED;

    shieldGenerator: ShieldGeneratorState;
};

export type PlayerShipDriveStateChangedEvent = {
    type:
        typeof ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED;

    drive: ShipDriveState;
};

export type PlayerShipDriveDisruptedEvent = {
    type:
        typeof ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED;

    sourceActorId: string;

    drive: ShipDriveState;
    navigation: PlayerSpaceNavigationState;
};

export type PlayerShipTargetingDetectedEvent = {
    type: typeof ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED;

    sourceActorId: string;
    sourceWeaponId: string;
};

export type PlayerLaserChargingStartedEvent = {
    type:
        typeof ENCOUNTER_EVENT.PLAYER_LASER_CHARGING_STARTED;

    weaponId: string;

    targetActorId: string;
    targetZone: LaserTargetZone;

    chargeDurationMs: number;
};

export type PlayerLaserFiredEvent =
    | {
          type:
              typeof ENCOUNTER_EVENT.PLAYER_LASER_FIRED;

          weaponId: string;

          targetActorId: string;
          targetZone: LaserTargetZone;

          outcome:
              typeof LASER_SHOT_OUTCOME.BLOCKED;

          remainingShieldCharges: number;
      }
    | {
          type:
              typeof ENCOUNTER_EVENT.PLAYER_LASER_FIRED;

          weaponId: string;

          targetActorId: string;
          targetZone: LaserTargetZone;

          outcome:
              typeof LASER_SHOT_OUTCOME.HIT;

          damage: number;
          remainingHull: number;
      };

export type PlayerMissileLaunchedEvent = {
    type:
        typeof ENCOUNTER_EVENT
            .PLAYER_MISSILE_LAUNCHED;

    projectile:
        MissileCombatProjectileState;
};

export type PlayerMissileResolvedEvent =
    | {
          type:
              typeof ENCOUNTER_EVENT
                  .PLAYER_MISSILE_RESOLVED;

          projectile:
              MissileCombatProjectileState;

          outcome:
              typeof PLAYER_MISSILE_OUTCOME
                  .TARGET_LOST;
      }
    | {
          type:
              typeof ENCOUNTER_EVENT
                  .PLAYER_MISSILE_RESOLVED;

          projectile:
              MissileCombatProjectileState;

          outcome:
              typeof PLAYER_MISSILE_OUTCOME
                  .HIT;

          damage: number;
          remainingHull: number;
      };

export type PlayerStickyMineAttachedEvent = {
    type:
        typeof ENCOUNTER_EVENT
            .PLAYER_STICKY_MINE_ATTACHED;

    mine: StickyMineState;
};

export type PlayerStickyMineResolvedEvent =
    | {
          type:
              typeof ENCOUNTER_EVENT
                  .PLAYER_STICKY_MINE_RESOLVED;

          mine: StickyMineState;

          outcome:
              typeof PLAYER_STICKY_MINE_OUTCOME
                  .TARGET_LOST;
      }
    | {
          type:
              typeof ENCOUNTER_EVENT
                  .PLAYER_STICKY_MINE_RESOLVED;

          mine: StickyMineState;

          outcome:
              typeof PLAYER_STICKY_MINE_OUTCOME
                  .DETONATED;

          damage: number;
          remainingHull: number;
      };

export type EnemyShipDestroyedEvent = {
    type:
        typeof ENCOUNTER_EVENT.ENEMY_SHIP_DESTROYED;

    actorId: string;
};

export type MissileLaunchedEvent = {
    type: typeof ENCOUNTER_EVENT.MISSILE_LAUNCHED;

    projectile: MissileCombatProjectileState;
};

export type MissileImpactedPlayerShipEvent = {
    type: typeof ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP;

    projectile: MissileCombatProjectileState;

    damage: number;
};

export type StickyMineAttachedEvent = {
    type: typeof ENCOUNTER_EVENT.STICKY_MINE_ATTACHED;

    mine: StickyMineState;
};

export type StickyMineDetonatedEvent = {
    type: typeof ENCOUNTER_EVENT.STICKY_MINE_DETONATED;

    mine: StickyMineState;

    damage: number;
};

export type LaserAttackStartedEvent = {
    type: typeof ENCOUNTER_EVENT.LASER_ATTACK_STARTED;

    attack: LaserAttackState;
};

export type LaserFiredEvent =
    | {
          type: typeof ENCOUNTER_EVENT.LASER_FIRED;

          attack: LaserAttackState;

          outcome: typeof LASER_SHOT_OUTCOME.BLOCKED;
      }
    | {
          type: typeof ENCOUNTER_EVENT.LASER_FIRED;

          attack: LaserAttackState;

          outcome: typeof LASER_SHOT_OUTCOME.HIT;
          damage: number;
      };


export type SpamChannelStartedEvent = {
    type: typeof ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED;

    channel: SpamChannelState;
};

export type SpamChannelEndedEvent = {
    type: typeof ENCOUNTER_EVENT.SPAM_CHANNEL_ENDED;

    channel: SpamChannelState;
    outcome: SpamChannelOutcome;
};

export type EncounterEvent =
    | EncounterLoadedEvent
    | ContactStartedEvent
    | ContactMessageAddedEvent
    | ContactEndedEvent
    | TravelStartedEvent
    | JumpStartedEvent
    | DockingStartedEvent
    | OfficerTaskStartedEvent
    | OfficerTaskEndedEvent
    | PlayerPointDefenseChargeSpentEvent
    | PlayerShieldGeneratorStateChangedEvent
    | PlayerShipDriveStateChangedEvent
    | PlayerShipDriveDisruptedEvent
    | PlayerShipTargetingDetectedEvent
    | PlayerLaserChargingStartedEvent
    | PlayerLaserFiredEvent
    | PlayerMissileLaunchedEvent
    | PlayerMissileResolvedEvent
    | PlayerStickyMineAttachedEvent
    | PlayerStickyMineResolvedEvent
    | EnemyShipDestroyedEvent
    | MissileLaunchedEvent
    | MissileImpactedPlayerShipEvent
    | StickyMineAttachedEvent
    | StickyMineDetonatedEvent
    | LaserAttackStartedEvent
    | LaserFiredEvent
    | SpamChannelStartedEvent
    | SpamChannelEndedEvent;
