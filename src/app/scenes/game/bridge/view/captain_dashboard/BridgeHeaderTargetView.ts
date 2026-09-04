import { MICRO_ICON_ID, MICRO_ICONS } from "../../../../../manifests/micro_icons";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../theme/officer";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgeHeaderTargetChromeView, {
    type BridgeHeaderTargetEdge,
} from "./BridgeHeaderTargetChromeView";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;
const TARGET_LOCK_INSET = 7;

// Presentation-only target region for HULL / BRIDGE header targets.
// Selection input is intentionally not committed here yet; the next gameplay atom wires clicks.
export default class BridgeHeaderTargetView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly outline: BridgeHeaderTargetChromeView;

    private readonly hoverBackground: Phaser.GameObjects.Rectangle;

    private readonly roleText: Phaser.GameObjects.BitmapText;

    private readonly actionText: Phaser.GameObjects.BitmapText;

    private readonly targetLock: Phaser.GameObjects.Image;

    private readonly targetLockTween: Phaser.Tweens.Tween;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private selectionEnabled = false;

    private pointerOver = false;

    private pulseAlpha = 1;

    private targetLocked = false;

    constructor(
        private readonly scene: BridgeScene,
        outerEdge: BridgeHeaderTargetEdge,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.outline = new BridgeHeaderTargetChromeView(this.scene, outerEdge);

        this.hoverBackground = this.scene.add
            .rectangle(
                0,
                0,
                1,
                TILE.hoverHeaderHeight,
                FONT_COLOR.PRIMARY,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.hoverHeaderAlpha,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        this.roleText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "G",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(OFFICER_ROLE_COLOR.gunner)
            .setVisible(false);

        this.actionText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding + this.roleText.width + TILE.hoverTextGap,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "FIRE",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY)
            .setVisible(false);

        const lockSprite = MICRO_ICONS[MICRO_ICON_ID.TARGET_LOCK];
        this.targetLock = this.scene.add
            .image(
                0,
                TILE.titleY + 2,
                lockSprite.atlasKey,
                lockSprite.frameKey,
            )
            .setOrigin(1, 0)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentAccent.iconColor)
            .setVisible(false);

        this.targetLockTween = this.scene.tweens.add({
            targets: this.targetLock,
            alpha: { from: 1, to: 0.45 },
            duration: 650,
            yoyo: true,
            repeat: -1,
            paused: true,
        });

        this.hitArea = this.scene.add
            .zone(0, 0, 1, 1)
            .setOrigin(0, 0)
            .on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this)
            .on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);

        this.root.add([
            this.hoverBackground,
            this.roleText,
            this.actionText,
            this.outline.getRoot(),
            this.targetLock,
            this.hitArea,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setBounds(x: number, y: number, width: number, height: number): void {
        this.root.setPosition(x, y);
        this.outline.setBounds(0, 0, width, height);
        this.hoverBackground.setSize(width, TILE.hoverHeaderHeight);
        this.targetLock.setX(width - TARGET_LOCK_INSET);
        this.hitArea.setSize(width, height);
    }

    public setSelectionEnabled(enabled: boolean): void {
        if (this.selectionEnabled === enabled) {
            return;
        }

        this.selectionEnabled = enabled;
        this.pointerOver = false;

        if (enabled) {
            this.hitArea.setInteractive();
        } else {
            this.hitArea.disableInteractive();
        }

        this.render();
    }

    public setPulseAlpha(alpha: number): void {
        this.pulseAlpha = alpha;
        this.render();
    }

    public setTargetLocked(locked: boolean): void {
        if (this.targetLocked === locked) {
            return;
        }

        this.targetLocked = locked;
        this.targetLock.setVisible(locked).setAlpha(1);

        if (locked) {
            this.targetLockTween.restart();
        } else {
            this.targetLockTween.pause();
        }
    }

    public destroy(): void {
        this.targetLockTween.remove();
        this.outline.destroy();
        this.root.destroy(true);
    }

    private handlePointerOver(): void {
        this.pointerOver = true;
        this.render();
    }

    private handlePointerOut(): void {
        this.pointerOver = false;
        this.render();
    }

    private render(): void {
        const hovered = this.selectionEnabled && this.pointerOver;

        this.outline.setVisible(this.selectionEnabled);
        this.outline.setAlpha(hovered ? 1 : this.pulseAlpha);
        this.hoverBackground.setVisible(hovered);
        this.roleText.setVisible(hovered);
        this.actionText.setVisible(hovered);
    }
}
