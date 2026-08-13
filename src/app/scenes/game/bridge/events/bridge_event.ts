// src/app/scenes/game/bridge/events/bridge_event.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { Vec3 } from '../../../../../engine/defs/vector';
import type { SpriteEntry } from '../../../../manifests/types';
import type { SceneKey } from '../../../scene_key';
import type {
    MissileId,
    MissileSignature,
} from '../../../../../engine/defs/missile';
import type { DefenseTurretSignature, DefenseTurretShotOutcome } from '../../../../../engine/defs/defense_turret';
import type { ShipDriveStatus } from '../../../../../engine/defs/ship_drive';
import type { ShipWeaponPhase } from '../../../../../engine/defs/ship_weapon';
import type { EncounterOfficerCommandId, OfficerCommandTarget } from '../../../../../engine/encounter/model/command';
import type {
    LaserShotOutcome,
    PlayerMissileOutcome,
    PlayerSpamChannelOutcome,
    PlayerStickyMineOutcome,
    SpamChannelOutcome,
} from '../../../../../engine/encounter/model/combat';
import type {
    PlayerShieldEndOutcome,
} from '../../../../../engine/encounter/model/event';

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

    // Initial snapshot экипажа для bridge UI.
    // Эмитит BridgeController после чтения GAME_RUNTIME.
    // Слушает crew view.
    CREW_LOADED: 'crew_loaded',

    // Игрок кликнул по officer station.
    // View не определяет доступные команды,
    // а просит encounter controller открыть меню.
    OFFICER_STATION_CLICKED: 'officer_station_clicked',

    // Открытое officer menu просит encounter controller
    // заново получить доступные команды текущей роли.
    OFFICER_COMMAND_MENU_REFRESH_REQUESTED: 'officer_command_menu_refresh_requested',

    // Игрок выбрал команду в officer context menu.
    // Encounter controller передаст её в engine.
    OFFICER_COMMAND_SELECTED: 'officer_command_selected',

    // Игрок выбрал ручную отмену
    // текущей cancellable officer task.
    OFFICER_TASK_CANCEL_SELECTED: 'officer_task_cancel_selected',

    // Encounter controller отдаёт view
    // актуальный snapshot меню команд офицера.
    OFFICER_COMMAND_MENU_UPDATED: 'officer_command_menu_updated',

    // Controller просит показать
    // короткий officer bark bubble.
    OFFICER_BARK_REQUESTED: 'officer_bark_requested',

    // Controller отдаёт crew view
    // актуальные состояния station lights.
    OFFICER_STATION_INDICATORS_UPDATED: 'officer_station_indicators_updated',

    // Полный snapshot контекстных combat hints
    // на свободных officer station monitors.
    OFFICER_COMBAT_HINTS_UPDATED: 'officer_combat_hints_updated',

    // Офицер начал runtime task.
    // Crew view показывает activity label.
    OFFICER_ACTIVITY_STARTED: 'officer_activity_started',

    // Runtime task офицера завершён или очищен.
    // Crew view убирает activity label.
    OFFICER_ACTIVITY_CLEARED: 'officer_activity_cleared',

    // Полный snapshot отображаемого progress
    // officer tasks.
    //
    // Значение 0..1 означает заполнение бара.
    // null означает, что для роли бар не показывается.
    OFFICER_ACTIVITY_PROGRESS_UPDATED: 'officer_activity_progress_updated',

    // #endregion

    // #region Player ship status

    // View-ready captain dashboard snapshot
    // стабильной player-ship части.
    PLAYER_SHIP_DASHBOARD_UPDATED:
        'player_ship_dashboard_updated',

    // View-ready contextual combat snapshot
    // для правой части captain dashboard.
    CAPTAIN_COMBAT_CONTEXT_UPDATED:
        'captain_combat_context_updated',

    // #endregion

    // #region Encounter objects and navigation

    // Первый snapshot encounter objects.
    ENCOUNTER_OBJECTS_LOADED: 'encounter_objects_loaded',

    // Новый encounter object подготовлен во view,
    // но не становится текущей presentation-группой.
    ENCOUNTER_OBJECT_ADDED: 'encounter_object_added',

    // Encounter object permanently removed
    // from both runtime and presentation.
    ENCOUNTER_OBJECT_REMOVED:
        'encounter_object_removed',

    // Обновление presentation
    // уже известных encounter objects.
    ENCOUNTER_OBJECTS_UPDATED: 'encounter_objects_updated',

    // Начало arrival animation
    // на bridge viewscreen.
    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',

    // Arrival animation завершилась.
    // View сообщает об этом controller-у.
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',

    // Начало визуального перелёта
    // между encounter objects.
    ENCOUNTER_TRAVEL_STARTED: 'encounter_travel_started',

    // Началась поступательная фаза визуального перелёта.
    // При yaw-перелёте эмитится после завершения поворота.
    // При forward travel — сразу.
    ENCOUNTER_TRAVEL_FLIGHT_STARTED: 'encounter_travel_flight_started',

    // Визуальный перелёт завершился.
    // View сообщает об этом controller-у.
    ENCOUNTER_TRAVEL_COMPLETED: 'encounter_travel_completed',

    // Начался visual flow межнодового прыжка.
    ENCOUNTER_JUMP_STARTED: 'encounter_jump_started',

    // Visual flow межнодового прыжка завершён.
    // View возвращает controller-у исходный jump payload.
    ENCOUNTER_JUMP_COMPLETED: 'encounter_jump_completed',

    // #endregion

    // #region Docking

    // Encounter engine разрешил
    // начать визуальный docking flow.
    DOCKING_STARTED: 'docking_started',

    // Визуальная docking animation завершилась.
    // View сообщает об этом controller-у.
    DOCKING_ANIMATION_COMPLETED: 'docking_animation_completed',

    // #endregion

    // #region Scene lifecycle

    // Запрос перехода
    // в другую Phaser scene.
    SCENE_TRANSITION_REQUESTED: 'scene_transition_requested',

    // #endregion

    // #region Combat presentation

    // Opening disruption pulse отключил
    // main drive player ship.
    PLAYER_SHIP_DRIVE_DISRUPTED: 'player_ship_drive_disrupted',

    // Вражеская missile launcher
    // начала фазу подготовки/наведения.
    MISSILE_TARGETING_WARNING_STARTED: 'missile_targeting_warning_started',

    // Фаза подготовки/наведения завершилась
    // или была отменена.
    MISSILE_TARGETING_WARNING_CLEARED: 'missile_targeting_warning_cleared',

    // В encounter появилась новая
    // входящая вражеская ракета.
    INCOMING_MISSILE_ADDED: 'incoming_missile_added',

    // Входящая ракета удалена
    // после impact или другого завершения.
    INCOMING_MISSILE_REMOVED: 'incoming_missile_removed',

    STICKY_MINE_ADDED: 'sticky_mine_added',
    STICKY_MINES_UPDATED: 'sticky_mines_updated',
    STICKY_MINE_REMOVED: 'sticky_mine_removed',

    // Актуальный временной snapshot
    // всех входящих ракет.
    INCOMING_MISSILES_UPDATED: 'incoming_missiles_updated',

    // Player ship запустил ракету
    // в actor encounter-цель.
    OUTGOING_MISSILE_ADDED:
        'outgoing_missile_added',

    // Актуальный временной snapshot
    // всех ракет игрока в полёте.
    OUTGOING_MISSILES_UPDATED:
        'outgoing_missiles_updated',

    // Ракета игрока завершила lifecycle:
    // target lost, interception или hull hit.
    OUTGOING_MISSILE_REMOVED:
        'outgoing_missile_removed',

    OUTGOING_STICKY_MINE_ADDED:
        'outgoing_sticky_mine_added',

    OUTGOING_STICKY_MINES_UPDATED:
        'outgoing_sticky_mines_updated',

    OUTGOING_STICKY_MINE_REMOVED:
        'outgoing_sticky_mine_removed',

    OUTGOING_SPAM_CHANNEL_STARTED:
        'outgoing_spam_channel_started',

    OUTGOING_SPAM_CHANNEL_ENDED:
        'outgoing_spam_channel_ended',

    // Point-defense player ship завершил наведение
    // и разрешил выстрел по входящей угрозе.
    DEFENSE_TURRET_FIRED: 'defense_turret_fired',

    // Enemy defense-turret разрешил выстрел
    // по исходящей ракете игрока.
    ENEMY_DEFENSE_TURRET_FIRED:
        'enemy_defense_turret_fired',

    // Вражеский laser начал видимую charging-фазу.
    LASER_THREAT_ADDED: 'laser_threat_added',

    // Laser charging threat завершилась выстрелом.
    LASER_THREAT_REMOVED: 'laser_threat_removed',

    // Актуальный временной и identification snapshot
    // всех активных laser charging threats.
    LASER_THREATS_UPDATED: 'laser_threats_updated',

    // Вражеский laser разрешил выстрел,
    // который bridge view показывает коротким beam VFX.
    LASER_BEAM_FIRED: 'laser_beam_fired',

    PLAYER_SHIELD_DEPLOYED:
        'player_shield_deployed',

    PLAYER_SHIELD_UPDATED:
        'player_shield_updated',

    PLAYER_SHIELD_ENDED:
        'player_shield_ended',

    ENEMY_SHIELDS_UPDATED:
        'enemy_shields_updated',

    PLAYER_LASER_CHARGING_STARTED:
        'player_laser_charging_started',

    PLAYER_LASER_CHARGING_CLEARED:
        'player_laser_charging_cleared',

    PLAYER_LASER_FIRED:
        'player_laser_fired',

    ENEMY_SHIP_DESTRUCTION_STARTED:
        'enemy_ship_destruction_started',

    ENEMY_SHIP_DESTRUCTION_COMPLETED:
        'enemy_ship_destruction_completed',

    // Hostile spam channel начал
    // проецировать popup-помехи на viewscreen.
    SPAM_CHANNEL_STARTED: 'spam_channel_started',

    // Hostile spam channel завершился
    // естественно или был очищен игроком.
    SPAM_CHANNEL_ENDED: 'spam_channel_ended',

    // #endregion
} as const;

