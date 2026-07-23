// src/app/scenes/game/overlay/view/LocalSpacePanelView.ts

import { LOCAL_SPACE_PANEL_SPRITE_ID, LOCAL_SPACE_PANEL_SPRITES } from '../../../../manifests/ui/local_space_panel';
import { UI_BUTTON_SPRITE_ID, UI_BUTTON_SPRITES } from '../../../../manifests/ui/button';
import type GameOverlayEventBus from '../events/GameOverlayEventBus';
import { GAME_OVERLAY_EVENT } from '../events/game_overlay_event';
import type GameOverlayScene from '../GameOverlayScene';

const PANEL_WIDTH = 368;

const TOP_HEIGHT = 48;
const MIDDLE_HEIGHT = 80;
const BOTTOM_HEIGHT = 44;

const PANEL_HEIGHT = TOP_HEIGHT + MIDDLE_HEIGHT + BOTTOM_HEIGHT;

const CLOSE_BUTTON_HIT_AREA_X = -8;
const CLOSE_BUTTON_HIT_AREA_Y = -9;
const CLOSE_BUTTON_HIT_AREA_WIDTH = 36;
const CLOSE_BUTTON_HIT_AREA_HEIGHT = 35;

const ROW_X = 32;
const FIRST_ROW_Y = 59;
const ROW_GAP = 23;

const MOCK_ROWS = ['> GENERIC STATION', '  NAVIGATION BEACON', '  ASTEROID'] as const;

// Read-only LOCAL SPACE modal.
//
// Пока использует mock rows.
// Runtime query и настоящий presentation payload добавим следующим атомом.
export default class LocalSpacePanelView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly closeButtonImage: Phaser.GameObjects.Image;

    constructor(
        private readonly scene: GameOverlayScene,
        private readonly eventBus: GameOverlayEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.add('ui', this.root);

        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;

        const panelX = Math.floor((screenWidth - PANEL_WIDTH) / 2);
        const panelY = Math.floor((screenHeight - PANEL_HEIGHT) / 2);

        const inputBlocker = this.scene.add
            .rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.001)
            .setOrigin(0, 0)
            .setInteractive();

        const topSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.TOP];
        const middleSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.MIDDLE];
        const bottomSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.BOTTOM];

        const topImage = this.scene.add.image(panelX, panelY, topSprite.atlasKey, topSprite.frameKey).setOrigin(0, 0);

        const middleImage = this.scene.add
            .tileSprite(
                panelX,
                panelY + TOP_HEIGHT,
                PANEL_WIDTH,
                MIDDLE_HEIGHT,
                middleSprite.atlasKey,
                middleSprite.frameKey,
            )
            .setOrigin(0, 0);

        const bottomImage = this.scene.add
            .image(panelX, panelY + TOP_HEIGHT + MIDDLE_HEIGHT, bottomSprite.atlasKey, bottomSprite.frameKey)
            .setOrigin(0, 0);

        this.root.add([inputBlocker, topImage, middleImage, bottomImage]);

        MOCK_ROWS.forEach((row, index) => {
            const rowText = this.scene.add
                .bitmapText(panelX + ROW_X, panelY + FIRST_ROW_Y + index * ROW_GAP, 'vga_8x14', row, 14)
                .setOrigin(0, 0)
                .setTint(0xe8dfbf);

            this.root.add(rowText);
        });

        const closeButtonSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.CLOSE_00];

        this.closeButtonImage = this.scene.add
            .image(panelX + PANEL_WIDTH - 42, panelY + 19, closeButtonSprite.atlasKey, closeButtonSprite.frameKey)
            .setOrigin(0.5)
            .setInteractive({
                hitArea: new Phaser.Geom.Rectangle(
                    CLOSE_BUTTON_HIT_AREA_X,
                    CLOSE_BUTTON_HIT_AREA_Y,
                    CLOSE_BUTTON_HIT_AREA_WIDTH,
                    CLOSE_BUTTON_HIT_AREA_HEIGHT,
                ),
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true,
            });

        this.closeButtonImage.on(Phaser.Input.Events.POINTER_UP, this.handleClosePointerUp, this);

        this.root.add(this.closeButtonImage);

        this.hide();
    }

    public show(): void {
        this.root.setVisible(true);
        this.root.setActive(true);
    }

    public hide(): void {
        this.root.setVisible(false);
        this.root.setActive(false);
    }

    public destroy(): void {
        this.closeButtonImage.off(Phaser.Input.Events.POINTER_UP, this.handleClosePointerUp, this);

        this.root.destroy(true);
    }

    private handleClosePointerUp(): void {
        this.eventBus.emit(GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED);
    }
}
