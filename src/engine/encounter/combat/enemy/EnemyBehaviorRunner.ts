// src/engine/encounter/combat/enemy/EnemyBehaviorRunner.ts

import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import { PLAYER_SPACE_NAVIGATION_KIND } from "../../../defs/player_location";
import type { ShipEncounterActorState } from "../../actors/ship_encounter_actor";
import type { EncounterEvent } from "../../model/event";
import type { EncounterState } from "../../model/state";
import {
    ENCOUNTER_INTERNAL_EFFECT,
    type EncounterInternalEffectSink,
} from "../../model/internal_effect";
import { SHIP_CREW_TASK_KIND } from "../../model/ship_crew_task";
import { getEnemyCaptainDecisionSnapshot } from "../queries/get_enemy_captain_decision_snapshot";
import EnemyCrewTaskRunner, { type EnemyCrewTaskCompletion } from "./EnemyCrewTaskRunner";
import EnemyDecisionPolicy from "./EnemyDecisionPolicy";
import EnemyThreatObserver from "./EnemyThreatObserver";
import EnemyWorkExecutor from "./EnemyWorkExecutor";

type EnemyBehaviorRunnerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    clearPlayerStickyMine: (mineId: string, targetActorId: string) => boolean;

    deployEnemyShield: (actor: ShipEncounterActorState) => void;

    applyInternalEffect: EncounterInternalEffectSink;

    random?: () => number;
};

// Root runtime owner of enemy combat behavior.
//
// CombatRunner gives this root one behavior step after
// authoritative player combat objects have resolved.
//
// This runner owns:
// - threat perception synchronization;
// - enemy crew-task progress;
// - captain decision cadence;
// - one timing-estimate error per captain decision;
// - captain decision snapshot construction;
// - one-intent decision orchestration;
// - intent execution wiring.
//
// Physical weapon/turret/shield lifecycles remain CombatRunner-owned.
//
// Hard contract:
// one enemy captain can start at most ONE new order
// during one captain decision tick.
// Large engine delta never catches up by issuing several orders.
export default class EnemyBehaviorRunner {
    private readonly state: EncounterState;

    private readonly clearPlayerStickyMine: EnemyBehaviorRunnerOptions["clearPlayerStickyMine"];

    private readonly deployEnemyShield: EnemyBehaviorRunnerOptions["deployEnemyShield"];

    private readonly applyInternalEffect: EncounterInternalEffectSink;

    private readonly decisionPolicy: EnemyDecisionPolicy;

    private readonly threatObserver: EnemyThreatObserver;

    private readonly crewTaskRunner: EnemyCrewTaskRunner;

    private readonly workExecutor: EnemyWorkExecutor;

    private readonly random: () => number;

    constructor({
        state,
        emit,
        clearPlayerStickyMine,
        deployEnemyShield,
        applyInternalEffect,
        random = Math.random,
    }: EnemyBehaviorRunnerOptions) {
        this.state = state;
        this.clearPlayerStickyMine = clearPlayerStickyMine;
        this.deployEnemyShield = deployEnemyShield;
        this.applyInternalEffect = applyInternalEffect;
        this.random = random;

        this.decisionPolicy = new EnemyDecisionPolicy(random);

        this.threatObserver = new EnemyThreatObserver(this.state);

        this.crewTaskRunner = new EnemyCrewTaskRunner({
            state: this.state,
        });

        this.workExecutor = new EnemyWorkExecutor({
            state: this.state,
            emit,
            crewTaskRunner: this.crewTaskRunner,
        });
    }

    public step(deltaMs: number): void {
        this.threatObserver.synchronize();

        const crewTaskCompletions = this.crewTaskRunner.advance(deltaMs);

        for (const completion of crewTaskCompletions) {
            this.handleCrewTaskCompletion(completion);
        }

        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            return;
        }

        for (const actor of this.state.actors) {
            if (actor.team !== ENCOUNTER_TEAM.ENEMY || actor.hull <= 0 || actor.anchorId !== navigation.anchorId) {
                continue;
            }

            if (!this.advanceDecisionTick(actor, deltaMs)) {
                continue;
            }

            const threatTimingErrorMs = this.rollThreatTimingErrorMs(actor);

            const snapshot = getEnemyCaptainDecisionSnapshot(this.state, actor, threatTimingErrorMs);

            const intent = this.decisionPolicy.selectWork(snapshot);

            if (!intent) {
                continue;
            }

            this.workExecutor.start(actor, intent);
        }
    }

    public synchronizeTasks(): void {
        this.crewTaskRunner.synchronize();
    }

    private handleCrewTaskCompletion(completion: EnemyCrewTaskCompletion): void {
        const { actor, task } = completion;

        switch (task.kind) {
            case SHIP_CREW_TASK_KIND.DEPLOY_SHIELD:
                this.deployEnemyShield(actor);
                return;

            case SHIP_CREW_TASK_KIND.CLEAR_STICKY_MINE: {
                const cleared = this.clearPlayerStickyMine(task.mineId, actor.id);

                if (!cleared) {
                    throw new Error(
                        "Enemy sticky mine " +
                            "disappeared before " +
                            "clearing completion: " +
                            actor.id +
                            "/" +
                            task.mineId,
                    );
                }

                return;
            }

            case SHIP_CREW_TASK_KIND.PURGE_SPAM: {
                const purged = this.applyInternalEffect({
                    kind: ENCOUNTER_INTERNAL_EFFECT.PURGE_PLAYER_SPAM_CHANNEL,
                    channelId: task.channelId,
                    targetActorId: actor.id,
                });

                if (!purged) {
                    throw new Error(
                        "Player spam channel " +
                            "disappeared before " +
                            "enemy purge completion: " +
                            actor.id +
                            "/" +
                            task.channelId,
                    );
                }

                return;
            }
        }
    }

    private advanceDecisionTick(actor: ShipEncounterActorState, deltaMs: number): boolean {
        actor.decision.decisionTickRemainingMs = Math.max(0, actor.decision.decisionTickRemainingMs - deltaMs);

        if (actor.decision.decisionTickRemainingMs > 0) {
            return false;
        }

        // Overshoot is intentionally discarded:
        // one engine step can consume at most one captain tick.
        actor.decision.decisionTickRemainingMs = this.rollNextDecisionTickMs(actor);

        return true;
    }

    private rollNextDecisionTickMs(actor: ShipEncounterActorState): number {
        const baseMs = actor.behavior.decisionTickDurationMs;

        const wiggleMs = actor.behavior.decisionTickWiggleMs;

        if (wiggleMs === 0) {
            return baseMs;
        }

        const centeredRandom = this.random() * 2 - 1;

        return Math.max(0, Math.round(baseMs + centeredRandom * wiggleMs));
    }

    private rollThreatTimingErrorMs(actor: ShipEncounterActorState): number {
        if (actor.threatObservations.length === 0) {
            return 0;
        }

        const wiggleMs = actor.behavior.threatTimingWiggleMs;

        if (wiggleMs === 0) {
            return 0;
        }

        return Math.round((this.random() * 2 - 1) * wiggleMs);
    }
}
