// src/engine/generation/space_node_actor/ShipNodeActorFactory.ts

import {
    SHIP_BEHAVIOR_PRESETS,
} from '../../content/presets/ship_behaviors';
import {
    SHIP_CREW_PRESETS,
    type ShipCrewPreset,
} from '../../content/presets/ship_crews';
import {
    SHIP_NODE_ACTOR_PRESETS,
    type ShipNodeActorPresetId,
} from '../../content/presets/ship_node_actors';
import type {
    CrewTraitsByRole,
} from '../../defs/crew_trait';
import {
    SPACE_NODE_ACTOR_KIND,
    type ShipSpaceNodeActorState,
} from '../../defs/universe';
import ShipFactory from '../ship/ShipFactory';

export type CreateShipNodeActorInput = {
    // Runtime id конкретного корабля внутри ноды.
    id: string;

    presetId: ShipNodeActorPresetId;

    anchorId: string;
};

// Собирает свежий persistent state корабля,
// который затем копируется в runtime encounter.
export default class ShipNodeActorFactory {
    public static create({
        id,
        presetId,
        anchorId,
    }: CreateShipNodeActorInput): ShipSpaceNodeActorState {
        const actorPreset =
            SHIP_NODE_ACTOR_PRESETS[presetId];

        const ship = ShipFactory.create({
            presetId: actorPreset.shipPresetId,
        });

        const crew: ShipCrewPreset =
            SHIP_CREW_PRESETS[
                actorPreset.crewPresetId
            ];

        const crewTraitsByRole:
            CrewTraitsByRole = {};

        for (const role of crew.roles) {
            crewTraitsByRole[role] = [
                ...(
                    crew
                        .traitsByRole[
                            role
                        ] ??
                    []
                ),
            ];
        }

        const behavior =
            SHIP_BEHAVIOR_PRESETS[
                actorPreset.behaviorPresetId
            ];

        return {
            id,
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team: actorPreset.team,

            chassisId: ship.chassisId,
            anchorId,

            hull: ship.hull,
            maxHull: ship.maxHull,

            drive: ship.drive,
            shieldGenerator:
                ship.shieldGenerator,

            behavior: {
                offensiveTaskDelayMs:
                    behavior
                        .offensiveTaskDelayMs,
            },

            crewRoles: [
                ...crew.roles,
            ],

            crewTraitsByRole,

            weapons: ship.weapons,
        };
    }
}
