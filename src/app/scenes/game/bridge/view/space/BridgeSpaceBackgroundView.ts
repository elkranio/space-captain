// src/app/scenes/game/bridge/view/space/BridgeSpaceBackgroundView.ts

import { SPACE_BACKGROUND_ID, type SpaceBackgroundId } from "../../../../../../engine/defs/space_background";
import { SPACE_BACKGROUND_SPRITES } from "../../../../../manifests/bridge/space_background";
import type BridgeScene from "../../BridgeScene";
import { BRIDGE_VIEWSCREEN_RECT } from "../bridge_viewscreen_layout";

const PANORAMA_DISPLAY_SCALE = 2;

// Панорамный фон за bridge viewscreen.
//
// Горизонтальное положение панорамы соответствует camera yaw:
//
// 360° = полная ширина панорамы.
// 180° = половина панорамы.
// 90° = четверть панорамы.
export default class BridgeSpaceBackgroundView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly background: Phaser.GameObjects.TileSprite;

    private readonly panoramaPosition = new Phaser.Math.Vector2();

    constructor(scene: BridgeScene) {
        this.root = scene.add.container(0, 0);
        scene.layers.get("space").add(this.root);

        const asset = SPACE_BACKGROUND_SPRITES[SPACE_BACKGROUND_ID.NEBULA_00];

        this.background = scene.add
            .tileSprite(
                BRIDGE_VIEWSCREEN_RECT.x,
                BRIDGE_VIEWSCREEN_RECT.y,
                BRIDGE_VIEWSCREEN_RECT.width,
                BRIDGE_VIEWSCREEN_RECT.height,
                asset.atlasKey,
                asset.frameKey,
            )
            .setOrigin(0, 0);

        this.background.tileScaleX = PANORAMA_DISPLAY_SCALE;

        this.background.tileScaleY = PANORAMA_DISPLAY_SCALE;

        this.root.add(this.background);

        this.centerPanorama();
    }

    public setBackground(backgroundId: SpaceBackgroundId): void {
        const asset = SPACE_BACKGROUND_SPRITES[backgroundId];

        this.background.setTexture(asset.atlasKey, asset.frameKey);

        this.centerPanorama();
    }

    // Positive yaw означает поворот камеры вправо.
    // Tile position увеличивается, поэтому панорама
    // визуально уезжает влево.
    public turnYawBy(yawDeltaDegrees: number): void {
        const panoramaWidth = this.background.frame.cutWidth;

        const textureDelta = (yawDeltaDegrees / 360) * panoramaWidth;

        this.panoramaPosition.x = wrap(
            this.panoramaPosition.x + textureDelta,

            panoramaWidth,
        );

        this.applyPanoramaPosition();
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private centerPanorama(): void {
        const visibleTextureWidth = BRIDGE_VIEWSCREEN_RECT.width / PANORAMA_DISPLAY_SCALE;

        const visibleTextureHeight = BRIDGE_VIEWSCREEN_RECT.height / PANORAMA_DISPLAY_SCALE;

        const frameWidth = this.background.frame.cutWidth;

        const frameHeight = this.background.frame.cutHeight;

        this.panoramaPosition.set(
            Math.max(0, (frameWidth - visibleTextureWidth) / 2),

            Math.max(0, (frameHeight - visibleTextureHeight) / 2),
        );

        this.applyPanoramaPosition();
    }

    private applyPanoramaPosition(): void {
        this.background.tilePositionX = Math.round(this.panoramaPosition.x);

        this.background.tilePositionY = Math.round(this.panoramaPosition.y);
    }
}

function wrap(value: number, size: number): number {
    if (size <= 0) {
        return 0;
    }

    return ((value % size) + size) % size;
}
