// src/app/scenes/game/bridge/view/barks/bubble/BridgeOfficerBarkBubbleView.ts

import {
    SPEECH_BUBBLE_SPRITE_ID,
    SPEECH_BUBBLE_SPRITES,
    type SpeechBubbleSpriteId,
} from "../../../../../../manifests/ui/speech_bubble";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../theme/font";
import type BridgeScene from "../../../BridgeScene";
import { UI_EVENT } from "../../ui/ui_event";
import { BRIDGE_OFFICER_BARK_LAYOUT, OFFICER_BARK_SIDE, type OfficerBarkSide } from "../bridge_officer_bark_layout";

const TILE_SIZE = 8;
const CORNER_SIZE = 16;

// Leaf-view officer bark bubble.
// Рисует bubble body, tail, text и эмитит click, но не управляет очередью/таймерами.
export default class BridgeOfficerBarkBubbleView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly bodyRoot: Phaser.GameObjects.Container;
    private readonly text: Phaser.GameObjects.BitmapText;
    private readonly tail: Phaser.GameObjects.Image;
    private readonly clickArea: Phaser.GameObjects.Rectangle;

    private bodyPieces: Phaser.GameObjects.Image[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0).setVisible(false);
        this.bodyRoot = this.scene.add.container(0, 0);

        this.tail = this.createTail();

        this.text = this.scene.add
            .bitmapText(
                BRIDGE_OFFICER_BARK_LAYOUT.text.x,
                BRIDGE_OFFICER_BARK_LAYOUT.text.y,
                FONT_FAMILY.VGA_8X14,
                "",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.WHITE);

        this.clickArea = this.scene.add
            .rectangle(0, 0, 1, 1, 0x000000, 0)
            .setOrigin(0, 0)
            .on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.root.add([this.bodyRoot, this.tail, this.text, this.clickArea]);
    }

    public destroy(): void {
        this.clickArea.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
        this.root.destroy(true);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public show(text: string, side: OfficerBarkSide): void {
        const normalizedText = text.toUpperCase();

        this.text.setText(normalizedText).setMaxWidth(BRIDGE_OFFICER_BARK_LAYOUT.bubble.maxTextWidth);

        const bounds = this.text.getTextBounds(false).local;

        const width = this.getBubbleWidth(bounds.width);
        const height = this.getBubbleHeight(bounds.height);

        this.renderBody(width, height);
        this.positionTail(width, height, side);
        this.updateClickArea(width, height);

        this.root.setVisible(true);
    }

    public hide(): void {
        this.clickArea.disableInteractive();
        this.root.setVisible(false);
    }

    private renderBody(width: number, height: number): void {
        this.clearBody();

        this.renderCorners(width, height);
        this.renderHorizontalEdges(width, height);
        this.renderVerticalEdges(width, height);
        this.renderCenter(width, height);
    }

    private renderCorners(width: number, height: number): void {
        this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TOP_LEFT, 0, 0);

        this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TOP_RIGHT, width - CORNER_SIZE, 0);

        this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_BOTTOM_LEFT, 0, height - CORNER_SIZE);

        this.addBodyPiece(
            SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_BOTTOM_RIGHT,
            width - CORNER_SIZE,
            height - CORNER_SIZE,
        );
    }

    private renderHorizontalEdges(width: number, height: number): void {
        for (let x = CORNER_SIZE; x < width - CORNER_SIZE; x += TILE_SIZE) {
            this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TOP, x, 0);

            this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_BOTTOM, x, height - CORNER_SIZE);
        }
    }

    private renderVerticalEdges(width: number, height: number): void {
        for (let y = CORNER_SIZE; y < height - CORNER_SIZE; y += TILE_SIZE) {
            this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_LEFT, 0, y);

            this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_RIGHT, width - CORNER_SIZE, y);
        }
    }

    private renderCenter(width: number, height: number): void {
        for (let y = CORNER_SIZE; y < height - CORNER_SIZE; y += TILE_SIZE) {
            for (let x = CORNER_SIZE; x < width - CORNER_SIZE; x += TILE_SIZE) {
                this.addBodyPiece(SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_CENTER, x, y);
            }
        }
    }

    private addBodyPiece(spriteId: SpeechBubbleSpriteId, x: number, y: number): void {
        const sprite = SPEECH_BUBBLE_SPRITES[spriteId];

        const piece = this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);

        this.bodyRoot.add(piece);
        this.bodyPieces.push(piece);
    }

    private clearBody(): void {
        for (const piece of this.bodyPieces) {
            piece.destroy();
        }

        this.bodyPieces = [];
    }

    private createTail(): Phaser.GameObjects.Image {
        const sprite = SPEECH_BUBBLE_SPRITES[SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TAIL_BOTTOM];

        return this.scene.add.image(0, 0, sprite.atlasKey, sprite.frameKey).setOrigin(0.5, 0);
    }

    private positionTail(width: number, height: number, side: OfficerBarkSide): void {
        const tailX =
            side === OFFICER_BARK_SIDE.LEFT
                ? BRIDGE_OFFICER_BARK_LAYOUT.tail.x
                : width - BRIDGE_OFFICER_BARK_LAYOUT.tail.x;

        this.tail
            .setPosition(tailX, height - BRIDGE_OFFICER_BARK_LAYOUT.tail.yFromBottom)
            .setFlipX(side === OFFICER_BARK_SIDE.RIGHT);
    }

    private updateClickArea(width: number, height: number): void {
        this.clickArea
            .setSize(width, height)
            .setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    }

    private getBubbleWidth(textWidth: number): number {
        const rawWidth = textWidth + BRIDGE_OFFICER_BARK_LAYOUT.bubble.paddingX * 2;

        return this.roundUpToTile(Math.max(BRIDGE_OFFICER_BARK_LAYOUT.bubble.minWidth, rawWidth));
    }

    private getBubbleHeight(textHeight: number): number {
        const rawHeight = textHeight + BRIDGE_OFFICER_BARK_LAYOUT.bubble.paddingY * 2;

        return this.roundUpToTile(Math.max(BRIDGE_OFFICER_BARK_LAYOUT.bubble.minHeight, rawHeight));
    }

    private roundUpToTile(value: number): number {
        return (
            Math.ceil(value / BRIDGE_OFFICER_BARK_LAYOUT.bubble.tileStep) * BRIDGE_OFFICER_BARK_LAYOUT.bubble.tileStep
        );
    }

    private handlePointerDown(): void {
        this.root.emit(UI_EVENT.CLICK);
    }
}
