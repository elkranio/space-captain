// src/app/scenes/game/bridge/view/space/BridgeSpaceBackgroundView.ts

import { SPACE_BACKGROUND_ID, type SpaceBackgroundId } from '../../../../../../engine/defs/space_background';
import { SPACE_BACKGROUND_SPRITES } from '../../../../../manifests/bridge/space_background';
import type BridgeScene from '../../BridgeScene';
import { BRIDGE_VIEWSCREEN_RECT } from '../bridge_viewscreen_layout';

const PANORAMA_DISPLAY_SCALE = 2;

// Панорамный фон за bridge viewscreen.
//
// TileSprite:
// - сам обрезает изображение по размеру viewscreen;
// - горизонтально зацикливает панораму;
// - позволяет менять направление взгляда через tilePosition.
//
// Вертикальное движение ограничено границами исходного изображения,
// поскольку верх и низ панорамы не предназначены для зацикливания.
export default class BridgeSpaceBackgroundView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly background: Phaser.GameObjects.TileSprite;

    private readonly panoramaPosition = new Phaser.Math.Vector2();

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('space').add(this.root);

        const asset = SPACE_BACKGROUND_SPRITES[SPACE_BACKGROUND_ID.NEBULA_00];

        this.background = this.scene.add
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

    // screenX / screenY означают желаемое визуальное смещение фона
    // в координатах bridge viewscreen.
    public panBy(screenX: number, screenY: number): void {
        // Рост tilePosition двигает изображение в обратную сторону,
        // поэтому применяем отрицательный visual delta.
        this.panoramaPosition.x -= screenX / PANORAMA_DISPLAY_SCALE;

        this.panoramaPosition.y = Phaser.Math.Clamp(
            this.panoramaPosition.y - screenY / PANORAMA_DISPLAY_SCALE,
            0,
            this.getMaximumVerticalPosition(),
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

    private getMaximumVerticalPosition(): number {
        const visibleTextureHeight = BRIDGE_VIEWSCREEN_RECT.height / PANORAMA_DISPLAY_SCALE;

        return Math.max(0, this.background.frame.cutHeight - visibleTextureHeight);
    }

    private applyPanoramaPosition(): void {
        // Background обновляется теми же дискретными кадрами,
        // что и object animations.
        this.background.tilePositionX = Math.round(this.panoramaPosition.x);

        this.background.tilePositionY = Math.round(this.panoramaPosition.y);
    }
}
