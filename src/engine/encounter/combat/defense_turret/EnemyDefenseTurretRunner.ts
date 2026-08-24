// src/engine/encounter/combat/defense_turret/EnemyDefenseTurretRunner.ts

import { DEFENSE_TURRETS } from "../../../content/catalogs/defense_turrets";
import {
    advanceDefenseTurretCooldown,
    finishDefenseTurretAction,
    DEFENSE_TURRET_PHASE,
    DEFENSE_TURRET_SHOT_OUTCOME,
    type ShipDefenseTurretState,
} from "../../../defs/defense_turret";
import type { ShipEncounterActorState } from "../../actors/ship_encounter_actor";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND, type MissileCombatProjectileState } from "../../model/combat";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../../model/event";
import type { EncounterState } from "../../model/state";
import type CombatMissileRunner from "../missile/CombatMissileRunner";

type EnemyDefenseTurretRunnerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    missileRunner: Pick<CombatMissileRunner, "interceptPlayerMissile">;
};

// Owns the physical lifecycle of one installed enemy defense-turret system.
// Policy chooses only the missile target. A completed load against a still-live
// projectile is a deterministic physical intercept.
export default class EnemyDefenseTurretRunner {
    constructor(private readonly options: EnemyDefenseTurretRunnerOptions) {}

    public advance(
        actor: ShipEncounterActorState,
        defenseTurret: ShipDefenseTurretState,
        deltaMs: number,
        worldDeltaMs: number,
    ): void {
        if (deltaMs < 0) {
            throw new Error("Enemy defense-turret deltaMs cannot be negative: " + deltaMs);
        }

        const definition = DEFENSE_TURRETS[defenseTurret.defenseTurretId];

        advanceDefenseTurretCooldown(defenseTurret, definition.cooldownDurationMs, worldDeltaMs);

        switch (defenseTurret.phase) {
            case DEFENSE_TURRET_PHASE.READY:
                return;

            case DEFENSE_TURRET_PHASE.LOADING:
                this.advanceLoading(actor, defenseTurret, deltaMs);
                return;

            case DEFENSE_TURRET_PHASE.COOLDOWN:
                return;
        }
    }

    private advanceLoading(
        actor: ShipEncounterActorState,
        defenseTurret: ShipDefenseTurretState,
        deltaMs: number,
    ): void {
        const projectile = this.findTargetProjectile(actor, defenseTurret);

        if (!projectile) {
            // Target vanished after commitment.
            // The shared defensive charge remains spent.
            const definition = DEFENSE_TURRETS[defenseTurret.defenseTurretId];

            finishDefenseTurretAction(defenseTurret, definition.cooldownDurationMs);

            return;
        }

        const definition = DEFENSE_TURRETS[defenseTurret.defenseTurretId];

        const elapsedMs = defenseTurret.phaseElapsedMs + deltaMs;

        if (elapsedMs < definition.loadDurationMs) {
            defenseTurret.phaseElapsedMs = elapsedMs;

            return;
        }

        const powerCore = actor.powerCore;

        if (!powerCore) {
            throw new Error("Enemy defense turret cannot fire: " + actor.id + "/" + defenseTurret.id);
        }

        const outcome = DEFENSE_TURRET_SHOT_OUTCOME.HIT;

        finishDefenseTurretAction(defenseTurret, definition.cooldownDurationMs);

        // Event precedes missile resolution so presentation can aim at
        // a still-existing projectile. CombatMissileRunner remains the
        // owner allowed to remove an intercepted outgoing projectile.
        this.options.emit({
            type: ENCOUNTER_EVENT.ENEMY_DEFENSE_TURRET_FIRED,

            sourceActorId: actor.id,
            defenseTurretId: defenseTurret.id,

            projectile,
            outcome,

            remainingCharges: powerCore.charges,
        });

        this.options.missileRunner.interceptPlayerMissile(projectile.id, actor.id);
    }

    private findTargetProjectile(
        actor: ShipEncounterActorState,
        defenseTurret: ShipDefenseTurretState,
    ): MissileCombatProjectileState | undefined {
        const projectileId = defenseTurret.targetProjectileId;

        if (!projectileId) {
            return undefined;
        }

        return this.options.state.combat.projectiles.find((projectile) => {
            return (
                projectile.id === projectileId &&
                projectile.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                projectile.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                projectile.target.actorId === actor.id
            );
        });
    }
}
