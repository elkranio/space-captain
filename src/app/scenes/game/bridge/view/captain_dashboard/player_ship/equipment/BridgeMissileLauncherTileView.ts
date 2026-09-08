// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeMissileLauncherTileView.ts
import {
    EQUIPMENT_SPRITE_ID,
    EQUIPMENT_SPRITES,
} from "../../../../../../../manifests/equipment";
import {
    MICRO_ICON_ID,
} from "../../../../../../../manifests/micro_icons";
import { FONT_COLOR } from "../../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentHoverActionView from "../../BridgeEquipmentHoverActionView";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

export const MISSILE_LAUNCHER_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    TARGETING: "targeting",
} as const;

export type MissileLauncherProgressMode =
    (typeof MISSILE_LAUNCHER_PROGRESS_MODE)[keyof typeof MISSILE_LAUNCHER_PROGRESS_MODE];

export const MISSILE_LAUNCHER_HOVER_ACTION = {
    NONE: "none",
    FIRE: "fire",
    CANCEL: "cancel",
    REPAIR: "repair",
} as const;

export type MissileLauncherHoverAction =
    (typeof MISSILE_LAUNCHER_HOVER_ACTION)[keyof typeof MISSILE_LAUNCHER_HOVER_ACTION];

// Первый concrete equipment tile.
//
// Уже содержит постоянную геометрию launcher tile:
// pictogram, ammo, integrity и hover action.
// Debug-view пока подаёт тестовые значения и гоняет progress states.
export default class BridgeMissileLauncherTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hoverView: BridgeEquipmentHoverActionView;

    private readonly progressIconView: BridgeEquipmentProgressIconView;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private pointerOver = false;
    private interactionEnabled = true;

    private hoverAction: MissileLauncherHoverAction = MISSILE_LAUNCHER_HOVER_ACTION.NONE;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
        private readonly onActionRequested?: () => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.MISSILE_LAUNCHER];

        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + TILE.iconCenterOffsetY;

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

        this.progressIconView = new BridgeEquipmentProgressIconView(
            this.scene,
            sprite,
        );
        this.progressIconView.setPosition(centerX, centerY);
        this.progressIconView.setMaxDisplaySize(TILE.iconMaxWidth, TILE.iconMaxHeight);

        this.metricView = new BridgeEquipmentMetricView(
            this.scene,
            MICRO_ICON_ID.AMMO_MISSILE_STANDARD,
        );
        this.metricView.setPosition(
            TILE.statusLeftX,
            TILE.statusY,
        );
        this.metricView.setTextColor(this.chromeColor);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(
            0,
            TILE.statusY + TILE.integrityOffsetY,
        );
        this.integrityView.setRightEdge(this.width - TILE.integrityRightPadding);

        this.hitArea = this.scene.add
            .zone(0, 0, this.width, height)
            .setOrigin(0, 0)
            .setInteractive({
                useHandCursor: true,
            })
            .on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this)
            .on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this)
            .on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);

        this.hoverView = new BridgeEquipmentHoverActionView(
            this.scene,
            this.width,
            height,
        );

        this.root.add([
            divider,
            this.progressIconView.getRoot(),
            this.metricView.getRoot(),
            this.integrityView.getRoot(),
            this.hoverView.getRoot(),
            this.hitArea,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setInteractionEnabled(enabled: boolean): void {
        if (this.interactionEnabled === enabled) {
            return;
        }

        this.interactionEnabled = enabled;
        if (enabled) {
            this.hitArea.setInteractive({ useHandCursor: true });
        } else {
            this.pointerOver = false;
            this.hitArea.disableInteractive();
        }
        this.renderHover();
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setAmmo(current: number): void {
        this.metricView.setValue(current);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityView.update(current, max);
    }

    public setHoverAction(action: MissileLauncherHoverAction): void {
        this.hoverAction = action;
        this.renderHover();
    }

    public setProgress(mode: MissileLauncherProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setProgress(
                    colors.cooldownColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.cooldownColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR:
                this.progressIconView.setProgress(
                    colors.repairColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.repairColor);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING:
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
        this.metricView.setTextColor(color);
    }

    private renderHover(): void {
        const showAction = this.pointerOver && this.hoverAction !== MISSILE_LAUNCHER_HOVER_ACTION.NONE;

        this.hoverView.setVisible(showAction);
        this.metricView.getRoot().setVisible(!showAction);
        this.integrityView.getRoot().setVisible(!showAction);

        if (!showAction) {
            return;
        }

        switch (this.hoverAction) {
            case MISSILE_LAUNCHER_HOVER_ACTION.FIRE:
                this.hoverView.setAction("G", OFFICER_ROLE_COLOR.gunner, "FIRE");
                break;

            case MISSILE_LAUNCHER_HOVER_ACTION.CANCEL:
                this.hoverView.setAction("G", OFFICER_ROLE_COLOR.gunner, "CANCEL");
                break;

            case MISSILE_LAUNCHER_HOVER_ACTION.REPAIR:
                this.hoverView.setAction("E", OFFICER_ROLE_COLOR.engineer, "REPAIR");
                break;

            case MISSILE_LAUNCHER_HOVER_ACTION.NONE:
                return;
        }

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
        if (!this.interactionEnabled || this.hoverAction === MISSILE_LAUNCHER_HOVER_ACTION.NONE) {
            return;
        }

        this.onActionRequested?.();
    }
}
