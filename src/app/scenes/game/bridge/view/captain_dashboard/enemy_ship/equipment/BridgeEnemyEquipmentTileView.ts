// Enemy equipment state and pre-command target hover. Firing is wired in the next targeting atom.
import type { SpriteEntry } from "../../../../../../../manifests/types";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import type { BridgeEnemyEquipmentDashboardPayload } from "../../../../events/bridge_event";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentHoverActionView from "../../BridgeEquipmentHoverActionView";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,
    titleY: 3,

    integrityY: 72,
    stateBottomPadding: 10,
} as const;

export default class BridgeEnemyEquipmentTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly stateText: Phaser.GameObjects.BitmapText;

    private readonly integrityView: BridgeEquipmentIntegrityView;
    private readonly targetOutline: BridgeEquipmentSlotChromeView;
    private readonly hoverView: BridgeEquipmentHoverActionView;
    private readonly hitArea: Phaser.GameObjects.Zone;
    private selectionEnabled = false;
    private pointerOver = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        sprite: SpriteEntry,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.titleText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.icon = this.scene.add
            .image(
                Math.round(this.width / 2),
                Math.round(this.height / 2) + 1,
                sprite.atlasKey,
                sprite.frameKey,
            )
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setFlipX(true);

        this.stateText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                this.height - TILE.stateBottomPadding - FONT_SIZE.PX_16,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(0, TILE.integrityY);
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.targetOutline = new BridgeEquipmentSlotChromeView(scene, width, height, "highlight");
        this.targetOutline.setVisible(false);
        this.hoverView = new BridgeEquipmentHoverActionView(scene, width, height);
        this.hoverView.setAction("G", OFFICER_ROLE_COLOR.gunner, "FIRE");
        this.hitArea = scene.add.zone(0, 0, width, height).setOrigin(0, 0)
            .on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this)
            .on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);

        this.root.add([
            this.titleText,
            this.icon,
            this.stateText,
            this.integrityView.getRoot(),
            this.targetOutline.getRoot(),
            this.hoverView.getRoot(),
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
        this.titleText.setVisible(!hovered);
        this.hoverView.setVisible(hovered);
        this.targetOutline.setVisible(this.selectionEnabled && !hovered);
    }

    public update(payload: BridgeEnemyEquipmentDashboardPayload): void {
        const chromeColor = payload.broken
            ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
            : FONT_COLOR.PRIMARY;

        this.titleText
            .setText(payload.shortName)
            .setTint(chromeColor);

        this.icon
            .setTexture(payload.sprite.atlasKey, payload.sprite.frameKey)
            .setTint(
                payload.broken
                    ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
                    : CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
            );

        this.stateText
            .setText(payload.broken ? "BROKEN" : "")
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor);

        this.integrityView.update(
            payload.integrity.current,
            payload.integrity.max,
            payload.broken,
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
