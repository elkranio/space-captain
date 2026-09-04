// src/engine/encounter/combat/queries/get_enemy_threat_decision_snapshots.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { OFFICER_ROLE } from "../../../defs/officer";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from "../../../defs/ship_weapon";
import type { ShipEncounterActorState } from "../../actors/ship_encounter_actor";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../../model/combat";
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
} from "../../model/enemy_threat_observation";
import { OFFICER_TASK_KIND } from "../../model/officer_task";
import type { EncounterState } from "../../model/state";

export type EnemyMissileThreatDecisionSnapshot = {
    kind: typeof ENEMY_THREAT_KIND.MISSILE;

    observationId: string;
    projectileId: string;
    timeToImpactMs: number;
};

export type EnemyBeamCannonThreatDecisionSnapshot = {
    kind: typeof ENEMY_THREAT_KIND.BEAM_CANNON;

    observationId: string;

    officerTaskId: string;
    weaponId: string;

    remainingChargeMs: number;
};

export type EnemyStickyMineThreatDecisionSnapshot = {
    kind: typeof ENEMY_THREAT_KIND.STICKY_MINE;

    observationId: string;
    mineId: string;
    timeToDetonationMs: number;
};

export type EnemyThreatDecisionSnapshot =
    EnemyMissileThreatDecisionSnapshot | EnemyBeamCannonThreatDecisionSnapshot | EnemyStickyMineThreatDecisionSnapshot;

// Read-only decision context для одной enemy ship.
//
// Observation остаётся памятью экипажа.
// Objective combat state остаётся единственным truth.
// Query резолвит stable observation source только в те
// физические факты, которые реально нужны EnemyDecisionPolicy.
//
// Missile snapshot содержит только observation id, projectile id и время до попадания.
//
// Исчезнувший source не является invariant error.
// Между observer sync и decision pass старая enemy crew task
// может завершиться и удалить mine, поэтому stale observation
// просто не участвует в следующем решении.
export function getEnemyThreatDecisionSnapshots(
    state: EncounterState,
    actor: ShipEncounterActorState,
): EnemyThreatDecisionSnapshot[] {
    const snapshots: EnemyThreatDecisionSnapshot[] = [];

    for (const observation of actor.threatObservations) {
        const snapshot = resolveObservation(state, actor, observation);

        if (snapshot) {
            snapshots.push(snapshot);
        }
    }

    return snapshots;
}

function resolveObservation(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
): EnemyThreatDecisionSnapshot | undefined {
    switch (observation.kind) {
        case ENEMY_THREAT_KIND.MISSILE:
            return resolveMissile(state, actor, observation);

        case ENEMY_THREAT_KIND.BEAM_CANNON:
            return resolveBeamCannon(state, actor, observation);

        case ENEMY_THREAT_KIND.STICKY_MINE:
            return resolveStickyMine(state, actor, observation);

        default:
            throw new Error("Unsupported enemy threat observation kind: " + String(observation.kind));
    }
}

function resolveMissile(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
): EnemyMissileThreatDecisionSnapshot | undefined {
    const source = observation.source;

    if (source.kind !== ENEMY_THREAT_SOURCE_KIND.COMBAT_PROJECTILE) {
        throw new Error(
            "Enemy missile observation has invalid source: " + actor.id + "/" + observation.id + "/" + source.kind,
        );
    }

    const projectile = state.combat.projectiles.find((candidate) => {
        return candidate.id === source.projectileId;
    });

    if (
        !projectile ||
        projectile.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
        projectile.target.kind !== COMBAT_TARGET_KIND.ACTOR ||
        projectile.target.actorId !== actor.id
    ) {
        return undefined;
    }

    return {
        kind: ENEMY_THREAT_KIND.MISSILE,

        observationId: observation.id,

        projectileId: projectile.id,

        timeToImpactMs: projectile.timeToImpactMs,
    };
}

function resolveBeamCannon(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
): EnemyBeamCannonThreatDecisionSnapshot | undefined {
    const source = observation.source;

    if (source.kind !== ENEMY_THREAT_SOURCE_KIND.PLAYER_OFFICER_TASK) {
        throw new Error(
            "Enemy beamCannon observation has invalid source: " + actor.id + "/" + observation.id + "/" + source.kind,
        );
    }

    const playerTask = state.officerTasks[OFFICER_ROLE.GUNNER];

    if (
        !playerTask ||
        playerTask.id !== source.officerTaskId ||
        playerTask.kind !== OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON ||
        playerTask.targetActorId !== actor.id
    ) {
        return undefined;
    }

    const weapon = state.combat.playerWeapons.find((candidate) => {
        return candidate.id === playerTask.weaponId;
    });

    if (!weapon || weapon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON || weapon.phase !== SHIP_WEAPON_PHASE.CHARGING) {
        return undefined;
    }

    const definition = SHIP_WEAPONS[weapon.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error(
            "Player beamCannon definition mismatch while resolving enemy decision: " +
                actor.id +
                "/" +
                weapon.id +
                "/" +
                weapon.weaponId,
        );
    }

    return {
        kind: ENEMY_THREAT_KIND.BEAM_CANNON,

        observationId: observation.id,

        officerTaskId: playerTask.id,

        weaponId: weapon.id,

        remainingChargeMs: Math.max(
            0,

            definition.chargeDurationMs - weapon.phaseElapsedMs,
        ),
    };
}

function resolveStickyMine(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
): EnemyStickyMineThreatDecisionSnapshot | undefined {
    const source = observation.source;

    if (source.kind !== ENEMY_THREAT_SOURCE_KIND.STICKY_MINE) {
        throw new Error(
            "Enemy sticky-mine observation has invalid source: " + actor.id + "/" + observation.id + "/" + source.kind,
        );
    }

    const mine = state.combat.stickyMines.find((candidate) => {
        return candidate.id === source.stickyMineId;
    });

    if (
        !mine ||
        mine.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
        mine.target.kind !== COMBAT_TARGET_KIND.ACTOR ||
        mine.target.actorId !== actor.id
    ) {
        return undefined;
    }

    return {
        kind: ENEMY_THREAT_KIND.STICKY_MINE,

        observationId: observation.id,

        mineId: mine.id,

        timeToDetonationMs: mine.timeToDetonationMs,
    };
}
