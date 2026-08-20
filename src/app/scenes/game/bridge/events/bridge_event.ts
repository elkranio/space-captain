// src/app/scenes/game/bridge/events/bridge_event.ts

import type { OfficerRole } from "../../../../../engine/defs/officer";
import type { Vec3 } from "../../../../../engine/defs/vector";
import type { SpriteEntry } from "../../../../manifests/types";
import type { SceneKey } from "../../../scene_key";
import type { MissileSignatureIntelStatus } from "../../../../../engine/encounter/model/missile_signature_intel";
import type { DefenseTurretShotOutcome } from "../../../../../engine/defs/defense_turret";
import type { ShipDriveStatus } from "../../../../../engine/defs/ship_drive";
import type { ShipEvadePhase } from "../../../../../engine/defs/ship_evade";
import type { ShipWeaponKind } from "../../../../../engine/defs/ship_weapon";
import type { EncounterOfficerCommandId, OfficerCommandTarget } from "../../../../../engine/encounter/model/command";
import type {
    BeamCannonShotOutcome,
    BeamCannonTargetIntel,
    PlayerMissileOutcome,
    PlayerSpamChannelOutcome,
    PlayerStickyMineOutcome,
    SpamChannelOutcome,
} from "../../../../../engine/encounter/model/combat";
import type { PlayerShieldEndOutcome } from "../../../../../engine/encounter/model/event";

