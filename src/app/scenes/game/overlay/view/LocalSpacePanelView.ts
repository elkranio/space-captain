// src/app/scenes/game/overlay/view/LocalSpacePanelView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../theme/font';
import { LOCAL_SPACE_PANEL_SPRITE_ID, LOCAL_SPACE_PANEL_SPRITES } from '../../../../manifests/ui/local_space_panel';
import { UI_BUTTON_SPRITE_ID, UI_BUTTON_SPRITES } from '../../../../manifests/ui/button';
import type GameOverlayEventBus from '../events/GameOverlayEventBus';
import { GAME_OVERLAY_EVENT } from '../events/game_overlay_event';
import type GameOverlayScene from '../GameOverlayScene';

const PANEL_WIDTH = 368;

const TOP_HEIGHT = 48;
const MIN_MIDDLE_HEIGHT = 80;
const BOTTOM_HEIGHT = 44;

const CLOSE_BUTTON_HIT_AREA_X = -8;
const CLOSE_BUTTON_HIT_AREA_Y = -9;
const CLOSE_BUTTON_HIT_AREA_WIDTH = 36;
const CLOSE_BUTTON_HIT_AREA_HEIGHT = 35;

const ROW_X = 32;
const FIRST_ROW_Y = 59;
const ROW_GAP = 24;
const ROW_TEXT_HEIGHT = 16;
const ROW_BOTTOM_PADDING = 5;

export type LocalSpacePanelRow = {
    objectId: string;
    label: string;
    isCurrent: boolean;
};

// Read-only LOCAL SPACE panel.
//
// Получает готовые presentation rows:
// view не знает о SpaceAnchorState и не собирает названия объектов.
//
// Input перехватывается только внутри самой панели.
// Остальная часть игровой сцены остаётся интерактивной.
export default class LocalSpacePanelView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly panelInputArea: Phaser.GameObjects.Rectangle;
    private readonly panelInputHitArea: Phaser.Geom.Rectangle;

    private readonly middleImage: Phaser.GameObjects.TileSprite;
    private readonly bottomImage: Phaser.GameObjects.Image;

    private readonly closeButtonImage: Phaser.GameObjects.Image;

    private readonly rowTexts: Phaser.GameObjects.BitmapText[] = [];

    constructor(
        private readonly scene: GameOverlayScene,
        private readonly eventBus: GameOverlayEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.add('ui', this.root);

        const initialPanelHeight = this.getPanelHeight(MIN_MIDDLE_HEIGHT);

        this.panelInputHitArea = new Phaser.Geom.Rectangle(0, 0, PANEL_WIDTH, initialPanelHeight);

        this.panelInputArea = this.scene.add
            .rectangle(0, 0, PANEL_WIDTH, initialPanelHeight, 0x000000, 0.001)
            .setOrigin(0, 0)
            .setInteractive({
                hitArea: this.panelInputHitArea,
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            });

        const topSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.TOP];
        const middleSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.MIDDLE];
        const bottomSprite = LOCAL_SPACE_PANEL_SPRITES[LOCAL_SPACE_PANEL_SPRITE_ID.BOTTOM];

        const topImage = this.scene.add.image(0, 0, topSprite.atlasKey, topSprite.frameKey).setOrigin(0, 0);

        this.middleImage = this.scene.add
            .tileSprite(0, TOP_HEIGHT, PANEL_WIDTH, MIN_MIDDLE_HEIGHT, middleSprite.atlasKey, middleSprite.frameKey)
            .setOrigin(0, 0);

        this.bottomImage = this.scene.add
            .image(0, TOP_HEIGHT + MIN_MIDDLE_HEIGHT, bottomSprite.atlasKey, bottomSprite.frameKey)
            .setOrigin(0, 0);

        this.root.add([this.panelInputArea, topImage, this.middleImage, this.bottomImage]);

        const closeButtonSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.CLOSE_00];

        this.closeButtonImage = this.scene.add
            .image(PANEL_WIDTH - 42, 19, closeButtonSprite.atlasKey, closeButtonSprite.frameKey)
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

        this.updateLayout(0);
        this.hide();
    }

    public show(rows: readonly LocalSpacePanelRow[]): void {
        this.setRows(rows);

        this.root.setVisible(true);
        this.root.setActive(true);
    }

    public hide(): void {
        this.root.setVisible(false);
        this.root.setActive(false);
    }

    public isVisible(): boolean {
        return this.root.visible;
    }

    public setRows(rows: readonly LocalSpacePanelRow[]): void {
        this.updateLayout(rows.length);
        this.renderRows(rows);
    }

    public destroy(): void {
        this.closeButtonImage.off(Phaser.Input.Events.POINTER_UP, this.handleClosePointerUp, this);

        this.clearRows();
        this.root.destroy(true);
    }

    private updateLayout(rowCount: number): void {
        const middleHeight = this.getMiddleHeight(rowCount);
        const panelHeight = this.getPanelHeight(middleHeight);

        this.root.setPosition(this.getPanelX(), this.getPanelY(panelHeight));

        this.panelInputArea.setSize(PANEL_WIDTH, panelHeight);
        this.panelInputHitArea.setSize(PANEL_WIDTH, panelHeight);

        this.middleImage.setSize(PANEL_WIDTH, middleHeight);
        this.bottomImage.setPosition(0, TOP_HEIGHT + middleHeight);
    }

    private renderRows(rows: readonly LocalSpacePanelRow[]): void {
        this.clearRows();

        rows.forEach((row, index) => {
            const marker = row.isCurrent ? '> ' : '  ';
            const text = `${marker}${row.label.toUpperCase()}`;

            const rowText = this.scene.add
                .bitmapText(ROW_X, FIRST_ROW_Y + index * ROW_GAP, FONT_FAMILY.VGA_8X14, text, FONT_SIZE.PX_16)
                .setOrigin(0, 0)
                .setTint(row.isCurrent ? FONT_COLOR.LOCAL_SPACE_CURRENT_OBJECT : FONT_COLOR.LOCAL_SPACE_OBJECT);

            this.root.add(rowText);
            this.rowTexts.push(rowText);
        });
    }

    private clearRows(): void {
        for (const rowText of this.rowTexts) {
            rowText.destroy();
        }

        this.rowTexts.length = 0;
    }

    private getMiddleHeight(rowCount: number): number {
        if (rowCount === 0) {
            return MIN_MIDDLE_HEIGHT;
        }

        const lastRowBottom = FIRST_ROW_Y + (rowCount - 1) * ROW_GAP + ROW_TEXT_HEIGHT;
        const requiredMiddleHeight = lastRowBottom + ROW_BOTTOM_PADDING - TOP_HEIGHT;

        return Math.max(MIN_MIDDLE_HEIGHT, requiredMiddleHeight);
    }

    private getPanelHeight(middleHeight: number): number {
        return TOP_HEIGHT + middleHeight + BOTTOM_HEIGHT;
    }

    private getPanelX(): number {
        return Math.floor((this.scene.scale.width - PANEL_WIDTH) / 2);
    }

    private getPanelY(panelHeight: number): number {
        return Math.floor((this.scene.scale.height - panelHeight) / 2);
    }

    private handleClosePointerUp(): void {
        this.eventBus.emit(GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED);
    }
}
