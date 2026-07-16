// src/app/scenes/game/bridge/controller/encounter/objects/map_encounter_objects_to_bridge_object_payloads.ts

import type { EncounterState } from '../../../../../../../engine/encounter/model/state';
import { ENCOUNTER_OBJECT_KIND } from '../../../../../../../engine/encounter/objects/encounter_object';
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
        }
    });
}
