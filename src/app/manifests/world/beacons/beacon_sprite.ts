// src/app/manifests/world/beacons/beacon_sprite.ts
import { BEACON_OBJECT_SPRITE_ID, type BeaconObjectSpriteId } from "../../../../engine/defs/beacon";
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../../types";

export const BEACON_OBJECT_SPRITES = {
    [BEACON_OBJECT_SPRITE_ID.NAVIGATION_BEACON]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "world/beacons/navigation_beacon",
    },
} satisfies Record<BeaconObjectSpriteId, SpriteEntry>;
