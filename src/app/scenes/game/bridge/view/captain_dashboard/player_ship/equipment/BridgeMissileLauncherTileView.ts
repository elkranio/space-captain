// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeMissileLauncherTileView.ts
import { getEquipmentIconSprite } from "../../../../../../../manifests/equipment";
import {
    MICRO_ICON_ID,
} from "../../../../../../../manifests/micro_icons";
import { FONT_COLOR } from "../../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentHoverActionView from "../../BridgeEquipmentHoverActionView";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import BridgeEquipmentProgressBarView from "../../BridgeEquipmentProgressBarView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION } from "../../bridge_equipment_progress_presentation";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;
const UNAVAILABLE_CONTENT_ALPHA = 0.4;

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

    private readonly progressBarView: BridgeEquipmentProgressBarView;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private pointerOver = false;
    private interactionEnabled = true;
    private progressMode: MissileLauncherProgressMode | null = null;

    private hoverAction: MissileLauncherHoverAction = MISSILE_LAUNCHER_HOVER_ACTION.NONE;

    constructor(
        private readonly scene: BridgeScene,
        iconId: string,
        private readonly width: number,
        height: number,
        private readonly onActionRequested?: () => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        const sprite = getEquipmentIconSprite(iconId);

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

        this.progressBarView = new BridgeEquipmentProgressBarView(
            this.scene,
            this.width - TILE.horizontalPadding * 2,
            TILE.progressBarHeight,
        );
        this.progressBarView.setPosition(
            TILE.horizontalPadding,
            TILE.dividerY - TILE.progressBarHeight,
        );

        this.progressIconView = new BridgeEquipmentProgressIconView(
            this.scene,
            sprite,
        );
        this.progressIconView.setPosition(centerX, centerY);

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
            this.progressBarView.getRoot(),
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
        this.progressMode = mode;

        switch (mode) {
            case MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setBaseColor(colors.readyColor);
                this.setUnavailableVisual(true);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.COOLDOWN,
                );
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR:
                this.progressIconView.setBaseColor(colors.readyColor);
                this.setUnavailableVisual(true);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.REPAIR,
                );
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING:
                this.progressIconView.setBaseColor(colors.readyColor);
                this.setUnavailableVisual(false);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.PREPARE,
                );
                break;
        }

        this.renderHover();
    }

    public setResourceBlocked(): void {
        const blockedColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        this.progressMode = null;
        this.progressBarView.reset();
        this.setUnavailableVisual(false);
        this.progressIconView.setBaseColor(blockedColor);
        this.setChromeColor(blockedColor);
        this.renderHover();
    }

    public resetProgress(): void {
        this.progressMode = null;
        this.progressBarView.reset();
        this.setUnavailableVisual(false);
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

    private setUnavailableVisual(unavailable: boolean): void {
        const alpha = unavailable ? UNAVAILABLE_CONTENT_ALPHA : 1;

        this.progressIconView.getRoot().setAlpha(alpha);
        this.metricView.getRoot().setAlpha(alpha);
    }

    private renderHover(): void {
        const persistentCancel =
            this.progressMode === MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING &&
            this.hoverAction === MISSILE_LAUNCHER_HOVER_ACTION.CANCEL;
        const showAction =
            persistentCancel ||
            (this.pointerOver && this.hoverAction !== MISSILE_LAUNCHER_HOVER_ACTION.NONE);

        this.hoverView.setHighlighted(this.pointerOver);
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