// Scene-local события bridge scene.
//
// Это не глобальная шина игры.
// События живут только внутри BridgeScene и связывают:
// - root/controller слой;
// - encounter controller;
// - bridge view;
// - вложенные UI/view модули.
//
// Naming rule:
// - *_LOADED / *_UPDATED / *_STARTED / *_ENDED / *_CLEARED =
//   факт или snapshot, на который реагирует view/controller;
// - *_CLICKED / *_SELECTED / *_REQUESTED =
//   input или intent от view к controller.
export const BRIDGE_EVENT = {
    // #region Crew and officer commands

    // Игрок кликнул по officer station.
    // View не определяет доступные команды,
    // а просит encounter controller открыть меню.
    OFFICER_STATION_CLICKED: "officer_station_clicked",

    // Открытое officer menu просит encounter controller
    // заново получить доступные команды текущей роли.
    OFFICER_COMMAND_MENU_REFRESH_REQUESTED: "officer_command_menu_refresh_requested",

    // Игрок выбрал команду в officer context menu.
    // Encounter controller передаст её в engine.
    OFFICER_COMMAND_SELECTED: "officer_command_selected",

    // View просит отменить конкретную active officer task.
    OFFICER_TASK_CANCEL_REQUESTED: "officer_task_cancel_requested",

    // Encounter controller отдаёт view
    // актуальный snapshot меню команд офицера.
    OFFICER_COMMAND_MENU_UPDATED: "officer_command_menu_updated",

    // Controller просит показать
    // короткий officer bark bubble.
    OFFICER_BARK_REQUESTED: "officer_bark_requested",

    // #endregion

    // #region Player ship status

    // View-ready captain dashboard snapshot
    // стабильной player-ship части.
    PLAYER_SHIP_DASHBOARD_UPDATED: "player_ship_dashboard_updated",

    // View-ready contextual combat snapshot
    // для правой части captain dashboard.
    CAPTAIN_COMBAT_CONTEXT_UPDATED: "captain_combat_context_updated",

    // #endregion

    // #region Encounter objects and navigation

    // Первый snapshot encounter objects.
    ENCOUNTER_OBJECTS_LOADED: "encounter_objects_loaded",

    // Новый encounter object подготовлен во view,
    // но не становится текущей presentation-группой.
    ENCOUNTER_OBJECT_ADDED: "encounter_object_added",

    // Encounter object permanently removed
    // from both runtime and presentation.
    ENCOUNTER_OBJECT_REMOVED: "encounter_object_removed",

    // Обновление presentation
    // уже известных encounter objects.
    ENCOUNTER_OBJECTS_UPDATED: "encounter_objects_updated",

    // Начало arrival animation
    // на bridge viewscreen.
    ENCOUNTER_ARRIVAL_STARTED: "encounter_arrival_started",

    // Arrival animation завершилась.
    // View сообщает об этом controller-у.
    ENCOUNTER_ARRIVAL_COMPLETED: "encounter_arrival_completed",

    // Начало визуального перелёта
    // между encounter objects.
    ENCOUNTER_TRAVEL_STARTED: "encounter_travel_started",

    // Началась поступательная фаза визуального перелёта.
    // При yaw-перелёте эмитится после завершения поворота.
    // При forward travel — сразу.
    ENCOUNTER_TRAVEL_FLIGHT_STARTED: "encounter_travel_flight_started",

    // Визуальный перелёт завершился.
    // View сообщает об этом controller-у.
    ENCOUNTER_TRAVEL_COMPLETED: "encounter_travel_completed",

    // Начался visual flow межнодового прыжка.
    ENCOUNTER_JUMP_STARTED: "encounter_jump_started",

    // Visual flow межнодового прыжка завершён.
    // View возвращает controller-у исходный jump payload.
    ENCOUNTER_JUMP_COMPLETED: "encounter_jump_completed",

    // #endregion

    // #region Docking

    // Encounter engine разрешил
    // начать визуальный docking flow.
    DOCKING_STARTED: "docking_started",

    // Визуальная docking animation завершилась.
    // View сообщает об этом controller-у.
    DOCKING_ANIMATION_COMPLETED: "docking_animation_completed",

    // #endregion

    // #region Scene lifecycle

    // Запрос перехода
    // в другую Phaser scene.
    SCENE_TRANSITION_REQUESTED: "scene_transition_requested",

    // #endregion

    // #region Combat presentation

    // Opening disruption pulse отключил
    // main drive player ship.
    PLAYER_SHIP_DRIVE_DISRUPTED: "player_ship_drive_disrupted",

    // Authoritative player Evade phase snapshot.
    PLAYER_EVADE_UPDATED: "player_evade_updated",

    // Authoritative Evade snapshots for enemy ships at the current anchor.
    ENEMY_EVADES_UPDATED: "enemy_evades_updated",

    // Вражеская missile launcher
    // начала фазу подготовки/наведения.
    ENEMY_ATTACK_WARNING_TRIGGERED: "enemy_attack_warning_triggered",

    // Фаза подготовки/наведения завершилась
    // или была отменена.
    ENEMY_ATTACK_WARNING_CLEARED: "enemy_attack_warning_cleared",

    // В encounter появилась новая
    // входящая вражеская ракета.
    INCOMING_MISSILE_ADDED: "incoming_missile_added",

    // Входящая ракета удалена
    // после impact или другого завершения.
    INCOMING_MISSILE_REMOVED: "incoming_missile_removed",

    STICKY_MINE_ADDED: "sticky_mine_added",

    STICKY_MINE_MISSED_PLAYER_SHIP: "sticky_mine_missed_player_ship",

    STICKY_MINES_UPDATED: "sticky_mines_updated",
    STICKY_MINE_REMOVED: "sticky_mine_removed",

    // Актуальный временной snapshot
    // всех входящих ракет.
    INCOMING_MISSILES_UPDATED: "incoming_missiles_updated",

    // Player ship запустил ракету
    // в actor encounter-цель.
    OUTGOING_MISSILE_ADDED: "outgoing_missile_added",

    // Актуальный временной snapshot
    // всех ракет игрока в полёте.
    OUTGOING_MISSILES_UPDATED: "outgoing_missiles_updated",

    // Ракета игрока завершила lifecycle:
    // target lost, interception или hull hit.
    OUTGOING_MISSILE_REMOVED: "outgoing_missile_removed",

    OUTGOING_STICKY_MINE_ADDED: "outgoing_sticky_mine_added",

    OUTGOING_STICKY_MINE_MISSED: "outgoing_sticky_mine_missed",

    OUTGOING_STICKY_MINES_UPDATED: "outgoing_sticky_mines_updated",

    OUTGOING_STICKY_MINE_REMOVED: "outgoing_sticky_mine_removed",

    OUTGOING_SPAM_CHANNEL_STARTED: "outgoing_spam_channel_started",

    OUTGOING_SPAM_CHANNEL_ENDED: "outgoing_spam_channel_ended",

    // Player Defense Turret завершила наведение
    // и разрешил выстрел по входящей угрозе.
    DEFENSE_TURRET_FIRED: "defense_turret_fired",

    // Enemy defense-turret разрешил выстрел
    // по исходящей ракете игрока.
    ENEMY_DEFENSE_TURRET_FIRED: "enemy_defense_turret_fired",

    // Вражеский beamCannon начал видимую charging-фазу.
    BEAM_CANNON_THREAT_ADDED: "beam_cannon_threat_added",

    // BeamCannon charging threat завершилась выстрелом.
    BEAM_CANNON_THREAT_REMOVED: "beam_cannon_threat_removed",

    // Актуальный временной и identification snapshot
    // всех активных beamCannon charging threats.
    BEAM_CANNON_THREATS_UPDATED: "beam_cannon_threats_updated",

    // Вражеский beamCannon разрешил выстрел,
    // который bridge view показывает коротким beam VFX.
    BEAM_CANNON_BEAM_FIRED: "beam_cannon_beam_fired",

    PLAYER_SHIELD_DEPLOYED: "player_shield_deployed",

    PLAYER_SHIELD_UPDATED: "player_shield_updated",

    PLAYER_SHIELD_ENDED: "player_shield_ended",

    ENEMY_SHIELDS_UPDATED: "enemy_shields_updated",

    PLAYER_BEAM_CANNON_CHARGING_STARTED: "player_beam_cannon_charging_started",

    PLAYER_BEAM_CANNON_CHARGING_CLEARED: "player_beam_cannon_charging_cleared",

    PLAYER_BEAM_CANNON_FIRED: "player_beam_cannon_fired",

    ENEMY_SHIP_DESTRUCTION_STARTED: "enemy_ship_destruction_started",

    ENEMY_SHIP_DESTRUCTION_COMPLETED: "enemy_ship_destruction_completed",

    // Hostile spam channel начал
    // проецировать popup-помехи на viewscreen.
    SPAM_CHANNEL_STARTED: "spam_channel_started",

    // Hostile spam channel завершился
    // естественно или был очищен игроком.
    SPAM_CHANNEL_ENDED: "spam_channel_ended",

    // #endregion
} as const;

