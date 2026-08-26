// src\app\scenes\game\bridge\view\bridge_viewscreen_layout.ts

// Full polygon opening bounds. Used for the space layer so the bevelled
// corners never expose empty canvas; the bridge interior masks the overflow.
export const BRIDGE_VIEWSCREEN_RECT = {
    x: 232,
    y: 74,
    width: 817,
    height: 287,
} as const;

// Largest axis-aligned rectangle fully inside the polygon opening.
// Normalized encounter coordinates map here so edge objects remain visible.
export const BRIDGE_VIEWSCREEN_CONTENT_RECT = {
    x: 253,
    y: 74,
    width: 775,
    height: 287,
} as const;

export function getBridgeViewscreenPoint(position: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        BRIDGE_VIEWSCREEN_CONTENT_RECT.x + (position.x + 1) * 0.5 * BRIDGE_VIEWSCREEN_CONTENT_RECT.width,
        BRIDGE_VIEWSCREEN_CONTENT_RECT.y + (position.y + 1) * 0.5 * BRIDGE_VIEWSCREEN_CONTENT_RECT.height,
    );
}
