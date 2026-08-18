// src/engine/encounter/combat/enemy/EnemyBehaviorRunner.ts

import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import { PLAYER_SPACE_NAVIGATION_KIND } from "../../../defs/player_location";
import type { ShipEncounterActorState } from "../../actors/ship/ship_encounter_actor";
import type { EncounterEvent } from "../../model/event";
import type { EncounterState } from "../../model/state";
import { getEnemyCaptainDecisionSnapshot } from "../queries/get_enemy_captain_decision_snapshot";
import EnemyCrewTaskRunner from "./EnemyCrewTaskRunner";
import EnemyDecisionPolicy from "./EnemyDecisionPolicy";
import EnemyScienceIntelResolver from "./intel/EnemyScienceIntelResolver";
import EnemyThreatObserver from "./intel/EnemyThreatObserver";
import EnemyWorkExecutor from "./EnemyWorkExecutor";

type EnemyBehaviorRunnerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    clearPlayerStickyMine: (mineId: string, targetActorId: string) => boolean;

    purgePlayerSpamChannel: (channelId: string, targetActorId: string) => boolean;

    deployEnemyShield?: (actor: ShipEncounterActorState) => void;

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

    private readonly decisionPolicy: EnemyDecisionPolicy;

    private readonly scienceIntelResolver: EnemyScienceIntelResolver;

    private readonly threatObserver: EnemyThreatObserver;

    private readonly crewTaskRunner: EnemyCrewTaskRunner;

    private readonly workExecutor: EnemyWorkExecutor;

    private readonly random: () => number;

    constructor({
        state,
        emit,
        clearPlayerStickyMine,
        purgePlayerSpamChannel,
        deployEnemyShield,
        random = Math.random,
    }: EnemyBehaviorRunnerOptions) {
        this.state = state;
        this.random = random;

        this.decisionPolicy = new EnemyDecisionPolicy(random);

        this.scienceIntelResolver = new EnemyScienceIntelResolver(this.state, random);

        this.threatObserver = new EnemyThreatObserver(this.state);

        this.crewTaskRunner = new EnemyCrewTaskRunner({
            state: this.state,

            onShieldDeploymentCompleted: (actor) => {
                if (!deployEnemyShield) {
                    throw new Error("Enemy shield deployment callback is missing");
                }

                deployEnemyShield(actor);
            },

            onStickyMineClearingCompleted: (actor, mineId) => {
                const cleared = clearPlayerStickyMine(mineId, actor.id);

                if (!cleared) {
                    throw new Error(
                        "Enemy sticky mine " +
                            "disappeared before " +
                            "clearing completion: " +
                            actor.id +
                            "/" +
                            mineId,
                    );
                }
            },

            onSpamPurgingCompleted: (actor, channelId) => {
                const purged = purgePlayerSpamChannel(channelId, actor.id);

                if (!purged) {
                    throw new Error(
                        "Player spam channel " +
                            "disappeared before " +
                            "enemy purge completion: " +
                            actor.id +
                            "/" +
                            channelId,
                    );
                }
            },

            onThreatIdentificationCompleted: (actor, observationId) => {
                const observation = actor.threatObservations.find((candidate) => {
                    return candidate.id === observationId;
                });

                if (!observation) {
                    throw new Error(
                        "Enemy threat " +
                            "observation " +
                            "disappeared before " +
                            "report: " +
                            actor.id +
                            "/" +
                            observationId,
                    );
                }

                observation.report = this.scienceIntelResolver.resolve(actor, observationId);
            },
        });

        this.workExecutor = new EnemyWorkExecutor({
            state: this.state,
            emit,
            crewTaskRunner: this.crewTaskRunner,
        });
    }

    public step(deltaMs: number): void {
        this.threatObserver.synchronize();

        this.crewTaskRunner.advance(deltaMs);

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