// #region Crew and officer commands

// Payload input-события OFFICER_STATION_CLICKED.
export type BridgeOfficerStationClickedPayload = {
    role: OfficerRole;
};

// Payload polling-запроса открытого officer menu.
export type BridgeOfficerCommandMenuRefreshRequestedPayload = {
    role: OfficerRole;
};

// Payload input-события OFFICER_COMMAND_SELECTED.
export type BridgeOfficerCommandSelectedPayload = {
    role: OfficerRole;

    commandId: EncounterOfficerCommandId;
    target: OfficerCommandTarget;
};

export type BridgeOfficerTaskCancelRequestedPayload = {
    taskId: string;
};

// Один пункт legacy officer context menu.
// Пока menu существует, он показывает только engine-команды.
export type BridgeOfficerCommandMenuItemPayload = {
    kind: "command";

    commandId: EncounterOfficerCommandId;

    label: string;

    target: OfficerCommandTarget;
};

// Группа пунктов меню.
// Сейчас группа соответствует target label
// или GENERAL для untargeted commands.
export type BridgeOfficerCommandMenuGroupPayload = {
    label: string;

    items: BridgeOfficerCommandMenuItemPayload[];
};

// Актуальный view-ready snapshot officer menu.
export type BridgeOfficerCommandMenuUpdatedPayload = {
    role: OfficerRole;

    groups: BridgeOfficerCommandMenuGroupPayload[];
};

