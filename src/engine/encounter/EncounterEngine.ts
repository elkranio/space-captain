// src/engine/encounter/EncounterEngine.ts

import type {
    PowerCoreState,
} from '../defs/power_core';
import type {
    ShipDefenseTurretState,
} from '../defs/defense_turret';
import {
    ENCOUNTER_TEAM,
    type EncounterTeam,
} from '../defs/encounter_team';
import type { OfficerRole } from '../defs/officer';
import type {
    PlayerHullState,
} from '../defs/player';
import type { PlayerSpaceNavigationState } from '../defs/player_location';
import type { ShipDriveState } from '../defs/ship_drive';
import type {
    ShipWeaponState,
} from '../defs/ship_weapon';
import type {
    ShieldGeneratorState,
} from '../defs/shield_generator';
import type { SpaceNodeState } from '../defs/universe';
import CombatEngagementRunner from './combat/CombatEngagementRunner';
import type {
    EnemyDebugSnapshot,
} from './debug/get_enemy_debug_snapshots';
import CombatRunner from './combat/CombatRunner';
import PowerCoreRunner from './combat/defense/PowerCoreRunner';
import ShieldGeneratorRunner from './combat/defense/ShieldGeneratorRunner';
import type { EnemyShipTelemetrySnapshot } from './combat/queries/get_enemy_ship_telemetry_snapshots';
import PlayerWeaponRunner from './combat/weapons/PlayerWeaponRunner';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput, ExecuteOfficerCommandResult } from './model/command';
import {
    type ActiveShieldState,
    type CombatProjectileState,
    type LaserAttackState,
} from './model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import { OFFICER_TASK_KIND, type OfficerTaskKind, type OfficerTaskState } from './model/officer_task';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import EncounterSnapshotReader from './snapshots/EncounterSnapshotReader';
import type {
    CombatPresentationSnapshot,
} from './snapshots/combat_presentation_snapshot';
import { createDetachedSnapshot } from './snapshots/create_detached_snapshot';
import EncounterStateStore from './state/EncounterStateStore';

export type {
    EnemyShipTelemetrySnapshot,
} from './combat/queries/get_enemy_ship_telemetry_snapshots';
export type {
    EnemyDebugSnapshot,
} from './debug/get_enemy_debug_snapshots';
export type { LaserThreatSnapshot } from './combat/queries/get_laser_threat_snapshots';
export type { StickyMineSnapshot } from './combat/queries/get_sticky_mine_snapshots';
export type {
    CombatPresentationSnapshot,
    PowerCorePresentationSnapshot,
    EnemyShipPresentationSnapshot,
    PlayerWeaponPresentationSnapshot,
} from './snapshots/combat_presentation_snapshot';

export type EncounterEngineOptions = {
    node: SpaceNodeState;
    navigation: PlayerSpaceNavigationState;

    playerHull: PlayerHullState;
    drive: ShipDriveState;

    defenseTurret?:
        ShipDefenseTurretState;

    powerCore?:
        PowerCoreState;

    shieldGenerator?:
        ShieldGeneratorState;

    // Installed player weapons.
    // Empty loadout remains valid.
    weapons?: ShipWeaponState[];

    completeTimedTasksImmediately?: boolean;

    // Test seam и будущая точка подключения seeded RNG.
    random?: () => number;
};

export default class EncounterEngine {
    private readonly stateStore: EncounterStateStore;

    private readonly snapshotReader: EncounterSnapshotReader;

    private readonly events: EncounterEvent[] = [];

    private readonly officerTaskRunner: OfficerTaskRunner;

    private readonly officerCommandExecutor: OfficerCommandExecutor;

    private readonly combatRunner: CombatRunner;

    private readonly powerCoreRunner:
        PowerCoreRunner;

    private readonly shieldGeneratorRunner:
        ShieldGeneratorRunner;

    private readonly playerWeaponRunner:
        PlayerWeaponRunner;

    private readonly combatEngagementRunner:
        CombatEngagementRunner;


