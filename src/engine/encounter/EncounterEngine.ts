// src/engine/encounter/EncounterEngine.ts

import type { OfficerRole } from '../defs/officer';
import type { PlayerSpaceNavigationState } from '../defs/player_location';
import type { PointDefenseState } from '../defs/point_defense';
import type { ShieldGeneratorState } from '../defs/shield_generator';
import type { SpaceNodeState } from '../defs/universe';
import CombatRunner from './combat/CombatRunner';
import ShieldGeneratorRunner from './combat/ShieldGeneratorRunner';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/queries/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput, ExecuteOfficerCommandResult } from './model/command';
import type { CombatProjectileState, LaserAttackState } from './model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import { OFFICER_TASK_KIND, type OfficerTaskKind, type OfficerTaskState } from './model/officer_task';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import EncounterStateStore from './state/EncounterStateStore';

export type EncounterEngineOptions = {
    node: SpaceNodeState;
    navigation: PlayerSpaceNavigationState;

    pointDefense: PointDefenseState;

    // undefined означает, что у player ship
    // физически нет shield generator.
    shieldGenerator?: ShieldGeneratorState;

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

    private readonly shieldGeneratorRunner: ShieldGeneratorRunner;

    constructor({
        node,
        navigation,
        pointDefense,
        shieldGenerator,

        completeTimedTasksImmediately = false,

        random = Math.random,
    }: EncounterEngineOptions) {
        this.stateStore = EncounterStateStore.fromSpaceNode(node, navigation, pointDefense, shieldGenerator);

        const encounterState = this.stateStore.getState();

        this.shieldGeneratorRunner = new ShieldGeneratorRunner({
            state: encounterState,
            emit: this.emit,
        });

        this.combatRunner = new CombatRunner({
            state: encounterState,
            emit: this.emit,

            random,
        });

        this.officerTaskRunner = new OfficerTaskRunner({
            stateStore: this.stateStore,
            emit: this.emit,

            completeTimedTasksImmediately,
        });

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

    public step(deltaMs: number): void {
        this.officerTaskRunner.step(deltaMs);
        this.contactSequenceRunner.step(deltaMs);
        this.shieldGeneratorRunner.step(deltaMs);
        this.combatRunner.step(deltaMs);
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
        this.officerTaskRunner.cancel(taskId);
    }

    public getAvailableCommands(role: OfficerRole): AvailableOfficerCommand[] {
        return getAvailableOfficerCommands(this.stateStore.getState(), role);
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return this.stateStore.getNavigationState();
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

    public getCombatProjectiles(): CombatProjectileState[] {
        return this.stateStore.getState().combat.projectiles.map((projectile) => {
            return {
                ...projectile,
            };
        });
    }

    public getLaserAttacks(): LaserAttackState[] {
        return this.stateStore.getState().combat.laserAttacks.map((attack) => {
            return {
                ...attack,

                target: {
                    ...attack.target,
                },

                identification: {
                    ...attack.identification,
                },
            };
        });
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

    // #region Event outbox

    private emit = (event: EncounterEvent): void => {
        this.events.push(event);
    };

    // #endregion
}
