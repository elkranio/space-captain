// src/engine/encounter/combat/enemy/intel/EnemyScienceIntelResolver.ts

import { CREW_TRAIT_ID } from "../../../../defs/crew_trait";
import type { MissileSignature } from "../../../../defs/missile";
import { OFFICER_ROLE } from "../../../../defs/officer";
import type { ShipEncounterActorState } from "../../../actors/ship_encounter_actor";
import {
    MISSILE_SIGNATURE_ANALYSIS_PROFILE,
    resolveMissileSignatureAnalysis,
} from "../../intel/resolve_missile_signature_analysis";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../../../model/combat";
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
    type EnemyThreatReport,
} from "../../../model/enemy_threat_observation";
import type { EncounterState } from "../../../model/state";

// Single boundary between objective missile truth and enemy observer intel.
//
// Crew state selects an analysis profile; it never directly fabricates
// public correctness flags.
export default class EnemyScienceIntelResolver {
    constructor(
        private readonly state: EncounterState,

        private readonly random: () => number,
    ) {}

    public resolve(actor: ShipEncounterActorState, observationId: string): EnemyThreatReport {
        const observation = actor.threatObservations.find((candidate) => {
            return candidate.id === observationId;
        });

        if (!observation) {
            throw new Error("Enemy threat observation is missing: " + actor.id + "/" + observationId);
        }

        const truth = this.resolveTruth(actor, observation);

        const analysis = resolveMissileSignatureAnalysis({
            truth,

            profile: this.isScienceHungover(actor)
                ? MISSILE_SIGNATURE_ANALYSIS_PROFILE.IMPAIRED
                : MISSILE_SIGNATURE_ANALYSIS_PROFILE.STANDARD,

            random: this.random,
        });

        return {
            kind: ENEMY_THREAT_KIND.MISSILE,

            ...analysis.identification,
        };
    }

    private resolveTruth(actor: ShipEncounterActorState, observation: EnemyThreatObservationState): MissileSignature {
        switch (observation.kind) {
            case ENEMY_THREAT_KIND.MISSILE:
                return this.resolveMissileTruth(actor, observation);

            case ENEMY_THREAT_KIND.BEAM_CANNON:
                throw new Error(
                    "Player beamCannon does not expose Science intel " +
                        "in the current combat model: " +
                        actor.id +
                        "/" +
                        observation.id,
                );

            case ENEMY_THREAT_KIND.STICKY_MINE:
                throw new Error(
                    "Sticky mine observation " + "does not require Science intel: " + actor.id + "/" + observation.id,
                );
        }
    }

    private resolveMissileTruth(
        actor: ShipEncounterActorState,
        observation: EnemyThreatObservationState,
    ): MissileSignature {
        const source = observation.source;

        if (source.kind !== ENEMY_THREAT_SOURCE_KIND.COMBAT_PROJECTILE) {
            throw new Error(
                "Missile observation has " + "invalid source: " + actor.id + "/" + observation.id + "/" + source.kind,
            );
        }

        const projectile = this.state.combat.projectiles.find((candidate) => {
            return candidate.id === source.projectileId;
        });

        if (
            !projectile ||
            projectile.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
            projectile.target.kind !== COMBAT_TARGET_KIND.ACTOR ||
            projectile.target.actorId !== actor.id
        ) {
            throw new Error("Missile observation source " + "is no longer valid: " + actor.id + "/" + observation.id);
        }

        return projectile.signature;
    }

    private isScienceHungover(actor: ShipEncounterActorState): boolean {
        return actor.crewTraitsByRole[OFFICER_ROLE.SCIENCE]?.includes(CREW_TRAIT_ID.HUNGOVER) ?? false;
    }
}