// Payload запроса officer bark.
export type BridgeOfficerBarkRequestedPayload = {
    role: OfficerRole;

    text: string;
};

// #endregion

// #region Player ship status

export const BRIDGE_PLAYER_SYSTEM_ACTION_STATE = {
    ACTIVE: "active",
    DISABLED_SYSTEM: "disabled_system",
    DISABLED_OFFICER_BUSY: "disabled_officer_busy",
    ENGAGED_CURRENT_WORK: "engaged_current_work",
} as const;

export type BridgePlayerSystemActionState =
    (typeof BRIDGE_PLAYER_SYSTEM_ACTION_STATE)[keyof typeof BRIDGE_PLAYER_SYSTEM_ACTION_STATE];

export type BridgePlayerWeaponDashboardPayload = {
    id: string;
    weaponId: string;

    kind: ShipWeaponKind;

    ammo?: {
        current: number;
        max: number;
    };

    // 0..1 elapsed cooldown.
    // Undefined means the cooldown bar is not shown.
    cooldownProgress?: number;

    action: {
        state: BridgePlayerSystemActionState;

        // Exact engine-resolved command for this installed weapon.
        // Present only for ACTIVE state.
        command?: BridgeOfficerCommandSelectedPayload;
    };
};

export type BridgePlayerShipDashboardUpdatedPayload = {
    // Stable top strip owned by the captain dashboard itself.
    status?: {
        hull: {
            current: number;
            max: number;
        };

        powerCore: {
            current: number;
            max: number;

            // 0..1 progress toward the next sequential charge.
            // Undefined at full capacity.
            rechargeProgress?: number;
        };

        drive: {
            status: ShipDriveStatus;
            integrity: number;
        };

        evadeAction: {
            state: BridgePlayerSystemActionState;

            // Exact engine-resolved HELM_EVADE command.
            // Present only while the action is ACTIVE.
            command?: BridgeOfficerCommandSelectedPayload;
        };
    };

    // One row per installed weapon. Runtime id keeps duplicate kinds distinct.
    // Optional so focused status-only presentation callers can omit the list;
    // systems view treats omission as an empty full snapshot.
    weapons?: BridgePlayerWeaponDashboardPayload[];
};

// #endregion

// #region Captain combat context

export type BridgeCaptainIncomingMissilePayload = {
    projectileId: string;
    designation: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;

    identificationStatus: MissileSignatureIntelStatus;

    actions: {
        identifyThreat?: BridgeOfficerCommandSelectedPayload;

        interceptMissile?: BridgeOfficerCommandSelectedPayload;
    };

    activeTasks?: {
        identifyThreatTaskId?: string;
        interceptMissileTaskId?: string;
    };

    decisionTimings?: {
        identifyThreatMinRemainingMs: number | null;
        interceptMissileMinRemainingMs: number | null;
    };
};

export type BridgeCaptainIncomingBeamCannonPayload = {
    attackId: string;
    designation: string;

    targetIntel: BeamCannonTargetIntel;

    timeToFireMs: number;
    initialTimeToFireMs: number;

    actions: {
        trackTarget?: BridgeOfficerCommandSelectedPayload;
        deployShield?: BridgeOfficerCommandSelectedPayload;
    };

    activeTasks?: {
        trackTargetTaskId?: string;
        deployShieldTaskId?: string;
    };

    decisionTimings?: {
        trackTargetMinRemainingMs: number | null;

        shieldWindow: {
            opensAtRemainingMs: number;
            closesAtRemainingMs: number;
        } | null;
    };
};