    constructor({
        node,
        navigation,
        playerHull,
        drive,
        defenseTurret,
        powerCore,
        shieldGenerator,
        weapons = [],

        completeTimedTasksImmediately = false,

        random = Math.random,
    }: EncounterEngineOptions) {
        this.stateStore =
            EncounterStateStore.fromSpaceNode({
                node,
                navigation,

                playerHull,
                drive,

                defenseTurret,
                powerCore,
                shieldGenerator,

                playerWeapons:
                    weapons,
            });

        const encounterState = this.stateStore.getState();

        this.snapshotReader = new EncounterSnapshotReader(
            encounterState,
        );

        this.powerCoreRunner =
            new PowerCoreRunner(
                encounterState,
            );


        this.shieldGeneratorRunner =
            new ShieldGeneratorRunner(
                encounterState,
                this.emit,
            );

        this.combatRunner = new CombatRunner({
            stateStore:
                this.stateStore,

            emit: this.emit,

            random,

            interruptRandomOfficerTask: () => {
                this.officerTaskRunner.interruptRandomTaskByDamage();
            },

            purgePlayerSpamChannel:
                (
                    channelId,
                    targetActorId,
                ) => {
                    return this
                        .playerWeaponRunner
                        .purgeSpamChannel(
                            channelId,
                            targetActorId,
                        );
                },

            destroyEnemyActor:
                this.destroyEnemyActor,
        });

        this.officerTaskRunner = new OfficerTaskRunner({
            stateStore: this.stateStore,
            emit: this.emit,

            purgeSpamChannel: (channelId) => {
                return this.combatRunner.purgeSpamChannel(channelId);
            },

            clearStickyMine: (mineId) => {
                return this.combatRunner.clearStickyMine(mineId);
            },

            random,
            completeTimedTasksImmediately,
        });

        this.playerWeaponRunner =
            new PlayerWeaponRunner({
                stateStore:
                    this.stateStore,

                queuePlayerStickyMineAttach:
                    (input) => {
                        this.combatRunner
                            .queuePlayerStickyMineAttach(
                                input,
                            );
                    },

                queuePlayerMissileLaunch:
                    (input) => {
                        this.combatRunner
                            .queuePlayerMissileLaunch(
                                input,
                            );
                    },

                destroyEnemyActor:
                    this.destroyEnemyActor,

                emit: this.emit,

                completeOfficerTask:
                    this.officerTaskRunner
                        .complete,
            });

        this.combatEngagementRunner =
            new CombatEngagementRunner(
                this.stateStore,
                this.officerTaskRunner,
                this.emit,
            );

        this.officerCommandExecutor = new OfficerCommandExecutor({
            stateStore: this.stateStore,
            emit: this.emit,

            startOfficerTask: this.officerTaskRunner.start,
        });

        this.emit({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,

            state: encounterState,
        });
    }

    // #region Public API

    public executeCommand(input: ExecuteOfficerCommandInput): ExecuteOfficerCommandResult {
        return this.officerCommandExecutor.execute(input);
    }

    public engageHostileActors(): void {
        this.combatEngagementRunner
            .engageCurrentHostileActors();
    }

    public setActorTeam(
        actorId: string,
        team: EncounterTeam,
    ): void {
        this.combatEngagementRunner.setActorTeam(
            actorId,
            team,
        );
    }

    public step(deltaMs: number): void {
        this.powerCoreRunner
            .step(deltaMs);

        this.shieldGeneratorRunner
            .step(deltaMs);

        this.officerTaskRunner.step(deltaMs);
        this.playerWeaponRunner.step(deltaMs);
        this.combatRunner.step(deltaMs);

        this.officerTaskRunner.cancelTasksWithMissingTargets();
    }

    public completeArrival(): void {
        this.stateStore.completeArrival();
    }

    public completeTravel(taskId: string): void {
        this.completeExpectedTask(taskId, OFFICER_TASK_KIND.HELM_FLY_TO);
    }

    public completeDocking(taskId: string): void {
        this.completeExpectedTask(taskId, OFFICER_TASK_KIND.HELM_DOCK);
    }

    public completeJump(taskId: string): void {
        this.completeExpectedTask(taskId, OFFICER_TASK_KIND.HELM_JUMP);
    }

