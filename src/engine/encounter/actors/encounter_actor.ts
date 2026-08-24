// src/engine/encounter/actors/encounter_actor.ts

import type { EncounterTeam } from "../../defs/encounter_team";
import type { ShipEncounterActorState } from "./ship_encounter_actor";

export const ENCOUNTER_ACTOR_KIND = {
    SHIP: "ship",
} as const;

// Общая runtime-часть эфемерного участника encounter.
//
// Actor существует только внутри текущего encounter,
// не является persistent space anchor
// и не участвует в navigation topology.
export type EncounterActorBaseState = {
    id: string;
    displayName: string;

    team: EncounterTeam;

    // Anchor, возле которого actor сейчас находится.
    anchorId: string;
};

export type EncounterActorState = ShipEncounterActorState;