export type BridgeCaptainStickyMinePayload = {
    mineId: string;

    timeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;

    actions: {
        engineerClear?: BridgeOfficerCommandSelectedPayload;
    };

    activeTasks?: {
        engineerClearTaskId?: string;
    };

    decisionTimings?: {
        clearMinRemainingMs: number | null;
    };
};

export type BridgeCaptainSpamChannelPayload = {
    channelId: string;

    remainingDurationMs: number;
    initialDurationMs: number;

    actions: {
        purgeSpam?: BridgeOfficerCommandSelectedPayload;
    };

    activeTasks?: {
        purgeSpamTaskId?: string;
    };
};

export type BridgeCaptainCombatContextUpdatedPayload = {
    enemyShip?: {
        actorId: string;

        hull: {
            current: number;
            max: number;
        };

        powerCore?: {
            current: number;
            max: number;

            rechargeProgress?: number;
        };
    };

    incomingMissiles: BridgeCaptainIncomingMissilePayload[];

    incomingBeamCannons: BridgeCaptainIncomingBeamCannonPayload[];

    incomingStickyMines: BridgeCaptainStickyMinePayload[];

    activeSpamChannels: BridgeCaptainSpamChannelPayload[];
};

// #endregion

// #region Encounter objects and navigation

// View-ready описание одного encounter object.
export type BridgeEncounterObjectPayload = {
    id: string;

    // Navigation object, вокруг которого
    // собирается визуальная anchor group.
    anchorObjectId: string;

    // Позиция внутри space node.
    localPosition: Vec3;

    // Коэффициент псевдоперспективы.
    perspectiveDepth: number;

    sprite: SpriteEntry;

    // Финальная композиционная позиция
    // внутри bridge viewscreen.
    position: Phaser.Math.Vector2;
};

// Payload начала arrival flow.
export type BridgeEncounterObjectRemovedPayload = {
    objectId: string;
};

export type BridgeEncounterArrivalStartedPayload = {
    targetId: string;
};

// Payload начала визуального travel flow.
//
// taskId связывает animation
// с конкретной HELM_FLY_TO task instance.
export type BridgeEncounterTravelStartedPayload = {
    taskId: string;

    fromObjectId: string;

    targetObjectId: string;
};

// Payload завершения визуального travel flow.
//
// View возвращает тот же taskId,
// который получил при старте animation.
export type BridgeEncounterTravelCompletedPayload = {
    taskId: string;
};

// Общий payload начала и завершения
// визуального межнодового jump flow.
export type BridgeEncounterJumpPayload = {
    taskId: string;

    targetNodeId: string;
};

// #endregion

// #region Docking

// Payload начала визуального docking flow.
export type BridgeDockingStartedPayload = {
    taskId: string;

    targetId: string;
};

// Payload завершения визуального docking flow.
export type BridgeDockingCompletedPayload = {
    taskId: string;
};

// #endregion

// #region Scene lifecycle

// Payload запроса перехода
// в другую Phaser scene.
export type BridgeSceneTransitionRequestedPayload = {
    sceneKey: SceneKey;
};

// #endregion

// #region Combat presentation

export type BridgePlayerEvadeUpdatedPayload = {
    phase: ShipEvadePhase;

    phaseElapsedMs: number;
};

export type BridgeEnemyEvadePayload = {
    actorId: string;

    phase: ShipEvadePhase;

    phaseElapsedMs: number;

    // Read-model timing used only to map authoritative active progress to the
    // accepted render drift. The view never imports drive tuning itself.
    evadeDurationMs: number;
};

export type BridgeEnemyEvadesUpdatedPayload = BridgeEnemyEvadePayload[];

// Новая входящая ракета.
export type BridgeIncomingMissileAddedPayload = {
    projectileId: string;

    designation: string;

    sourceActorId: string;

    initialTimeToImpactMs: number;
};

// Входящая ракета завершила runtime lifecycle.
export type BridgeIncomingMissileRemovedPayload = {
    projectileId: string;
};

