// src/app/scenes/game/bridge/controller/encounter/encounter_objects/BridgeEncounterObjectMapper.ts

import { SHIP_CHASSIS } from '../../../../../../../engine/content/catalogs/ship_chassis';
import {
    ENCOUNTER_ACTOR_KIND,
    type EncounterActorState,
} from '../../../../../../../engine/encounter/actors/encounter_actor';
import {
    ENCOUNTER_ANCHOR_KIND,
    type EncounterAnchorState,
} from '../../../../../../../engine/encounter/anchors/encounter_anchor';
import type { EncounterState } from '../../../../../../../engine/encounter/model/state';
import { ASTEROID_OBJECT_SPRITES } from '../../../../../../manifests/asteroids/asteroid_sprite';
import { BEACON_OBJECT_SPRITES } from '../../../../../../manifests/beacons/beacon_sprite';
import { JUMP_POINT_OBJECT_SPRITES } from '../../../../../../manifests/jump_points/jump_point_sprite';
import { SHIP_SPRITES } from '../../../../../../manifests/ships/ship_sprite';
import { STATION_OBJECT_SPRITES } from '../../../../../../manifests/stations/station_sprite';
import type { BridgeEncounterObjectPayload } from '../../../events/bridge_event';

const SHIP_ACTOR_POSITION_OFFSET = {
    x: 0.65,
    y: -0.2,
} as const;

const SHIP_ACTOR_PERSPECTIVE_DEPTH = 0.75;

export function mapEncounterStateToBridgeObjectPayloads(state: EncounterState): BridgeEncounterObjectPayload[] {
    return [
        ...state.anchors.map((anchor) => {
            return mapEncounterAnchorToBridgeObjectPayload(anchor);
        }),

        ...state.actors.map((actor) => {
            return mapEncounterActorToBridgeObjectPayload(actor, state);
        }),
    ];
}

export function mapEncounterAnchorToBridgeObjectPayload(anchor: EncounterAnchorState): BridgeEncounterObjectPayload {
    switch (anchor.kind) {
        case ENCOUNTER_ANCHOR_KIND.STATION:
            return {
                id: anchor.id,
                anchorObjectId: anchor.id,

                localPosition: {
                    ...anchor.localPosition,
                },

                perspectiveDepth: anchor.perspectiveDepth,
                sprite: STATION_OBJECT_SPRITES[anchor.station.objectSpriteId],

                position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
            };

        case ENCOUNTER_ANCHOR_KIND.NAVIGATION_BEACON:
            return {
                id: anchor.id,
                anchorObjectId: anchor.id,

                localPosition: {
                    ...anchor.localPosition,
                },

                perspectiveDepth: anchor.perspectiveDepth,
                sprite: BEACON_OBJECT_SPRITES[anchor.beacon.objectSpriteId],

                position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
            };

        case ENCOUNTER_ANCHOR_KIND.ASTEROID:
            return {
                id: anchor.id,
                anchorObjectId: anchor.id,

                localPosition: {
                    ...anchor.localPosition,
                },

                perspectiveDepth: anchor.perspectiveDepth,
                sprite: ASTEROID_OBJECT_SPRITES[anchor.asteroid.objectSpriteId],

                position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
            };

        case ENCOUNTER_ANCHOR_KIND.JUMP_POINT:
            return {
                id: anchor.id,
                anchorObjectId: anchor.id,

                localPosition: {
                    ...anchor.localPosition,
                },

                perspectiveDepth: anchor.perspectiveDepth,
                sprite: JUMP_POINT_OBJECT_SPRITES[anchor.jumpPoint.objectSpriteId],

                position: new Phaser.Math.Vector2(anchor.position.x, anchor.position.y),
            };

        default:
            return assertNeverEncounterAnchor(anchor);
    }
}

function mapEncounterActorToBridgeObjectPayload(
    actor: EncounterActorState,
    state: EncounterState,
): BridgeEncounterObjectPayload {
    const anchor = state.anchors.find((candidate) => {
        return candidate.id === actor.anchorId;
    });

    if (!anchor) {
        throw new Error(`Encounter actor anchor not found: ` + `${actor.id} -> ${actor.anchorId}`);
    }

    switch (actor.kind) {
        case ENCOUNTER_ACTOR_KIND.SHIP: {
            const ship = SHIP_CHASSIS[actor.chassisId];

            return {
                id: actor.id,

                // Actor входит в presentation group
                // anchor, возле которого находится.
                anchorObjectId: actor.anchorId,

                // Travel yaw определяется пространственным
                // положением navigation anchor.
                localPosition: {
                    ...anchor.localPosition,
                },

                perspectiveDepth: SHIP_ACTOR_PERSPECTIVE_DEPTH,
                sprite: SHIP_SPRITES[ship.spriteId],

                position: new Phaser.Math.Vector2(
                    anchor.position.x + SHIP_ACTOR_POSITION_OFFSET.x,
                    anchor.position.y + SHIP_ACTOR_POSITION_OFFSET.y,
                ),
            };
        }

        default:
            throw new Error(`Unhandled encounter actor: ${String(actor)}`);
    }
}

function assertNeverEncounterAnchor(value: never): never {
    throw new Error(`Unhandled encounter anchor: ${String(value)}`);
}
