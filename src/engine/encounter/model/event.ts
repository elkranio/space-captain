// src/engine/encounter/model/event.ts

import type { CharacterPortraitId } from '../../defs/character';
import type { PointDefenseBeamBand, PointDefenseShotOutcome } from '../../defs/point_defense';
import type { ShieldGeneratorState } from '../../defs/shield_generator';
import type { EncounterAnchorState } from '../anchors/encounter_anchor';
import type { JumpPointEncounterAnchorState } from '../anchors/jump_point/jump_point_encounter_anchor';
import { LASER_SHOT_OUTCOME } from './combat';
import type {
    ActiveShieldState,
    LaserAttackState,
    MissileCombatProjectileState,
    SpamChannelOutcome,
    SpamChannelState,
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
    PLAYER_SHIP_TARGETING_DETECTED: 'player_ship_targeting_detected',
    MISSILE_LAUNCHED: 'missile_launched',
    MISSILE_IMPACTED_PLAYER_SHIP: 'missile_impacted_player_ship',
    LASER_ATTACK_STARTED: 'laser_attack_started',
    LASER_FIRED: 'laser_fired',
    SPAM_ATTACK_STARTED: 'spam_attack_started',
    SPAM_CHANNEL_STARTED: 'spam_channel_started',
    SPAM_CHANNEL_ENDED: 'spam_channel_ended',
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

export type PlayerShipTargetingDetectedEvent = {
    type: typeof ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED;

    sourceActorId: string;
    sourceWeaponId: string;
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

export type SpamAttackStartedEvent = {
    type: typeof ENCOUNTER_EVENT.SPAM_ATTACK_STARTED;

    sourceActorId: string;
    sourceWeaponId: string;
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
    | PlayerShipTargetingDetectedEvent
    | MissileLaunchedEvent
    | MissileImpactedPlayerShipEvent
    | LaserAttackStartedEvent
    | LaserFiredEvent
    | SpamAttackStartedEvent
    | SpamChannelStartedEvent
    | SpamChannelEndedEvent;