// #region Crew and officer commands

// Payload initial crew snapshot.
export type BridgeCrewLoadedPayload = Record<OfficerRole, OfficerDefinition>;

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

// Один пункт legacy officer context menu.
// Пока menu существует, он показывает только engine-команды.
export type BridgeOfficerCommandMenuItemPayload = {
    kind: 'command';

    commandId: EncounterOfficerCommandId;

    label: string;

    target: OfficerCommandTarget;
};

// Direct input от cancel affordance текущей station activity.
// Runtime task id полностью определяет отменяемую task.
export type BridgeOfficerTaskCancelSelectedPayload = {
    taskId: string;
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

// View-state лампы officer station.
export type BridgeOfficerStationIndicatorState = 'off' | 'ready' | 'busy' | 'blocked';

// Snapshot ламп всех officer stations.
export type BridgeOfficerStationIndicatorsUpdatedPayload = Record<OfficerRole, BridgeOfficerStationIndicatorState>;

// Максимум две уже приоритизированные строки на роль.
// Пустой массив явно очищает monitor hints.
export type BridgeOfficerCombatHintsUpdatedPayload = Record<OfficerRole, string[]>;

// Офицер начал activity/task.
// taskId связывает station presentation с конкретной runtime task.
// View может показать direct cancel affordance только для cancellable task.
export type BridgeOfficerActivityStartedPayload = {
    role: OfficerRole;

    taskId: string;
    label: string;

    canBeCancelledByPlayer: boolean;
};

// Activity/task офицера очищен.
export type BridgeOfficerActivityClearedPayload = {
    role: OfficerRole;
};

// Полный snapshot progress всех officer stations.
//
// null:
// - task отсутствует;
// - либо task не должна показывать progress.
export type BridgeOfficerActivityProgressUpdatedPayload = Record<OfficerRole, number | null>;

// #endregion

// #region Player ship status

export type BridgePlayerWeaponStatusPayload = {
    phase: ShipWeaponPhase;

    // Полная длительность текущей timed phase.
    // Отсутствует для READY.
    initialPhaseMs?: number;

    remainingPhaseMs?: number;
};

export type BridgePlayerWeaponsStatusUpdatedPayload = {
    laser?: BridgePlayerWeaponStatusPayload;

    missileLauncher?:
        BridgePlayerWeaponStatusPayload & {
            ammo: {
                current: number;
                max: number;
            };
        };

    stickyMineDispenser?:
        BridgePlayerWeaponStatusPayload & {
            ammo: {
                current: number;
                max: number;
            };
        };

    spamProjector?:
        BridgePlayerWeaponStatusPayload;
};

export const BRIDGE_PLAYER_SYSTEM_ACTION_STATE = {
    ACTIVE: 'active',
    DISABLED_SYSTEM: 'disabled_system',
    DISABLED_OFFICER_BUSY:
        'disabled_officer_busy',
    ENGAGED_CURRENT_WORK:
        'engaged_current_work',
} as const;

export type BridgePlayerSystemActionState =
    (typeof BRIDGE_PLAYER_SYSTEM_ACTION_STATE)[keyof typeof BRIDGE_PLAYER_SYSTEM_ACTION_STATE];

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
        };
    };

    missileLauncher?: {
        ammo: {
            current: number;
            max: number;
        };

        // 0..1 elapsed cooldown.
        // undefined означает, что cooldown bar не показывается.
        cooldownProgress?: number;

        action: {
            state:
                BridgePlayerSystemActionState;

            // Exact engine-resolved command.
            // Присутствует только у ACTIVE state.
            command?:
                BridgeOfficerCommandSelectedPayload;
        };
    };

    laser?: {
        // 0..1 elapsed cooldown.
        // Targeting/charging показываются через ENGAGED state,
        // без отдельного progress bar в dashboard.
        cooldownProgress?: number;

        action: {
            state:
                BridgePlayerSystemActionState;

            // Exact engine-resolved command.
            // Присутствует только у ACTIVE state.
            command?:
                BridgeOfficerCommandSelectedPayload;
        };
    };

    stickyMineDispenser?: {
        ammo: {
            current: number;
            max: number;
        };

        // 0..1 elapsed cooldown.
        // Targeting/dispensing are current Weapons work,
        // so their progress is intentionally not shown here.
        cooldownProgress?: number;

        action: {
            state:
                BridgePlayerSystemActionState;

            // Exact engine-resolved command.
            // Присутствует только у ACTIVE state.
            command?:
                BridgeOfficerCommandSelectedPayload;
        };
    };

    spamProjector?: {
        // 0..1 elapsed cooldown.
        // Targeting/channeling are current Science work,
        // so their progress is intentionally not shown here.
        cooldownProgress?: number;

        action: {
            state:
                BridgePlayerSystemActionState;

            // Exact engine-resolved command.
            // Присутствует только у ACTIVE state.
            command?:
                BridgeOfficerCommandSelectedPayload;
        };
    };
};

