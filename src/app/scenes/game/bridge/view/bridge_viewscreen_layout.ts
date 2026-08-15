// src\app\scenes\game\bridge\view\bridge_viewscreen_layout.ts

// Full polygon opening bounds. Used for the space layer so the bevelled
// corners never expose empty canvas; the bridge interior masks the overflow.
export const BRIDGE_VIEWSCREEN_RECT = {
    x: 182,
    y: 59,
    width: 919,
    height: 308,
} as const;

// Largest axis-aligned rectangle fully inside the polygon opening.
// Normalized encounter coordinates map here so edge objects remain visible.
export const BRIDGE_VIEWSCREEN_CONTENT_RECT = {
    x: 254,
    y: 82,
    width: 772,
    height: 270,
} as const;

export function getBridgeViewscreenPoint(
    position: Phaser.Math.Vector2,
): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        BRIDGE_VIEWSCREEN_CONTENT_RECT.x +
            (position.x + 1) *
                0.5 *
                BRIDGE_VIEWSCREEN_CONTENT_RECT.width,
        BRIDGE_VIEWSCREEN_CONTENT_RECT.y +
            (position.y + 1) *
                0.5 *
                BRIDGE_VIEWSCREEN_CONTENT_RECT.height,
    );
}
