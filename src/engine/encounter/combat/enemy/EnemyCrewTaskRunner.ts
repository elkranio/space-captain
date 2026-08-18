// src/engine/encounter/combat/EnemyCrewTaskRunner.ts

import type { OfficerRole } from "../../../defs/officer";
import { doesDefenseTurretPhaseRequireOperator } from "../../../defs/defense_turret";
import { doesShipWeaponPhaseRequireOperator } from "../../../defs/ship_weapon";
import type { ShipEncounterActorState } from "../../actors/ship/ship_encounter_actor";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../../model/combat";
import {
    SHIP_CREW_TASK_KIND,
    type ClearStickyMineShipCrewTaskState,
    type DeployShieldShipCrewTaskState,
    type IdentifyThreatShipCrewTaskState,
    type PurgeSpamShipCrewTaskState,
    type ShipCrewTaskState,
} from "../../model/ship_crew_task";
import { ENEMY_THREAT_KIND } from "../../model/enemy_threat_observation";
import type { EncounterState } from "../../model/state";
import CrewPerformanceResolver from "../../crew_performance/CrewPerformanceResolver";
import { getActiveCrewProgressEffects } from "../../crew_performance/get_active_crew_progress_effects";

type EnemyCrewTaskRunnerOptions = {
    state: EncounterState;

    onShieldDeploymentCompleted?: (actor: ShipEncounterActorState) => void;

    onStickyMineClearingCompleted: (actor: ShipEncounterActorState, mineId: string) => void;

    onThreatIdentificationCompleted: (actor: ShipEncounterActorState, observationId: string) => void;
};

// Владеет lifecycle задач абстрактного
// экипажа NPC-кораблей.
//
// EnemyBehaviorRunner выбирает и запускает работу.
// Этот runner:
// - занимает одну конкретную роль;
// - не допускает параллельные задачи одной роли;
// - двигает timed tasks;
// - отменяет задачи при смерти actor,
//   исчезновении роли или цели;
// - завершает задачу по её физическому lifecycle.
export default class EnemyCrewTaskRunner {
    private readonly state: EncounterState;

    private readonly performanceResolver: CrewPerformanceResolver;

    private readonly onShieldDeploymentCompleted: (actor: ShipEncounterActorState) => void;

    private readonly onStickyMineClearingCompleted: EnemyCrewTaskRunnerOptions["onStickyMineClearingCompleted"];

    private readonly onThreatIdentificationCompleted: EnemyCrewTaskRunnerOptions["onThreatIdentificationCompleted"];

    constructor({
        state,
        onShieldDeploymentCompleted,
        onStickyMineClearingCompleted,
        onThreatIdentificationCompleted,
    }: EnemyCrewTaskRunnerOptions) {
        this.state = state;

        this.performanceResolver = new CrewPerformanceResolver(this.state);

        this.onShieldDeploymentCompleted =
            onShieldDeploymentCompleted ??
            (() => {
                throw new Error("Enemy shield deployment callback is missing");
            });

        this.onStickyMineClearingCompleted = onStickyMineClearingCompleted;

        this.onThreatIdentificationCompleted = onThreatIdentificationCompleted;
    }

    public isRoleBusy(actor: ShipEncounterActorState, role: OfficerRole): boolean {
        return actor.crewTasks[role] !== undefined;
    }

    public start(actor: ShipEncounterActorState, task: ShipCrewTaskState): ShipCrewTaskState {
        if (!actor.crewRoles.includes(task.role)) {
            throw new Error("Ship crew role is missing: " + actor.id + "/" + task.role);
        }

        if (this.isRoleBusy(actor, task.role)) {
            throw new Error("Ship crew role already busy: " + actor.id + "/" + task.role);
        }

        const storedTask: ShipCrewTaskState = {
            ...task,
        };

        actor.crewTasks[task.role] = storedTask;

        return storedTask;
    }

    public cancel(actor: ShipEncounterActorState, role: OfficerRole): ShipCrewTaskState | undefined {
        const task = actor.crewTasks[role];

        if (!task) {
            return undefined;
        }

        delete actor.crewTasks[role];

        return task;
    }

    public advance(
        deltaMs: number,
        onSpamPurgingCompleted: (actor: ShipEncounterActorState, channelId: string) => void,
    ): void {
        if (deltaMs < 0) {
            throw new Error("Enemy crew task deltaMs " + "cannot be negative: " + deltaMs);
        }

        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                this.cancelAll(actor);
                continue;
            }