    public cancelTask(taskId: string): void {
        const task = this.stateStore.findOfficerTaskById(taskId);

        if (!task) {
            return;
        }

        if (!task.canBeCancelledByPlayer) {
            throw new Error(
                `Officer task cannot be cancelled by player: ` +
                    `${task.id}/${task.kind}`,
            );
        }

        this.officerTaskRunner.cancel(task.id);
    }

    public getCombatPresentationSnapshot():
        CombatPresentationSnapshot {
        return this.snapshotReader
            .getCombatPresentationSnapshot();
    }

    public getAvailableCommands(role: OfficerRole): AvailableOfficerCommand[] {
        return this.snapshotReader.getAvailableCommands(role);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.snapshotReader.getNavigationState();
    }

    public getDriveState(): ShipDriveState {
        return this.snapshotReader.getDriveState();
    }

    public getPlayerHullState():
        PlayerHullState {
        return this.snapshotReader.getPlayerHullState();
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return this.snapshotReader.getOfficerAvailabilityStates();
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return this.snapshotReader.getOfficerTasks();
    }

    public getPlayerWeaponStates():
        ShipWeaponState[] {
        return this.snapshotReader.getPlayerWeaponStates();
    }

    public getPowerCoreState():
        PowerCoreState | undefined {
        return this.snapshotReader
            .getPowerCoreState();
    }

    public getShieldGeneratorState():
        ShieldGeneratorState | undefined {
        return this.snapshotReader
            .getShieldGeneratorState();
    }

    public getActiveShieldState():
        ActiveShieldState | null {
        return this.snapshotReader
            .getActiveShieldState();
    }

    public getEnemyShipTelemetrySnapshots():
        EnemyShipTelemetrySnapshot[] {
        return this.snapshotReader.getEnemyShipTelemetrySnapshots();
    }


    public getEnemyDebugSnapshots():
        EnemyDebugSnapshot[] {
        return this.snapshotReader
            .getEnemyDebugSnapshots();
    }

    public getCombatProjectiles():
        CombatProjectileState[] {
        return this.snapshotReader.getCombatProjectiles();
    }

    public getLaserAttacks(): LaserAttackState[] {
        return this.snapshotReader.getLaserAttacks();
    }

    public purgeSpamChannel(channelId: string): boolean {
        return this.combatRunner.purgeSpamChannel(channelId);
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.events];

        this.events.length = 0;

        return events;
    }

    // #endregion

    // #region Officer task completion

    private completeExpectedTask(taskId: string, expectedKind: OfficerTaskKind): void {
        const task = this.stateStore.findOfficerTaskById(taskId);

        if (!task) {
            throw new Error(`Officer task not found: ${taskId}`);
        }

        if (task.kind !== expectedKind) {
            throw new Error(
                `Cannot complete officer task ${taskId}: ` + `expected ${expectedKind}, ` + `received ${task.kind}`,
            );
        }

        this.officerTaskRunner.complete(taskId);
    }

    // #endregion

    // #region Enemy destruction

    private destroyEnemyActor = (
        actorId: string,
    ): void => {
        const actor =
            this.stateStore.findActorById(
                actorId,
            );

        // Multiple impacts in one step must not
        // produce duplicate destruction events.
        if (!actor) {
            return;
        }

        if (
            actor.team !==
                ENCOUNTER_TEAM.ENEMY ||
            actor.hull > 0
        ) {
            throw new Error(
                'Cannot destroy a live or ' +
                    'non-enemy actor: ' +
                    `${actor.id}/` +
                    `${actor.team}/` +
                    `${actor.hull}`,
            );
        }

        this.combatRunner
            .removePlayerCombatObjectsTargetingActor(
                actor.id,
            );

        this.stateStore.removeActor(
            actor.id,
        );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_SHIP_DESTROYED,

            actorId:
                actor.id,
        });
    };

    // #endregion

    // #region Event outbox

    private emit = (event: EncounterEvent): void => {
        this.events.push(
            createDetachedSnapshot(event),
        );
    };

    // #endregion
}
