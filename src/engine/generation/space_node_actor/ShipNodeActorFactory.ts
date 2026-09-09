// src/engine/generation/space_node_actor/ShipNodeActorFactory.ts

import type { EncounterTeam } from "../../defs/encounter_team";
import type { OfficerRole } from "../../defs/officer";
import type { ShipBehaviorState } from "../../defs/ship_behavior";
import { SPACE_NODE_ACTOR_KIND, type ShipSpaceNodeActorState } from "../../defs/universe";
import type { CreatedShipState } from "../ship/ShipFactory";

export type CreateShipNodeActorFromShipInput = {
    id: string;
    anchorId: string;

    team: EncounterTeam;
    ship: CreatedShipState;
    crewRoles: OfficerRole[];
    behavior: ShipBehaviorState;
};

// Собирает свежий persistent state корабля,
// который затем копируется в runtime encounter.
export default class ShipNodeActorFactory {
    public static createFromShip({
        id,
        anchorId,
        team,
        ship,
        crewRoles,
        behavior,
    }: CreateShipNodeActorFromShipInput): ShipSpaceNodeActorState {

        return {
            id,
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team,

            chassisId: ship.chassisId,
            anchorId,

            hull: ship.hull,
            maxHull: ship.maxHull,

            mounts: ship.mounts.map((mount) => {
                return {
                    ...mount,
                };
            }),

            drive: ship.drive,

            ...(ship.defenseTurret
                ? {
                      defenseTurret: ship.defenseTurret,
                  }
                : {}),

            ...(ship.powerCore
                ? {
                      powerCore: ship.powerCore,
                  }
                : {}),

            ...(ship.shieldGenerator
                ? {
                      shieldGenerator: {
                          ...ship.shieldGenerator,
                      },
                  }
                : {}),

            behavior: {
                decisionTickDurationMs: behavior.decisionTickDurationMs,

                decisionTickWiggleMs: behavior.decisionTickWiggleMs,

                threatTimingWiggleMs: behavior.threatTimingWiggleMs,

                aggression: behavior.aggression,
            },

            crewRoles: [...crewRoles],

            weapons: ship.weapons,
        };
    }
}