// #endregion

// #region Captain combat context

export type BridgeCaptainIncomingMissilePayload = {
    projectileId: string;
    designation: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;

    signature?:
        MissileSignature;

    actions: {
        identifyThreat?:
            BridgeOfficerCommandSelectedPayload;

        fireRedBeam?:
            BridgeOfficerCommandSelectedPayload;

        fireBlueBeam?:
            BridgeOfficerCommandSelectedPayload;
    };
};

export type BridgeCaptainIncomingLaserPayload = {
    attackId: string;
    designation: string;

    timeToFireMs: number;
    initialTimeToFireMs: number;

    actions: {
        deployShield?:
            BridgeOfficerCommandSelectedPayload;
    };
};

export type BridgeCaptainStickyMinePayload = {
    mineId: string;

    timeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;

    actions: {
        scienceClear?:
            BridgeOfficerCommandSelectedPayload;

        helmClear?:
            BridgeOfficerCommandSelectedPayload;

        weaponsClear?:
            BridgeOfficerCommandSelectedPayload;

        engineerClear?:
            BridgeOfficerCommandSelectedPayload;
    };
};

export type BridgeCaptainSpamChannelPayload = {
    channelId: string;

    remainingDurationMs: number;
    initialDurationMs: number;

    actions: {
        purgeSpam?:
            BridgeOfficerCommandSelectedPayload;
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

    incomingMissiles:
        BridgeCaptainIncomingMissilePayload[];

    incomingLasers:
        BridgeCaptainIncomingLaserPayload[];

    incomingStickyMines:
        BridgeCaptainStickyMinePayload[];

    activeSpamChannels:
        BridgeCaptainSpamChannelPayload[];
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

    signature?: MissileSignature;
};

// Актуальный snapshot всех входящих ракет.
export type BridgeIncomingMissilesUpdatedPayload = BridgeIncomingMissileUpdatePayload[];

export type BridgeOutgoingMissileAddedPayload = {
    projectileId: string;

    missileId: MissileId;

    targetActorId: string;

    initialTimeToImpactMs: number;
};

export type BridgeOutgoingMissileUpdatePayload = {
    projectileId: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;
};

export type BridgeOutgoingMissilesUpdatedPayload =
    BridgeOutgoingMissileUpdatePayload[];

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

export type BridgeOutgoingStickyMineUpdatePayload = {
    mineId: string;

    remainingTimeToDetonationMs: number;
    initialTimeToDetonationMs: number;
};

export type BridgeOutgoingStickyMinesUpdatedPayload =
    BridgeOutgoingStickyMineUpdatePayload[];

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

    outcome:
        PlayerSpamChannelOutcome;
};

