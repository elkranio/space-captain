import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const BRIDGE_THREAT_ICON_ID = {
    MISSILE_INCOMING: "missile_incoming",
} as const;

export type BridgeThreatIconId =
    (typeof BRIDGE_THREAT_ICON_ID)[keyof typeof BRIDGE_THREAT_ICON_ID];

export const BRIDGE_THREAT_ICONS = {
    [BRIDGE_THREAT_ICON_ID.MISSILE_INCOMING]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "icons/threats/incoming_missile",
    },
} satisfies Record<BridgeThreatIconId, SpriteEntry>;
