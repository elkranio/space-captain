// Enemy equipment state, target selection and the active task's target lock.
import { MICRO_ICON_ID, MICRO_ICONS } from "../../../../../../../manifests/micro_icons";
import type { SpriteEntry } from "../../../../../../../manifests/types";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import type { BridgeEnemyEquipmentDashboardPayload } from "../../../../events/bridge_event";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentHoverActionView from "../../BridgeEquipmentHoverActionView";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;
const PROGRESS_LINE_HEIGHT = 3;
const BROKEN_CONTENT_ALPHA = 0.4;

export default class BridgeEnemyEquipmentTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly brokenLine: Phaser.GameObjects.Rectangle;

    private readonly integrityView: BridgeEquipmentIntegrityView;
    private readonly targetOutline: BridgeEquipmentSlotChromeView;
    private readonly hoverView: BridgeEquipmentHoverActionView;
    private readonly hitArea: Phaser.GameObjects.Zone;
    private readonly targetLock: Phaser.GameObjects.Image;
    private readonly targetLockTween: Phaser.Tweens.Tween;
    private targetLocked = false;
    private slotId?: string;
    private selectionEnabled = false;
    private pointerOver = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        sprite: SpriteEntry,
        private readonly onTargetSelected: (slotId: string) => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        const divider = this.scene.add
            .rectangle(
                TILE.horizontalPadding,
                TILE.dividerY,
                this.width - TILE.horizontalPadding * 2,
                TILE.dividerHeight,
                CAPTAIN_DASHBOARD_STYLE.equipmentAccent.iconColor,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.borderAlpha,
            )
            .setOrigin(0, 0);

        this.brokenLine = this.scene.add
            .rectangle(
                TILE.horizontalPadding,
                TILE.dividerY - PROGRESS_LINE_HEIGHT,
                this.width - TILE.horizontalPadding * 2,
                PROGRESS_LINE_HEIGHT,
                CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        this.icon = this.scene.add
            .image(
                Math.round(this.width / 2) - 1,
                Math.round(this.height / 2) + TILE.iconCenterOffsetY,
                sprite.atlasKey,
                sprite.frameKey,
            )
            .setFlipX(true);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(
            0,
            TILE.statusY + TILE.integrityOffsetY,
        );
        this.integrityView.setRightEdge(this.width - TILE.integrityRightPadding);

        this.targetOutline = new BridgeEquipmentSlotChromeView(scene, width, height, "highlight");
        this.targetOutline.setVisible(false);
        this.hoverView = new BridgeEquipmentHoverActionView(scene, width, height);
        this.hoverView.setAction("G", OFFICER_ROLE_COLOR.gunner, "FIRE");
        const lockSprite = MICRO_ICONS[MICRO_ICON_ID.TARGET_LOCK];
        this.targetLock = scene.add.image(width - TILE.horizontalPadding, TILE.titleY + 2,
            lockSprite.atlasKey, lockSprite.frameKey)
            .setOrigin(1, 0).setTint(CAPTAIN_DASHBOARD_STYLE.equipmentAccent.iconColor).setVisible(false);
        this.targetLockTween = scene.tweens.add({
            targets: this.targetLock, alpha: { from: 1, to: 0.45 },
            duration: 650, yoyo: true, repeat: -1, paused: true,
        });
        this.hitArea = scene.add.zone(0, 0, width, height).setOrigin(0, 0)
            .on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this)
            .on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this)
            .on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);

        this.root.add([
            divider,
            this.brokenLine,
            this.icon,
            this.integrityView.getRoot(),
            this.targetOutline.getRoot(),
            this.hoverView.getRoot(),
            this.targetLock,
            this.hitArea,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setTargetSelectionEnabled(enabled: boolean): void {
        if (this.selectionEnabled === enabled) {
            return;
        }

        this.selectionEnabled = enabled;
        this.pointerOver = false;
        if (enabled) {
            this.hitArea.setInteractive({ useHandCursor: true });
        } else {
            this.hitArea.disableInteractive();
        }
        this.renderTargetSelection();
    }

    public setTargetPulse(alpha: number): void {
        this.targetOutline.getRoot().setAlpha(alpha);
    }

    private handlePointerUp(): void {
        if (this.selectionEnabled && this.slotId) this.onTargetSelected(this.slotId);
    }

    private handlePointerOver(): void {
        this.pointerOver = true;
        this.renderTargetSelection();
    }

    private handlePointerOut(): void {
        this.pointerOver = false;
        this.renderTargetSelection();
    }

    private renderTargetSelection(): void {
        const hovered = this.selectionEnabled && this.pointerOver;
        this.hoverView.setVisible(hovered);
        this.targetOutline.setVisible(this.selectionEnabled && !hovered);
    }

    public update(payload: BridgeEnemyEquipmentDashboardPayload): void {
        this.slotId = payload.slotId;
        if (this.targetLocked !== payload.targetLocked) {
            this.targetLocked = payload.targetLocked;
            this.targetLock.setVisible(this.targetLocked).setAlpha(1);
            if (this.targetLocked) this.targetLockTween.restart();
            else this.targetLockTween.pause();
        }
        this.icon
            .setTexture(payload.sprite.atlasKey, payload.sprite.frameKey)
            .setAlpha(payload.broken ? BROKEN_CONTENT_ALPHA : 1);

        this.brokenLine.setVisible(payload.broken);

        this.integrityView.update(
            payload.integrity.current,
            payload.integrity.max,
            payload.broken,
        );
    }

    public destroy(): void {
        this.targetLockTween.remove();
        this.root.destroy(true);
    }
}
