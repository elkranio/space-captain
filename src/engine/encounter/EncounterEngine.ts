// src/engine/encounter/EncounterEngine.ts

import {
    ENCOUNTER_TEAM,
    type EncounterTeam,
} from '../defs/encounter_team';
import type { OfficerRole } from '../defs/officer';
import type {
    PlayerHullState,
} from '../defs/player';
import type { PlayerSpaceNavigationState } from '../defs/player_location';
import type { PointDefenseState } from '../defs/point_defense';
import type { ShieldGeneratorState } from '../defs/shield_generator';
import type { ShipDriveState } from '../defs/ship_drive';
import type {
    ShipWeaponState,
} from '../defs/ship_weapon';
import type { SpaceNodeState } from '../defs/universe';
import CombatEngagementRunner from './combat/CombatEngagementRunner';
import CombatRunner from './combat/CombatRunner';
import {
    getEnemyShipTelemetrySnapshots,
    type EnemyShipTelemetrySnapshot,
} from './combat/queries/get_enemy_ship_telemetry_snapshots';
import {
    getLaserThreatSnapshots,
    type LaserThreatSnapshot,
} from './combat/queries/get_laser_threat_snapshots';
import {
    getStickyMineSnapshots,
    type StickyMineSnapshot,
} from './combat/queries/get_sticky_mine_snapshots';
import PlayerShieldRunner from './combat/PlayerShieldRunner';
import PlayerWeaponRunner from './combat/PlayerWeaponRunner';
import ShieldGeneratorRunner from './combat/ShieldGeneratorRunner';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/queries/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput, ExecuteOfficerCommandResult } from './model/command';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type ActiveShieldState,
    type CombatProjectileState,
    type LaserAttackState,
    type SpamChannelState,
    type StickyMineState,
} from './model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import { OFFICER_TASK_KIND, type OfficerTaskKind, type OfficerTaskState } from './model/officer_task';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import EncounterStateStore from './state/EncounterStateStore';

export type {
    EnemyShipTelemetrySnapshot,
} from './combat/queries/get_enemy_ship_telemetry_snapshots';
export type { LaserThreatSnapshot } from './combat/queries/get_laser_threat_snapshots';
export type { StickyMineSnapshot } from './combat/queries/get_sticky_mine_snapshots';

export type EncounterEngineOptions = {
    node: SpaceNodeState;
    navigation: PlayerSpaceNavigationState;

    playerHull: PlayerHullState;
    drive: ShipDriveState;

    pointDefense: PointDefenseState;

    // undefined означает, что у player ship
    // физически нет shield generator.
    shieldGenerator?: ShieldGeneratorState;

    // Installed player weapons.
    // Empty loadout remains valid.
    weapons?: ShipWeaponState[];

    completeTimedTasksImmediately?: boolean;

    // Test seam и будущая точка подключения seeded RNG.
    random?: () => number;
};

export default class EncounterEngine {
    private readonly stateStore: EncounterStateStore;

    private readonly events: EncounterEvent[] = [];

    private readonly officerTaskRunner: OfficerTaskRunner;

    private readonly contactSequenceRunner: ContactSequenceRunner;

    private readonly officerCommandExecutor: OfficerCommandExecutor;

    private readonly combatRunner: CombatRunner;

    private readonly playerWeaponRunner:
        PlayerWeaponRunner;

    private readonly combatEngagementRunner:
        CombatEngagementRunner;

    private readonly playerShieldRunner: PlayerShieldRunner;

    private readonly shieldGeneratorRunner: ShieldGeneratorRunner;

    constructor({
        node,
        navigation,
        playerHull,
        drive,
        pointDefense,
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

                pointDefense,
                shieldGenerator,

                playerWeapons:
                    weapons,
            });

        const encounterState = this.stateStore.getState();

        this.playerShieldRunner = new PlayerShieldRunner({
            state: encounterState,
        });

        this.shieldGeneratorRunner = new ShieldGeneratorRunner({
            state: encounterState,
            emit: this.emit,
        });

