// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeStickyMineDispenserTileView.ts
import {
    EQUIPMENT_SPRITE_ID,
    EQUIPMENT_SPRITES,
} from "../../../../../../../manifests/equipment";
import {
    MICRO_ICON_ID,
} from "../../../../../../../manifests/micro_icons";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 3,

    statusY: 70,

    hoverTextGap: 6,
    hoverHeaderHeight: 22,
    hoverHeaderAlpha: 0.14,
    hoverBorderThickness: 2,
} as const;

export const STICKY_MINE_DISPENSER_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    DISPENSING: "dispensing",
} as const;

export type StickyMineDispenserProgressMode =
    (typeof STICKY_MINE_DISPENSER_PROGRESS_MODE)[keyof typeof STICKY_MINE_DISPENSER_PROGRESS_MODE];

export const STICKY_MINE_DISPENSER_HOVER_ACTION = {
    NONE: "none",
    FIRE: "fire",
    REPAIR: "repair",
} as const;

export type StickyMineDispenserHoverAction =
    (typeof STICKY_MINE_DISPENSER_HOVER_ACTION)[keyof typeof STICKY_MINE_DISPENSER_HOVER_ACTION];

export default class BridgeStickyMineDispenserTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly hoverHeaderBackground: Phaser.GameObjects.Rectangle;

    private readonly hoverOutline: BridgeEquipmentSlotChromeView;

    private readonly progressIconView: BridgeEquipmentProgressIconView;

    private readonly hoverRoleText: Phaser.GameObjects.BitmapText;

    private readonly hoverActionText: Phaser.GameObjects.BitmapText;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private pointerOver = false;

    private hoverAction: StickyMineDispenserHoverAction = STICKY_MINE_DISPENSER_HOVER_ACTION.NONE;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
        private readonly onActionRequested?: () => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hoverHeaderBackground = this.scene.add
            .rectangle(0, 0, this.width, TILE.hoverHeaderHeight, FONT_COLOR.PRIMARY, TILE.hoverHeaderAlpha)
            .setOrigin(0, 0)
            .setVisible(false);

        this.hoverOutline = new BridgeEquipmentSlotChromeView(
            this.scene,
            this.width,
            height,
            "highlight",
        );
        this.hoverOutline.setVisible(false);

        this.titleText = this.scene.add
            .bitmapText(TILE.horizontalPadding, TILE.titleY, FONT_FAMILY.UI_PRIMARY, "", FONT_SIZE.PX_20)
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.STICKY_MINE_DISPENSER];

        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + 1;
        const hoverTextY = TILE.titleY;

        this.progressIconView = new BridgeEquipmentProgressIconView(
            this.scene,
            sprite,
        );
        this.progressIconView.setPosition(centerX, centerY);

        this.hoverRoleText = this.scene.add
            .bitmapText(0, hoverTextY, FONT_FAMILY.UI_PRIMARY, "", FONT_SIZE.PX_20)
            .setOrigin(0, 0)
            .setVisible(false);

        this.hoverActionText = this.scene.add
            .bitmapText(0, hoverTextY, FONT_FAMILY.UI_PRIMARY, "", FONT_SIZE.PX_20)
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY)
            .setVisible(false);

        this.metricView = new BridgeEquipmentMetricView(
            this.scene,
            MICRO_ICON_ID.AMMO_STICKY_MINE,
        );
        this.metricView.setPosition(
            TILE.horizontalPadding,
            TILE.statusY,
        );
        this.metricView.setTextColor(this.chromeColor);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(0, TILE.statusY + 2);
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.hitArea = this.scene.add
            .zone(0, 0, this.width, height)
            .setOrigin(0, 0)
            .setInteractive({
                useHandCursor: true,
            })
            .on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this)
            .on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this)
            .on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);

        this.root.add([
            this.hoverHeaderBackground,
            this.titleText,
            this.progressIconView.getRoot(),
            this.hoverRoleText,
            this.hoverActionText,
            this.metricView.getRoot(),
            this.integrityView.getRoot(),
            this.hoverOutline.getRoot(),
            this.hitArea,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setTitle(title: string): void {
        this.titleText.setText(title);
    }

    public setAmmo(current: number): void {
        this.metricView.setValue(current);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityView.update(current, max);
    }

    public setHoverAction(action: StickyMineDispenserHoverAction): void {
        this.hoverAction = action;
        this.renderHover();
    }

    public setProgress(mode: StickyMineDispenserProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case STICKY_MINE_DISPENSER_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setProgress(
                    colors.cooldownColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.cooldownColor);
                break;

            case STICKY_MINE_DISPENSER_PROGRESS_MODE.REPAIR:
                this.progressIconView.setProgress(
                    colors.repairColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.repairColor);
                break;

            case STICKY_MINE_DISPENSER_PROGRESS_MODE.DISPENSING:
                this.progressIconView.setProgress(
                    colors.readyColor,
                    colors.activityColor,
                    progress,
                );
                this.setChromeColor(FONT_COLOR.PRIMARY);
                break;
        }

        this.renderHover();
    }

    public setResourceBlocked(): void {
        const blockedColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        this.progressIconView.setBaseColor(blockedColor);
        this.setChromeColor(blockedColor);
        this.renderHover();
    }

    public resetProgress(): void {
        this.progressIconView.setBaseColor(
            CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
        );
        this.setChromeColor(FONT_COLOR.PRIMARY);
        this.renderHover();
    }

    public destroy(): void {
        this.hitArea.off(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);
        this.hitArea.off(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);
        this.hitArea.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.root.destroy(true);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.metricView.setTextColor(color);
    }

    private renderHover(): void {
        const showAction = this.pointerOver && this.hoverAction !== STICKY_MINE_DISPENSER_HOVER_ACTION.NONE;

        this.titleText.setVisible(!showAction);
        this.hoverHeaderBackground.setVisible(showAction);
        this.hoverOutline.setVisible(showAction);
        this.hoverRoleText.setVisible(showAction);
        this.hoverActionText.setVisible(showAction);

        if (!showAction) {
            return;
        }

        switch (this.hoverAction) {
            case STICKY_MINE_DISPENSER_HOVER_ACTION.FIRE:
                this.hoverRoleText.setText("W").setTint(OFFICER_ROLE_COLOR.weapons);
                this.hoverActionText.setText("FIRE");
                break;

            case STICKY_MINE_DISPENSER_HOVER_ACTION.REPAIR:
                this.hoverRoleText.setText("E").setTint(OFFICER_ROLE_COLOR.engineer);
                this.hoverActionText.setText("REPAIR");
                break;

            case STICKY_MINE_DISPENSER_HOVER_ACTION.NONE:
                return;
        }

        this.hoverRoleText.setX(TILE.horizontalPadding);
        this.hoverActionText.setX(TILE.horizontalPadding + this.hoverRoleText.width + TILE.hoverTextGap);
    }

    private handlePointerOver(): void {
        this.pointerOver = true;
        this.renderHover();
    }

    private handlePointerOut(): void {
        this.pointerOver = false;
        this.renderHover();
    }

    private handlePointerUp(): void {
        if (this.hoverAction === STICKY_MINE_DISPENSER_HOVER_ACTION.NONE) {
            return;
        }

        this.onActionRequested?.();
    }
}