export type BridgeDefenseTurretFiredPayload = {
    projectileId: string;

    signature: DefenseTurretSignature;
    outcome: DefenseTurretShotOutcome;
};

export type BridgeEnemyDefenseTurretFiredPayload = {
    sourceActorId: string;
    projectileId: string;

    signature: DefenseTurretSignature;
    outcome: DefenseTurretShotOutcome;
};

export type BridgeLaserThreatAddedPayload = {
    attackId: string;

    designation: string;

    sourceActorId: string;
};

export type BridgeLaserThreatRemovedPayload = {
    attackId: string;
};

export type BridgeLaserThreatUpdatePayload = {
    attackId: string;

    timeToFireMs: number;
    initialTimeToFireMs: number;
};

export type BridgeLaserThreatsUpdatedPayload = BridgeLaserThreatUpdatePayload[];

export type BridgeLaserBeamFiredPayload = {
    sourceActorId: string;

    outcome:
        LaserShotOutcome;
};

export type BridgePlayerShieldSnapshotPayload = {
    remainingDurationMs: number;
    initialDurationMs: number;
};

export type BridgePlayerShieldUpdatedPayload =
    BridgePlayerShieldSnapshotPayload |
    null;

export type BridgePlayerShieldEndedPayload = {
    outcome:
        PlayerShieldEndOutcome;
};