// Актуальное runtime-состояние одной входящей ракеты.
export type BridgeIncomingMissileUpdatePayload = {
    projectileId: string;

    timeToImpactMs: number;

    identificationStatus: MissileSignatureIntelStatus;
};

// Актуальный snapshot всех входящих ракет.
export type BridgeIncomingMissilesUpdatedPayload = BridgeIncomingMissileUpdatePayload[];

export type BridgeOutgoingMissileAddedPayload = {
    projectileId: string;

    targetActorId: string;

    initialTimeToImpactMs: number;
};

export type BridgeOutgoingMissileUpdatePayload = {
    projectileId: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;
};

export type BridgeOutgoingMissilesUpdatedPayload = BridgeOutgoingMissileUpdatePayload[];

export type BridgeOutgoingMissileRemovedPayload = {
    projectileId: string;

    targetActorId: string;

    outcome: PlayerMissileOutcome;
};

export type BridgeOutgoingStickyMineAddedPayload = {
    mineId: string;

    targetActorId: string;

    initialTimeToDetonationMs: number;
};

export type BridgeOutgoingStickyMineMissedPayload = {
    mineId: string;

    targetActorId: string;
};

export type BridgeOutgoingStickyMineUpdatePayload = {
    mineId: string;

    remainingTimeToDetonationMs: number;
    initialTimeToDetonationMs: number;
};

export type BridgeOutgoingStickyMinesUpdatedPayload = BridgeOutgoingStickyMineUpdatePayload[];

export type BridgeOutgoingStickyMineRemovedPayload = {
    mineId: string;

    targetActorId: string;

    outcome: PlayerStickyMineOutcome;
};

export type BridgeOutgoingSpamChannelStartedPayload = {
    channelId: string;

    targetActorId: string;
};

export type BridgeOutgoingSpamChannelEndedPayload = {
    channelId: string;

    targetActorId: string;

    outcome: PlayerSpamChannelOutcome;
};

export type BridgeDefenseTurretFiredPayload = {
    projectileId: string;

    outcome: DefenseTurretShotOutcome;
};

export type BridgeEnemyDefenseTurretFiredPayload = {
    sourceActorId: string;
    projectileId: string;

    outcome: DefenseTurretShotOutcome;
};

export type BridgeBeamCannonThreatAddedPayload = {
    attackId: string;

    designation: string;

    sourceActorId: string;
};

export type BridgeBeamCannonThreatRemovedPayload = {
    attackId: string;
};

export type BridgeBeamCannonThreatUpdatePayload = {
    attackId: string;

    timeToFireMs: number;
    initialTimeToFireMs: number;
};

export type BridgeBeamCannonThreatsUpdatedPayload = BridgeBeamCannonThreatUpdatePayload[];

export type BridgeBeamCannonBeamFiredPayload = {
    sourceActorId: string;

    outcome: BeamCannonShotOutcome;
};

export type BridgePlayerShieldSnapshotPayload = {
    remainingDurationMs: number;
    initialDurationMs: number;
};

export type BridgePlayerShieldUpdatedPayload = BridgePlayerShieldSnapshotPayload | null;

export type BridgePlayerShieldEndedPayload = {
    outcome: PlayerShieldEndOutcome;
};

export type BridgeEnemyShieldPayload = {
    actorId: string;

    remainingDurationMs: number;
    initialDurationMs: number;
};

export type BridgeEnemyShieldsUpdatedPayload = BridgeEnemyShieldPayload[];

export type BridgePlayerBeamCannonChargingStartedPayload = {
    weaponId: string;

    targetActorId: string;
};

export type BridgePlayerBeamCannonChargingClearedPayload = {
    weaponId: string;
};

export type BridgePlayerBeamCannonFiredPayload = {
    weaponId: string;

    targetActorId: string;

    outcome: BeamCannonShotOutcome;
};

export type BridgeEnemyShipDestructionPayload = {
    actorId: string;
};

