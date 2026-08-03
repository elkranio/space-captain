// src\app\scenes\game\bridge\view\bridge_viewscreen_layout.ts

export const BRIDGE_VIEWSCREEN_RECT = {
    x: 225,
    y: 38,
    width: 829,
    height: 258,
} as const;

export function getBridgeViewscreenPoint(position: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        BRIDGE_VIEWSCREEN_RECT.x + (position.x + 1) * 0.5 * BRIDGE_VIEWSCREEN_RECT.width,
        BRIDGE_VIEWSCREEN_RECT.y + (position.y + 1) * 0.5 * BRIDGE_VIEWSCREEN_RECT.height,
    );
}