export type BridgeEnemyShieldPayload = {
    actorId: string;

    remainingDurationMs: number;
    initialDurationMs: number;
};

export type BridgeEnemyShieldsUpdatedPayload =
    BridgeEnemyShieldPayload[];

export type BridgePlayerLaserChargingStartedPayload = {
    weaponId: string;

    targetActorId: string;
};

export type BridgePlayerLaserChargingClearedPayload = {
    weaponId: string;
};

export type BridgePlayerLaserFiredPayload = {
    weaponId: string;

    targetActorId: string;

    outcome: LaserShotOutcome;
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
    CLEARED: 'cleared',
    DETONATED: 'detonated',
} as const;

export type BridgeStickyMineRemovalOutcome =
    (typeof BRIDGE_STICKY_MINE_REMOVAL_OUTCOME)[keyof typeof BRIDGE_STICKY_MINE_REMOVAL_OUTCOME];

export type BridgeStickyMineAddedPayload = {
    mineId: string;

    sourceActorId: string;

    initialTimeToDetonationMs: number;
};

export type BridgeStickyMineSnapshotPayload = {
    mineId: string;

    remainingTimeToDetonationMs: number;
    initialTimeToDetonationMs: number;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;
};

export type BridgeStickyMinesUpdatedPayload =
    BridgeStickyMineSnapshotPayload[];

export type BridgeStickyMineRemovedPayload = {
    mineId: string;

    outcome: BridgeStickyMineRemovalOutcome;
};