        this.combatRunner = new CombatRunner({
            stateStore:
                this.stateStore,

            emit: this.emit,

            random,

            interruptRandomOfficerTask: () => {
                this.officerTaskRunner.interruptRandomTaskByDamage();
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

        this.contactSequenceRunner = new ContactSequenceRunner({
            emit: this.emit,
        });

        this.officerCommandExecutor = new OfficerCommandExecutor({
            stateStore: this.stateStore,
            emit: this.emit,

            startOfficerTask: this.officerTaskRunner.start,

            // Generic completion остаётся внутренней связью
            // command handler → task runner для HAIL.
            completeOfficerTask: this.officerTaskRunner.complete,

            startContactSequence: this.contactSequenceRunner.start,
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
        this.playerShieldRunner.step(deltaMs);
        this.officerTaskRunner.step(deltaMs);
        this.contactSequenceRunner.step(deltaMs);
        this.shieldGeneratorRunner.step(deltaMs);
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

    public getAvailableCommands(role: OfficerRole): AvailableOfficerCommand[] {
        return getAvailableOfficerCommands(this.stateStore.getState(), role);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.stateStore.getNavigationState();
    }

    public getDriveState(): ShipDriveState {
        return {
            ...this.stateStore.getState().drive,
        };
    }

    public getPlayerHullState():
        PlayerHullState {
        return {
            ...this.stateStore
                .getState()
                .playerHull,
        };
    }

    public getOfficerAvailabilityStates(): OfficerAvailabilityStates {
        return getOfficerAvailabilityStates(this.stateStore.getState());
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return this.stateStore.getOfficerTasks().map((task) => {
            return {
                ...task,
            };
        });
    }

    public getPlayerWeaponStates():
        ShipWeaponState[] {
        return this.stateStore
            .getState()
            .combat
            .playerWeapons
            .map((weapon) => {
                return {
                    ...weapon,
                };
            });
    }

    public getEnemyShipTelemetrySnapshots():
        EnemyShipTelemetrySnapshot[] {
        return getEnemyShipTelemetrySnapshots(
            this.stateStore.getState(),
        );
    }

    public getCombatProjectiles():
        CombatProjectileState[] {
        return this.stateStore
            .getState()
            .combat
            .projectiles
            .map((projectile) => {
                return this
                    .cloneCombatProjectile(
                        projectile,
                    );
            });
    }

    public getIncomingMissileProjectiles():
        CombatProjectileState[] {
        return this.stateStore
            .getState()
            .combat
            .projectiles
            .filter((projectile) => {
                return (
                    projectile.source.kind ===
                        COMBAT_SOURCE_KIND.ACTOR &&
                    projectile.target.kind ===
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP
                );
            })
            .map((projectile) => {
                return this
                    .cloneCombatProjectile(
                        projectile,
                    );
            });
    }

    public getOutgoingMissileProjectiles():
        CombatProjectileState[] {
        return this.stateStore
            .getState()
            .combat
            .projectiles
            .filter((projectile) => {
                return (
                    projectile.source.kind ===
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP &&
                    projectile.target.kind ===
                        COMBAT_TARGET_KIND.ACTOR
                );
            })
            .map((projectile) => {
                return this
                    .cloneCombatProjectile(
                        projectile,
                    );
            });
    }

    public getOutgoingStickyMines():
        StickyMineState[] {
        return this.stateStore
            .getState()
            .combat
            .stickyMines
            .filter((mine) => {
                return (
                    mine.source.kind ===
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP &&
                    mine.target.kind ===
                        COMBAT_TARGET_KIND.ACTOR
                );
            })
            .map((mine) => {
                return {
                    ...mine,

                    source: {
                        ...mine.source,
                    },

                    target: {
                        ...mine.target,
                    },
                };
            });
    }

    public getStickyMineSnapshots(): StickyMineSnapshot[] {
        return getStickyMineSnapshots(
            this.stateStore.getState(),
        );
    }

    public getLaserAttacks(): LaserAttackState[] {
        return this.stateStore.getState().combat.laserAttacks.map((attack) => {
            return this.cloneLaserAttack(attack);
        });
    }

    public getSpamChannels(): SpamChannelState[] {
        return this.combatRunner.getSpamChannels();
    }

    public purgeSpamChannel(channelId: string): boolean {
        return this.combatRunner.purgeSpamChannel(channelId);
    }

    public getLaserThreatSnapshots(): LaserThreatSnapshot[] {
        return getLaserThreatSnapshots(
            this.stateStore.getState(),
        );
    }

    public getShieldGeneratorState(): ShieldGeneratorState | undefined {
        const shieldGenerator = this.stateStore.getState().combat.shieldGenerator;

        if (!shieldGenerator) {
            return undefined;
        }

        return {
            ...shieldGenerator,
        };
    }

    public getActiveShieldState(): ActiveShieldState | undefined {
        const activeShield = this.stateStore.getState().combat.activeShield;

        if (!activeShield) {
            return undefined;
        }

        return {
            ...activeShield,
        };
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

    // #region Combat snapshots

    private cloneCombatProjectile(
        projectile:
            CombatProjectileState,
    ): CombatProjectileState {
        return {
            ...projectile,

            source: {
                ...projectile.source,
            },

            target: {
                ...projectile.target,
            },

            identification: {
                ...projectile.identification,
            },
        };
    }

    private cloneLaserAttack(attack: LaserAttackState): LaserAttackState {
        return {
            ...attack,

            target: {
                ...attack.target,
            },

            identification: {
                ...attack.identification,
            },
        };
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
        this.events.push(event);
    };

    // #endregion
}
