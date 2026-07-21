// src/app/scenes/game/bridge/controller/encounter/objects/map_encounter_objects_to_bridge_object_payloads.ts

import type { EncounterState } from '../../../../../../../engine/encounter/model/state';
import { ENCOUNTER_OBJECT_KIND } from '../../../../../../../engine/encounter/objects/encounter_object';
import { BEACON_OBJECT_SPRITES } from '../../../../../../manifests/beacons/beacon_sprite';
import { STATION_OBJECT_SPRITES } from '../../../../../../manifests/stations/station_sprite';
import type { BridgeEncounterObjectPayload } from '../../../events/bridge_event';

export function mapEncounterObjectsToBridgeObjectPayloads(state: EncounterState): BridgeEncounterObjectPayload[] {
    return state.objects.map((object) => {
        switch (object.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                return {
                    id: object.id,
                    sprite: STATION_OBJECT_SPRITES[object.station.objectSpriteId],
                    position: new Phaser.Math.Vector2(object.position.x, object.position.y),
                };

            case ENCOUNTER_OBJECT_KIND.NAVIGATION_BEACON:
                return {
                    id: object.id,
                    sprite: BEACON_OBJECT_SPRITES[object.beacon.objectSpriteId],
                    position: new Phaser.Math.Vector2(object.position.x, object.position.y),
                };

            default:
                return assertNever(object);
        }
    });
}

function assertNever(value: never): never {
    throw new Error(`Unhandled encounter object: ${String(value)}`);
}
