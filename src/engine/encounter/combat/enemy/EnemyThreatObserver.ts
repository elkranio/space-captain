// src/engine/encounter/combat/enemy/EnemyThreatObserver.ts

import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import { OFFICER_ROLE } from "../../../defs/officer";
import { SHIP_WEAPON_PHASE } from "../../../defs/ship_weapon";
import type { ShipEncounterActorState } from "../../actors/ship_encounter_actor";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../../model/combat";
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
} from "../../model/enemy_threat_observation";
import { OFFICER_TASK_KIND } from "../../model/officer_task";
import type { EncounterState } from "../../model/state";

// Синхронизирует то, что enemy crew
// физически может заметить прямо сейчас.
//
// Observer не раскрывает скрытые параметры.
// Он создаёт только stable reference
// на authoritative combat object/task.
//
// Существующие observation objects
// переиспользуются по id, чтобы stable reference
// сохранялся между encounter steps.
export default class EnemyThreatObserver {
    constructor(private readonly state: EncounterState) {}

    public synchronize(): void {
        for (const actor of this.state.actors) {
            if (actor.team !== ENCOUNTER_TEAM.ENEMY || actor.hull <= 0) {
                actor.threatObservations.splice(0, actor.threatObservations.length);

                continue;
            }

            this.synchronizeActor(actor);
        }
    }

    private synchronizeActor(actor: ShipEncounterActorState): void {
        const current = this.collectCurrentObservations(actor.id);

        const existingById = new Map(
            actor.threatObservations.map((observation) => {
                return [observation.id, observation] as const;
            }),
        );

        const next = current.map((observation) => {
            return existingById.get(observation.id) ?? observation;
        });

        actor.threatObservations.splice(0, actor.threatObservations.length, ...next);
    }

    private collectCurrentObservations(actorId: string): EnemyThreatObservationState[] {
        return [
            ...this.collectMissiles(actorId),
            ...this.collectChargingBeamCannon(actorId),
            ...this.collectStickyMines(actorId),
        ];
    }

    private collectMissiles(actorId: string): EnemyThreatObservationState[] {
        const observations: EnemyThreatObservationState[] = [];

        for (const projectile of this.state.combat.projectiles) {
            if (
                projectile.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
                projectile.target.kind !== COMBAT_TARGET_KIND.ACTOR ||
                projectile.target.actorId !== actorId
            ) {
                continue;
            }

            observations.push({
                id: "missile:" + projectile.id,

                kind: ENEMY_THREAT_KIND.MISSILE,

                source: {
                    kind: ENEMY_THREAT_SOURCE_KIND.COMBAT_PROJECTILE,

                    projectileId: projectile.id,
                },
            });
        }

        return observations;
    }

    private collectChargingBeamCannon(actorId: string): EnemyThreatObservationState[] {
        const task = this.state.officerTasks[OFFICER_ROLE.GUNNER];

        if (!task || task.kind !== OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON || task.targetActorId !== actorId) {
            return [];
        }

        const weapon = this.state.combat.playerWeapons.find((candidate) => {
            return candidate.id === task.weaponId;
        });

        if (!weapon || weapon.phase !== SHIP_WEAPON_PHASE.CHARGING) {
            return [];
        }

        return [
            {
                id: "beamCannon:" + task.id,

                kind: ENEMY_THREAT_KIND.BEAM_CANNON,

                source: {
                    kind: ENEMY_THREAT_SOURCE_KIND.PLAYER_OFFICER_TASK,

                    officerTaskId: task.id,
                },
            },
        ];
    }

    private collectStickyMines(actorId: string): EnemyThreatObservationState[] {
        const observations: EnemyThreatObservationState[] = [];

        for (const mine of this.state.combat.stickyMines) {
            if (
                mine.source.kind !== COMBAT_SOURCE_KIND.PLAYER_SHIP ||
                mine.target.kind !== COMBAT_TARGET_KIND.ACTOR ||
                mine.target.actorId !== actorId
            ) {
                continue;
            }

            observations.push({
                id: "sticky_mine:" + mine.id,

                kind: ENEMY_THREAT_KIND.STICKY_MINE,

                source: {
                    kind: ENEMY_THREAT_SOURCE_KIND.STICKY_MINE,

                    stickyMineId: mine.id,
                },
            });
        }

        return observations;
    }
}
