// src/engine/encounter/crew_performance/get_active_crew_progress_effects.ts

import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../defs/encounter_team";
import { OFFICER_ROLE } from "../../defs/officer";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type SpamProjectorState } from "../../defs/ship_weapon";
import { ENCOUNTER_ACTOR_KIND } from "../actors/encounter_actor";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../model/combat";
import { OFFICER_TASK_KIND } from "../model/officer_task";
import type { EncounterState } from "../model/state";

export type CrewProgressEffect = {
    id: string;

    sourceWeaponId: string;

    source:
        | {
              kind: typeof COMBAT_SOURCE_KIND.PLAYER_SHIP;
          }
        | {
              kind: typeof COMBAT_SOURCE_KIND.ACTOR;

              actorId: string;
          };

    target:
        | {
              kind: typeof COMBAT_TARGET_KIND.PLAYER_SHIP;
          }
        | {
              kind: typeof COMBAT_TARGET_KIND.ACTOR;

              actorId: string;
          };

    progressMultiplier: number;
};

// One normalized read model for every active crew-progress effect.
//
// Mutable lifecycle stays with physical spam projectors and their owning
// crew/officer tasks. This query only converts those authoritative states into
// detached source -> target effects.
//
// Adding another progress modifier should extend this query instead of adding
// another player/enemy-specific resolver.
export function getActiveCrewProgressEffects(state: EncounterState): CrewProgressEffect[] {
    const effects: CrewProgressEffect[] = [];

    appendEnemySpamEffects(state, effects);

    appendPlayerSpamEffect(state, effects);

    return effects;
}

function appendEnemySpamEffects(state: EncounterState, effects: CrewProgressEffect[]): void {
    for (const actor of state.actors) {
        if (actor.kind !== ENCOUNTER_ACTOR_KIND.SHIP || actor.team !== ENCOUNTER_TEAM.ENEMY) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (
                weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING ||
                weapon.activeChannelId === null
            ) {
                continue;
            }

            effects.push({
                id: weapon.activeChannelId,

                sourceWeaponId: weapon.id,

                source: {
                    kind: COMBAT_SOURCE_KIND.ACTOR,

                    actorId: actor.id,
                },

                target: {
                    kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
                },

                progressMultiplier: getSpamProgressMultiplier(weapon, actor.id),
            });
        }
    }
}

function appendPlayerSpamEffect(state: EncounterState, effects: CrewProgressEffect[]): void {
    const task = state.officerTasks[OFFICER_ROLE.SCIENTIST];

    if (!task || task.kind !== OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM) {
        return;
    }

    const target = state.actors.find((actor) => {
        return actor.id === task.targetActorId;
    });

    if (
        !target ||
        target.kind !== ENCOUNTER_ACTOR_KIND.SHIP ||
        target.team !== ENCOUNTER_TEAM.ENEMY ||
        target.hull <= 0
    ) {
        return;
    }

    const weapon = state.combat.playerWeapons.find((candidate) => {
        return candidate.id === task.weaponId;
    });

    if (!weapon) {
        return;
    }

    if (weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
        throw new Error(
            "Player spam task references " + "non-projector weapon: " + task.id + "/" + weapon.id + "/" + weapon.kind,
        );
    }

    if (weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING || weapon.activeChannelId === null) {
        return;
    }

    effects.push({
        id: weapon.activeChannelId,

        sourceWeaponId: weapon.id,

        source: {
            kind: COMBAT_SOURCE_KIND.PLAYER_SHIP,
        },

        target: {
            kind: COMBAT_TARGET_KIND.ACTOR,

            actorId: task.targetActorId,
        },

        progressMultiplier: getSpamProgressMultiplier(weapon, "player"),
    });
}

function getSpamProgressMultiplier(projector: SpamProjectorState, ownerLabel: string): number {
    const definition = SHIP_WEAPONS[projector.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
        throw new Error(
            "Spam projector definition mismatch: " + ownerLabel + "/" + projector.id + "/" + projector.weaponId,
        );
    }

    return definition.officerTaskProgressMultiplier;
}