export type BridgeSpamChannelStartedPayload = {
    channelId: string;
};

export type BridgeSpamChannelEndedPayload = {
    channelId: string;

    outcome: SpamChannelOutcome;
};

// #endregion

// Typed mapping:
// каждое bridge event name связано
// со своим payload.
//
// undefined означает,
// что событие несёт только сам факт.

export const BRIDGE_STICKY_MINE_REMOVAL_OUTCOME = {
    CLEARED: "cleared",
    DETONATED: "detonated",
} as const;

export type BridgeStickyMineRemovalOutcome =
    (typeof BRIDGE_STICKY_MINE_REMOVAL_OUTCOME)[keyof typeof BRIDGE_STICKY_MINE_REMOVAL_OUTCOME];

export type BridgeStickyMineAddedPayload = {
    mineId: string;

    sourceActorId: string;

    initialTimeToDetonationMs: number;
};

export type BridgeStickyMineMissedPlayerShipPayload = {
    sourceActorId: string;
};

export type BridgeStickyMineSnapshotPayload = {
    mineId: string;

    remainingTimeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;
};

export type BridgeStickyMinesUpdatedPayload = BridgeStickyMineSnapshotPayload[];

export type BridgeStickyMineRemovedPayload = {
    mineId: string;

    outcome: BridgeStickyMineRemovalOutcome;
};