            this.advanceActorTasks(actor, deltaMs, onSpamPurgingCompleted);
        }
    }

    public synchronize(): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                this.cancelAll(actor);
                continue;
            }

            this.synchronizeActorTasks(actor);
        }
    }

    private advanceActorTasks(
        actor: ShipEncounterActorState,
        deltaMs: number,
        onSpamPurgingCompleted: (actor: ShipEncounterActorState, channelId: string) => void,
    ): void {
        const progressDeltaMs = deltaMs * this.performanceResolver.getActorProgressMultiplier(actor.id);
        const taskRoles = Object.keys(actor.crewTasks) as OfficerRole[];

        for (const role of taskRoles) {
            const task = actor.crewTasks[role];

            if (!task) {
                continue;
            }

            if (task.role !== role) {
                throw new Error("Ship crew task role mismatch: " + actor.id + "/" + role + "/" + task.role);
            }

            if (!actor.crewRoles.includes(role)) {
                this.cancel(actor, role);
                continue;
            }

            this.synchronizeTask(actor, role, task);

            if (actor.crewTasks[role] !== task) {
                continue;
            }

            this.advanceTimedTask(actor, role, task, progressDeltaMs, onSpamPurgingCompleted);
        }
    }

    private synchronizeActorTasks(actor: ShipEncounterActorState): void {
        const taskRoles = Object.keys(actor.crewTasks) as OfficerRole[];

        for (const role of taskRoles) {
            const task = actor.crewTasks[role];

            if (!task) {
                continue;
            }

            if (task.role !== role) {
                throw new Error("Ship crew task role mismatch: " + actor.id + "/" + role + "/" + task.role);
            }

            if (!actor.crewRoles.includes(role)) {
                this.cancel(actor, role);
                continue;
            }

            this.synchronizeTask(actor, role, task);
        }
    }

    private synchronizeTask(actor: ShipEncounterActorState, role: OfficerRole, task: ShipCrewTaskState): void {
        switch (task.kind) {
            case SHIP_CREW_TASK_KIND.DEPLOY_SHIELD:
                this.synchronizeDeployShield(actor, role, task);
                return;

            case SHIP_CREW_TASK_KIND.OPERATE_WEAPON:
                this.synchronizeOperateWeapon(actor, role, task.weaponId);
                return;

            case SHIP_CREW_TASK_KIND.INTERCEPT_MISSILE:
                this.synchronizeInterceptMissile(actor, role, task.defenseTurretId);
                return;

            case SHIP_CREW_TASK_KIND.CLEAR_STICKY_MINE:
                this.synchronizeClearStickyMine(actor, role, task);
                return;

            case SHIP_CREW_TASK_KIND.IDENTIFY_THREAT:
                this.synchronizeIdentifyThreat(actor, role, task);
                return;

            case SHIP_CREW_TASK_KIND.PURGE_SPAM:
                this.synchronizePurgeSpam(actor, role, task);
                return;
        }
    }

    private advanceTimedTask(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: ShipCrewTaskState,
        deltaMs: number,
        onSpamPurgingCompleted: (actor: ShipEncounterActorState, channelId: string) => void,
    ): void {
        switch (task.kind) {
            case SHIP_CREW_TASK_KIND.DEPLOY_SHIELD:
                this.advanceDeployShield(actor, role, task, deltaMs);
                return;

            case SHIP_CREW_TASK_KIND.CLEAR_STICKY_MINE:
                this.advanceClearStickyMine(actor, role, task, deltaMs);
                return;

            case SHIP_CREW_TASK_KIND.IDENTIFY_THREAT:
                this.advanceIdentifyThreat(actor, role, task, deltaMs);
                return;

            case SHIP_CREW_TASK_KIND.PURGE_SPAM:
                this.advancePurgeSpam(actor, role, task, deltaMs, onSpamPurgingCompleted);
                return;

            case SHIP_CREW_TASK_KIND.OPERATE_WEAPON:
            case SHIP_CREW_TASK_KIND.INTERCEPT_MISSILE:
                return;
        }
    }

    private synchronizeDeployShield(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: DeployShieldShipCrewTaskState,
    ): void {
        const observation = actor.threatObservations.find((candidate) => {
            return candidate.id === task.observationId;
        });

        if (!observation || observation.kind !== ENEMY_THREAT_KIND.BEAM_CANNON) {
            // Charge was committed on task start and is not refunded.
            this.cancel(actor, role);
        }
    }

    private advanceDeployShield(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: DeployShieldShipCrewTaskState,
        deltaMs: number,
    ): void {
        task.elapsedMs = Math.min(task.durationMs, task.elapsedMs + deltaMs);

        if (task.elapsedMs < task.durationMs) {
            return;
        }

        this.onShieldDeploymentCompleted(actor);
        this.complete(actor, role);
    }

    private synchronizeOperateWeapon(actor: ShipEncounterActorState, role: OfficerRole, weaponId: string): void {
        const weapon = actor.weapons.find((candidate) => {
            return candidate.id === weaponId;
        });

        if (!weapon) {
            this.cancel(actor, role);
            return;
        }

        if (doesShipWeaponPhaseRequireOperator(weapon.phase)) {
            return;
        }

        this.complete(actor, role);
    }

    private synchronizeInterceptMissile(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        defenseTurretId: string,
    ): void {
        const defenseTurret = actor.defenseTurret;

        if (!defenseTurret || defenseTurret.id !== defenseTurretId) {
            this.cancel(actor, role);
            return;
        }

        if (doesDefenseTurretPhaseRequireOperator(defenseTurret.phase)) {
            return;
        }

        this.complete(actor, role);
    }

    private synchronizeClearStickyMine(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: ClearStickyMineShipCrewTaskState,
    ): void {
        const mine = this.state.combat.stickyMines.find((candidate) => {
            return (
                candidate.id === task.mineId &&
                candidate.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                candidate.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                candidate.target.actorId === actor.id
            );
        });

        if (!mine) {
            this.cancel(actor, role);
        }
    }

    private advanceClearStickyMine(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: ClearStickyMineShipCrewTaskState,
        deltaMs: number,
    ): void {
        task.elapsedMs = Math.min(task.durationMs, task.elapsedMs + deltaMs);

        if (task.elapsedMs < task.durationMs) {
            return;
        }

        this.onStickyMineClearingCompleted(actor, task.mineId);
        this.complete(actor, role);
    }

    private synchronizePurgeSpam(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: PurgeSpamShipCrewTaskState,
    ): void {
        const channel = getActiveCrewProgressEffects(this.state).find((effect) => {
            return (
                effect.id === task.channelId &&
                effect.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                effect.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                effect.target.actorId === actor.id
            );
        });

        if (!channel) {
            this.cancel(actor, role);
        }
    }

    private advancePurgeSpam(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: PurgeSpamShipCrewTaskState,
        deltaMs: number,
        onSpamPurgingCompleted: (actor: ShipEncounterActorState, channelId: string) => void,
    ): void {
        task.elapsedMs = Math.min(task.durationMs, task.elapsedMs + deltaMs);

        if (task.elapsedMs < task.durationMs) {
            return;
        }

        onSpamPurgingCompleted(actor, task.channelId);
        this.complete(actor, role);
    }

    private synchronizeIdentifyThreat(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: IdentifyThreatShipCrewTaskState,
    ): void {
        const observation = actor.threatObservations.find((candidate) => {
            return candidate.id === task.observationId;
        });

        if (!observation || observation.report) {
            this.cancel(actor, role);
        }
    }

    private advanceIdentifyThreat(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: IdentifyThreatShipCrewTaskState,
        deltaMs: number,
    ): void {
        task.elapsedMs = Math.min(task.durationMs, task.elapsedMs + deltaMs);

        if (task.elapsedMs < task.durationMs) {
            return;
        }

        this.onThreatIdentificationCompleted(actor, task.observationId);
        this.complete(actor, role);
    }

    private complete(actor: ShipEncounterActorState, role: OfficerRole): ShipCrewTaskState {
        const task = this.cancel(actor, role);

        if (!task) {
            throw new Error("Ship crew task disappeared " + "before completion: " + actor.id + "/" + role);
        }

        return task;
    }

    private cancelAll(actor: ShipEncounterActorState): void {
        const taskRoles = Object.keys(actor.crewTasks) as OfficerRole[];

        for (const role of taskRoles) {
            this.cancel(actor, role);
        }
    }
}
