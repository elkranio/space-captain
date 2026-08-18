// src/app/scenes/game/bridge/view/combat/beam_cannon_beams/bridge_beam_cannon_target_anchors.ts

import { BRIDGE_VIEWSCREEN_RECT } from "../../bridge_viewscreen_layout";
import { BRIDGE_PLAYER_HULL_COMBAT_POINTS } from "../bridge_player_hull_combat_points";

// Presentation-only Beam endpoint vocabulary.
//
// This is intentionally smaller than the future semantic ship-target model.
// Later gameplay may map BRIDGE / HULL / concrete ship nodes onto these or
// additional presentation anchors without deriving gameplay meaning from pixels.
export const BRIDGE_BEAM_CANNON_TARGET_ANCHOR = {
    HULL_BOTTOM: "hull_bottom",

    MISS_TOP_LEFT: "miss_top_left",

    MISS_TOP_RIGHT: "miss_top_right",

    MISS_BOTTOM_LEFT: "miss_bottom_left",

    MISS_BOTTOM_RIGHT: "miss_bottom_right",
} as const;

export type BridgeBeamCannonTargetAnchor =
    (typeof BRIDGE_BEAM_CANNON_TARGET_ANCHOR)[keyof typeof BRIDGE_BEAM_CANNON_TARGET_ANCHOR];

export const BRIDGE_BEAM_CANNON_MISS_ANCHORS = [
    BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_TOP_LEFT,

    BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_TOP_RIGHT,

    BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_BOTTOM_LEFT,

    BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_BOTTOM_RIGHT,
] as const satisfies readonly BridgeBeamCannonTargetAnchor[];

const MISS_OVERFLOW_X_PX = 28;

const MISS_OVERFLOW_Y_PX = 24;

const VIEWSCREEN_RIGHT_X = BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width;

const VIEWSCREEN_BOTTOM_Y = BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height;

const TARGET_POINTS = {
    [BRIDGE_BEAM_CANNON_TARGET_ANCHOR.HULL_BOTTOM]: BRIDGE_PLAYER_HULL_COMBAT_POINTS.hullImpactPoint,

    // Miss endpoints sit just outside the full polygon opening.
    // The bridge interior occludes the final segment, so the beam reads as
    // continuing past the ship / out through a corner instead of stopping in
    // empty space inside the viewscreen.
    [BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_TOP_LEFT]: {
        x: BRIDGE_VIEWSCREEN_RECT.x - MISS_OVERFLOW_X_PX,

        y: BRIDGE_VIEWSCREEN_RECT.y - MISS_OVERFLOW_Y_PX,
    },

    [BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_TOP_RIGHT]: {
        x: VIEWSCREEN_RIGHT_X + MISS_OVERFLOW_X_PX,

        y: BRIDGE_VIEWSCREEN_RECT.y - MISS_OVERFLOW_Y_PX,
    },

    [BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_BOTTOM_LEFT]: {
        x: BRIDGE_VIEWSCREEN_RECT.x - MISS_OVERFLOW_X_PX,

        y: VIEWSCREEN_BOTTOM_Y + MISS_OVERFLOW_Y_PX,
    },

    [BRIDGE_BEAM_CANNON_TARGET_ANCHOR.MISS_BOTTOM_RIGHT]: {
        x: VIEWSCREEN_RIGHT_X + MISS_OVERFLOW_X_PX,

        y: VIEWSCREEN_BOTTOM_Y + MISS_OVERFLOW_Y_PX,
    },
} as const satisfies Record<
    BridgeBeamCannonTargetAnchor,
    {
        readonly x: number;
        readonly y: number;
    }
>;

export function getBridgeBeamCannonTargetPoint(anchor: BridgeBeamCannonTargetAnchor): {
    readonly x: number;
    readonly y: number;
} {
    return TARGET_POINTS[anchor];
}
