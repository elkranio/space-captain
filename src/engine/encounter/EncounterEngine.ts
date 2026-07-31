// src/engine/encounter/EncounterEngine.ts

import { SHIP_WEAPONS } from '../content/catalogs/ship_weapons';
import type { OfficerRole } from '../defs/officer';
import type { PlayerSpaceNavigationState } from '../defs/player_location';
import type { PointDefenseState } from '../defs/point_defense';
import type { ShieldGeneratorState } from '../defs/shield_generator';
import type { ShipDriveState } from '../defs/ship_drive';
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../defs/ship_weapon';
import type { SpaceNodeState } from '../defs/universe';
import CombatRunner from './combat/CombatRunner';
import PlayerShieldRunner from './combat/PlayerShieldRunner';
import ShieldGeneratorRunner from './combat/ShieldGeneratorRunner';
import OfficerCommandExecutor from './commands/OfficerCommandExecutor';
import { getAvailableOfficerCommands } from './commands/queries/get_available_officer_commands';
import ContactSequenceRunner from './contact/ContactSequenceRunner';
import type { AvailableOfficerCommand, ExecuteOfficerCommandInput, ExecuteOfficerCommandResult } from './model/command';
import type {
    ActiveShieldState,
    CombatProjectileState,
    LaserAttackState,
    SpamChannelState,
} from './model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { OfficerAvailabilityStates } from './model/officer_availability';
import { OFFICER_TASK_KIND, type OfficerTaskKind, type OfficerTaskState } from './model/officer_task';
import { getOfficerAvailabilityStates } from './officer_availability/queries/get_officer_availability_states';
import OfficerTaskRunner from './officer_tasks/OfficerTaskRunner';
import EncounterStateStore from './state/EncounterStateStore';

export type LaserThreatSnapshot = {
    attack: LaserAttackState;

    timeToFireMs: number;
    initialTimeToFireMs: number;
};

export type EncounterEngineOptions = {
    node: SpaceNodeState;
    navigation: PlayerSpaceNavigationState;

    drive: ShipDriveState;

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

    private readonly playerShieldRunner: PlayerShieldRunner;

    private readonly shieldGeneratorRunner: ShieldGeneratorRunner;

    constructor({
        node,
        navigation,
        drive,
        pointDefense,
        shieldGenerator,

        completeTimedTasksImmediately = false,

        random = Math.random,
    }: EncounterEngineOptions) {
        this.stateStore =
            EncounterStateStore.fromSpaceNode(
                node,
                navigation,
                drive,
                pointDefense,
                shieldGenerator,
            );

        const encounterState = this.stateStore.getState();

        this.playerShieldRunner = new PlayerShieldRunner({
            state: encounterState,
        });

        this.shieldGeneratorRunner = new ShieldGeneratorRunner({
            state: encounterState,
            emit: this.emit,
        });

        this.combatRunner = new CombatRunner({
            state: encounterState,
            emit: this.emit,

            random,

            interruptRandomOfficerTask: () => {
                this.interruptRandomOfficerTask(random);
            },
        });

        this.officerTaskRunner = new OfficerTaskRunner({
            stateStore: this.stateStore,
            emit: this.emit,

            purgeSpamChannel: (channelId) => {
                return this.combatRunner.purgeSpamChannel(channelId);
            },

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
        this.playerShieldRunner.step(deltaMs);
        this.officerTaskRunner.step(deltaMs);
        this.contactSequenceRunner.step(deltaMs);
        this.shieldGeneratorRunner.step(deltaMs);
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
        const state = this.stateStore.getState();

        return state.combat.laserAttacks.map((attack) => {
            const actor = state.actors.find((candidate) => {
                return candidate.id === attack.sourceActorId;
            });

            if (!actor) {
                throw new Error(
                    `Laser threat source actor not found: ` +
                        `${attack.id}/${attack.sourceActorId}`,
                );
            }

            const weapon = actor.weapons.find((candidate) => {
                return candidate.id === attack.sourceWeaponId;
            });

            if (!weapon) {
                throw new Error(
                    `Laser threat source weapon not found: ` +
                        `${attack.id}/${attack.sourceWeaponId}`,
                );
            }

            if (
                weapon.kind !== SHIP_WEAPON_KIND.LASER ||
                weapon.phase !== SHIP_WEAPON_PHASE.CHARGING
            ) {
                throw new Error(
                    `Laser threat source weapon is not charging: ` +
                        `${attack.id}/${weapon.id}/${weapon.kind}/${weapon.phase}`,
                );
            }

            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
                throw new Error(
                    `Laser threat weapon definition mismatch: ` +
                        `${attack.id}/${weapon.id}/${weapon.weaponId}`,
                );
            }

            return {
                attack: this.cloneLaserAttack(attack),

                timeToFireMs: Math.max(
                    0,
                    definition.chargeDurationMs - weapon.phaseElapsedMs,
                ),

                initialTimeToFireMs: definition.chargeDurationMs,
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

    // #region Combat consequences

    private interruptRandomOfficerTask(random: () => number): void {
        const interruptibleTasks = this.stateStore
            .getOfficerTasks()
            .filter((task) => {
                return task.canBeInterruptedByDamage;
            });

        if (interruptibleTasks.length === 0) {
            return;
        }

        if (interruptibleTasks.length === 1) {
            const [task] = interruptibleTasks;

            if (!task) {
                throw new Error('Cannot interrupt missing officer task');
            }

            this.officerTaskRunner.cancel(task.id);
            return;
        }

        const randomValue = random();

        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
            throw new Error(
                `Encounter random source must return a value in [0, 1): ${randomValue}`,
            );
        }

        const taskIndex = Math.floor(randomValue * interruptibleTasks.length);
        const task = interruptibleTasks[taskIndex];

        if (!task) {
            throw new Error(
                `Cannot select random officer task: ` +
                    `${taskIndex}/${interruptibleTasks.length}`,
            );
        }

        this.officerTaskRunner.cancel(task.id);
    }

    // #endregion

    // #region Combat snapshots

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

    // #region Event outbox

    private emit = (event: EncounterEvent): void => {
        this.events.push(event);
    };

    // #endregion
}