export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.STICKY_MINE_ADDED]: BridgeStickyMineAddedPayload;

    [BRIDGE_EVENT.STICKY_MINE_MISSED_PLAYER_SHIP]: BridgeStickyMineMissedPlayerShipPayload;

    [BRIDGE_EVENT.STICKY_MINES_UPDATED]: BridgeStickyMinesUpdatedPayload;
    [BRIDGE_EVENT.STICKY_MINE_REMOVED]: BridgeStickyMineRemovedPayload;

    // Crew and officer commands

    [BRIDGE_EVENT.OFFICER_STATION_CLICKED]: BridgeOfficerStationClickedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_REFRESH_REQUESTED]: BridgeOfficerCommandMenuRefreshRequestedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_SELECTED]: BridgeOfficerCommandSelectedPayload;

    [BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED]: BridgeOfficerTaskCancelRequestedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED]: BridgeOfficerCommandMenuUpdatedPayload;

    [BRIDGE_EVENT.OFFICER_BARK_REQUESTED]: BridgeOfficerBarkRequestedPayload;

    // Player ship status

    [BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED]: BridgePlayerShipDashboardUpdatedPayload;

    [BRIDGE_EVENT.CAPTAIN_COMBAT_CONTEXT_UPDATED]: BridgeCaptainCombatContextUpdatedPayload;

    // Encounter objects and navigation

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED]: BridgeEncounterObjectPayload;

    [BRIDGE_EVENT.ENCOUNTER_OBJECT_REMOVED]: BridgeEncounterObjectRemovedPayload;

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED]: BridgeEncounterArrivalStartedPayload;

    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED]: undefined;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED]: BridgeEncounterTravelStartedPayload;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED]: undefined;

    [BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED]: BridgeEncounterTravelCompletedPayload;

    [BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED]: BridgeEncounterJumpPayload;

    [BRIDGE_EVENT.ENCOUNTER_JUMP_COMPLETED]: BridgeEncounterJumpPayload;

    // Docking

    [BRIDGE_EVENT.DOCKING_STARTED]: BridgeDockingStartedPayload;

    [BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED]: BridgeDockingCompletedPayload;

    // Scene lifecycle

    [BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED]: BridgeSceneTransitionRequestedPayload;

    // Combat presentation

    [BRIDGE_EVENT.PLAYER_SHIP_DRIVE_DISRUPTED]: undefined;

    [BRIDGE_EVENT.PLAYER_EVADE_UPDATED]: BridgePlayerEvadeUpdatedPayload;

    [BRIDGE_EVENT.ENEMY_EVADES_UPDATED]: BridgeEnemyEvadesUpdatedPayload;

    [BRIDGE_EVENT.ENEMY_ATTACK_WARNING_TRIGGERED]: undefined;

    [BRIDGE_EVENT.ENEMY_ATTACK_WARNING_CLEARED]: undefined;

    [BRIDGE_EVENT.INCOMING_MISSILE_ADDED]: BridgeIncomingMissileAddedPayload;

    [BRIDGE_EVENT.INCOMING_MISSILE_REMOVED]: BridgeIncomingMissileRemovedPayload;

    [BRIDGE_EVENT.INCOMING_MISSILES_UPDATED]: BridgeIncomingMissilesUpdatedPayload;

    [BRIDGE_EVENT.OUTGOING_MISSILE_ADDED]: BridgeOutgoingMissileAddedPayload;

    [BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED]: BridgeOutgoingMissilesUpdatedPayload;

    [BRIDGE_EVENT.OUTGOING_MISSILE_REMOVED]: BridgeOutgoingMissileRemovedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINE_ADDED]: BridgeOutgoingStickyMineAddedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINE_MISSED]: BridgeOutgoingStickyMineMissedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED]: BridgeOutgoingStickyMinesUpdatedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINE_REMOVED]: BridgeOutgoingStickyMineRemovedPayload;

    [BRIDGE_EVENT.OUTGOING_SPAM_CHANNEL_STARTED]: BridgeOutgoingSpamChannelStartedPayload;

    [BRIDGE_EVENT.OUTGOING_SPAM_CHANNEL_ENDED]: BridgeOutgoingSpamChannelEndedPayload;

    [BRIDGE_EVENT.DEFENSE_TURRET_FIRED]: BridgeDefenseTurretFiredPayload;

    [BRIDGE_EVENT.ENEMY_DEFENSE_TURRET_FIRED]: BridgeEnemyDefenseTurretFiredPayload;

    [BRIDGE_EVENT.BEAM_CANNON_THREAT_ADDED]: BridgeBeamCannonThreatAddedPayload;

    [BRIDGE_EVENT.BEAM_CANNON_THREAT_REMOVED]: BridgeBeamCannonThreatRemovedPayload;

    [BRIDGE_EVENT.BEAM_CANNON_THREATS_UPDATED]: BridgeBeamCannonThreatsUpdatedPayload;

    [BRIDGE_EVENT.BEAM_CANNON_BEAM_FIRED]: BridgeBeamCannonBeamFiredPayload;

    [BRIDGE_EVENT.PLAYER_SHIELD_DEPLOYED]: BridgePlayerShieldSnapshotPayload;

    [BRIDGE_EVENT.PLAYER_SHIELD_UPDATED]: BridgePlayerShieldUpdatedPayload;

    [BRIDGE_EVENT.PLAYER_SHIELD_ENDED]: BridgePlayerShieldEndedPayload;

    [BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED]: BridgeEnemyShieldsUpdatedPayload;

    [BRIDGE_EVENT.PLAYER_BEAM_CANNON_CHARGING_STARTED]: BridgePlayerBeamCannonChargingStartedPayload;

    [BRIDGE_EVENT.PLAYER_BEAM_CANNON_CHARGING_CLEARED]: BridgePlayerBeamCannonChargingClearedPayload;

    [BRIDGE_EVENT.PLAYER_BEAM_CANNON_FIRED]: BridgePlayerBeamCannonFiredPayload;

    [BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED]: BridgeEnemyShipDestructionPayload;

    [BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_COMPLETED]: BridgeEnemyShipDestructionPayload;

    [BRIDGE_EVENT.SPAM_CHANNEL_STARTED]: BridgeSpamChannelStartedPayload;

    [BRIDGE_EVENT.SPAM_CHANNEL_ENDED]: BridgeSpamChannelEndedPayload;
};
