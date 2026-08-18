import { ENCOUNTER_EVENT, type EncounterEvent } from "../model/event";
import {
    createMissileEventProjectileSnapshot,
    type MissileEventProjectileSnapshot,
} from "../model/missile_event_projectile";
import { createDetachedSnapshot } from "./create_detached_snapshot";

type MissileProjectileEncounterEvent = EncounterEvent & {
    projectile: MissileEventProjectileSnapshot;
};

// Single engine-outbox boundary.
//
// Runners may operate on richer mutable domain objects. Before an event leaves
// EncounterEngine, payloads with hidden projectile truth are projected to the
// explicit public event model and the whole event is recursively detached.
export function createEncounterEventSnapshot(event: EncounterEvent): EncounterEvent {
    switch (event.type) {
        case ENCOUNTER_EVENT.PLAYER_MISSILE_LAUNCHED:

        case ENCOUNTER_EVENT.PLAYER_MISSILE_RESOLVED:

        case ENCOUNTER_EVENT.ENEMY_DEFENSE_TURRET_FIRED:

        case ENCOUNTER_EVENT.MISSILE_LAUNCHED:

        case ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP:
            return createMissileProjectileEncounterEventSnapshot(event);

        default:
            return createDetachedSnapshot(event);
    }
}

function createMissileProjectileEncounterEventSnapshot<T extends MissileProjectileEncounterEvent>(event: T): T {
    return createDetachedSnapshot({
        ...event,

        projectile: createMissileEventProjectileSnapshot(event.projectile),
    }) as T;
}
