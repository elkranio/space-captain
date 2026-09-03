// src\app\manifests\bridge\interior.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const BRIDGE_INTERIOR_ID = {
    INTERIOR: "interior",
} as const;

export type BridgeInteriorId = (typeof BRIDGE_INTERIOR_ID)[keyof typeof BRIDGE_INTERIOR_ID];

export const BRIDGE_INTERIOR_SPRITES = {
    [BRIDGE_INTERIOR_ID.INTERIOR]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/interior/interior",
    },
} satisfies Record<BridgeInteriorId, SpriteEntry>;