export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.STICKY_MINE_ADDED]: BridgeStickyMineAddedPayload;
    [BRIDGE_EVENT.STICKY_MINES_UPDATED]: BridgeStickyMinesUpdatedPayload;
    [BRIDGE_EVENT.STICKY_MINE_REMOVED]: BridgeStickyMineRemovedPayload;

    // Crew and officer commands

    [BRIDGE_EVENT.CREW_LOADED]: BridgeCrewLoadedPayload;

    [BRIDGE_EVENT.OFFICER_STATION_CLICKED]: BridgeOfficerStationClickedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_REFRESH_REQUESTED]: BridgeOfficerCommandMenuRefreshRequestedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_SELECTED]: BridgeOfficerCommandSelectedPayload;

    [BRIDGE_EVENT.OFFICER_TASK_CANCEL_SELECTED]: BridgeOfficerTaskCancelSelectedPayload;

    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED]: BridgeOfficerCommandMenuUpdatedPayload;

    [BRIDGE_EVENT.OFFICER_BARK_REQUESTED]: BridgeOfficerBarkRequestedPayload;

    [BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED]: BridgeOfficerStationIndicatorsUpdatedPayload;

    [BRIDGE_EVENT.OFFICER_COMBAT_HINTS_UPDATED]: BridgeOfficerCombatHintsUpdatedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED]: BridgeOfficerActivityStartedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED]: BridgeOfficerActivityClearedPayload;

    [BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED]: BridgeOfficerActivityProgressUpdatedPayload;

    // Player ship status

    [BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED]:
        BridgePlayerShipDashboardUpdatedPayload;

    [BRIDGE_EVENT.CAPTAIN_COMBAT_CONTEXT_UPDATED]:
        BridgeCaptainCombatContextUpdatedPayload;

    // Encounter objects and navigation

    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED]: BridgeEncounterObjectPayload[];

    [BRIDGE_EVENT.ENCOUNTER_OBJECT_ADDED]: BridgeEncounterObjectPayload;

    [BRIDGE_EVENT.ENCOUNTER_OBJECT_REMOVED]:
        BridgeEncounterObjectRemovedPayload;

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

    [BRIDGE_EVENT.MISSILE_TARGETING_WARNING_STARTED]: undefined;

    [BRIDGE_EVENT.MISSILE_TARGETING_WARNING_CLEARED]: undefined;

    [BRIDGE_EVENT.INCOMING_MISSILE_ADDED]: BridgeIncomingMissileAddedPayload;

    [BRIDGE_EVENT.INCOMING_MISSILE_REMOVED]: BridgeIncomingMissileRemovedPayload;

    [BRIDGE_EVENT.INCOMING_MISSILES_UPDATED]: BridgeIncomingMissilesUpdatedPayload;

    [BRIDGE_EVENT.OUTGOING_MISSILE_ADDED]:
        BridgeOutgoingMissileAddedPayload;

    [BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED]:
        BridgeOutgoingMissilesUpdatedPayload;

    [BRIDGE_EVENT.OUTGOING_MISSILE_REMOVED]:
        BridgeOutgoingMissileRemovedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINE_ADDED]:
        BridgeOutgoingStickyMineAddedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED]:
        BridgeOutgoingStickyMinesUpdatedPayload;

    [BRIDGE_EVENT.OUTGOING_STICKY_MINE_REMOVED]:
        BridgeOutgoingStickyMineRemovedPayload;

    [BRIDGE_EVENT.OUTGOING_SPAM_CHANNEL_STARTED]:
        BridgeOutgoingSpamChannelStartedPayload;

    [BRIDGE_EVENT.OUTGOING_SPAM_CHANNEL_ENDED]:
        BridgeOutgoingSpamChannelEndedPayload;

    [BRIDGE_EVENT.DEFENSE_TURRET_FIRED]: BridgeDefenseTurretFiredPayload;

    [BRIDGE_EVENT.ENEMY_DEFENSE_TURRET_FIRED]:
        BridgeEnemyDefenseTurretFiredPayload;

    [BRIDGE_EVENT.LASER_THREAT_ADDED]: BridgeLaserThreatAddedPayload;

    [BRIDGE_EVENT.LASER_THREAT_REMOVED]: BridgeLaserThreatRemovedPayload;

    [BRIDGE_EVENT.LASER_THREATS_UPDATED]: BridgeLaserThreatsUpdatedPayload;

    [BRIDGE_EVENT.LASER_BEAM_FIRED]: BridgeLaserBeamFiredPayload;

    [BRIDGE_EVENT.PLAYER_SHIELD_DEPLOYED]:
        BridgePlayerShieldSnapshotPayload;

    [BRIDGE_EVENT.PLAYER_SHIELD_UPDATED]:
        BridgePlayerShieldUpdatedPayload;

    [BRIDGE_EVENT.PLAYER_SHIELD_ENDED]:
        BridgePlayerShieldEndedPayload;

    [BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED]:
        BridgeEnemyShieldsUpdatedPayload;

    [BRIDGE_EVENT.PLAYER_LASER_CHARGING_STARTED]:
        BridgePlayerLaserChargingStartedPayload;

    [BRIDGE_EVENT.PLAYER_LASER_CHARGING_CLEARED]:
        BridgePlayerLaserChargingClearedPayload;

    [BRIDGE_EVENT.PLAYER_LASER_FIRED]:
        BridgePlayerLaserFiredPayload;

    [BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED]:
        BridgeEnemyShipDestructionPayload;

    [BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_COMPLETED]:
        BridgeEnemyShipDestructionPayload;

    [BRIDGE_EVENT.SPAM_CHANNEL_STARTED]: BridgeSpamChannelStartedPayload;

    [BRIDGE_EVENT.SPAM_CHANNEL_ENDED]: BridgeSpamChannelEndedPayload;
};
