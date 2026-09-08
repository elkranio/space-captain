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
const PROGRESS_LINE_HEIGHT = 3;
const UNAVAILABLE_CONTENT_ALPHA = 0.4;
const REPAIR_VISUAL_DEBUG_DURATION_MS = 2200;

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

    private readonly progressLine: Phaser.GameObjects.Rectangle;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private pointerOver = false;
    private interactionEnabled = true;
    private progressMode: MissileLauncherProgressMode | null = null;

    private hoverAction: MissileLauncherHoverAction = MISSILE_LAUNCHER_HOVER_ACTION.NONE;

    // TEMP visual debug: remove once weapon repair reaches the dashboard payload.
    private repairVisualDebugState: "broken" | "repairing" | "done" = "broken";
    private repairVisualDebugProgress = 0;
    private repairVisualDebugTween?: Phaser.Tweens.Tween;

    private liveHoverAction: MissileLauncherHoverAction = MISSILE_LAUNCHER_HOVER_ACTION.NONE;
    private liveIntegrityCurrent = 0;
    private liveIntegrityMax = 1;

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

        this.progressLine = this.scene.add
            .rectangle(
                TILE.horizontalPadding,
                TILE.dividerY - PROGRESS_LINE_HEIGHT,
                this.width - TILE.horizontalPadding * 2,
                PROGRESS_LINE_HEIGHT,
                CAPTAIN_DASHBOARD_STYLE.equipmentProgress.activityColor,
            )
            .setOrigin(0, 0)
            .setScale(0, 1)
            .setVisible(false);

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
            this.progressLine,
            this.progressIconView.getRoot(),
            this.metricView.getRoot(),
            this.integrityView.getRoot(),
            this.hoverView.getRoot(),
            this.hitArea,
        ]);

        this.renderRepairVisualDebug();
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
        this.liveIntegrityCurrent = current;
        this.liveIntegrityMax = max;

        if (this.repairVisualDebugState === "done") {
            this.integrityView.update(current, max);
            return;
        }

        this.integrityView.update(0, max);
    }

    public setHoverAction(action: MissileLauncherHoverAction): void {
        this.liveHoverAction = action;

        if (this.repairVisualDebugState !== "done") {
            this.hoverAction =
                this.repairVisualDebugState === "broken"
                    ? MISSILE_LAUNCHER_HOVER_ACTION.REPAIR
                    : MISSILE_LAUNCHER_HOVER_ACTION.NONE;
        } else {
            this.hoverAction = action;
        }

        this.renderHover();
    }

    public setProgress(mode: MissileLauncherProgressMode, progress: number): void {
        if (this.repairVisualDebugState !== "done") {
            this.renderRepairVisualDebug();
            return;
        }

        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;
        this.progressMode = mode;

        switch (mode) {
            case MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setBaseColor(colors.readyColor);
                this.setUnavailableVisual(true);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                this.setProgressLine(colors.cooldownColor, progress);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR:
                this.progressIconView.setBaseColor(colors.readyColor);
                this.setUnavailableVisual(true);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                this.setProgressLine(colors.repairColor, 1 - progress);
                break;

            case MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING:
                this.progressIconView.setBaseColor(colors.readyColor);
                this.setUnavailableVisual(false);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                this.setProgressLine(colors.activityColor, progress);
                break;
        }

        this.renderHover();
    }

    public setResourceBlocked(): void {
        if (this.repairVisualDebugState !== "done") {
            this.renderRepairVisualDebug();
            return;
        }

        const blockedColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        this.progressMode = null;
        this.hideProgressLine();
        this.setUnavailableVisual(false);
        this.progressIconView.setBaseColor(blockedColor);
        this.setChromeColor(blockedColor);
        this.renderHover();
    }

    public resetProgress(): void {
        if (this.repairVisualDebugState !== "done") {
            this.renderRepairVisualDebug();
            return;
        }

        this.progressMode = null;
        this.hideProgressLine();
        this.setUnavailableVisual(false);
        this.progressIconView.setBaseColor(
            CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
        );
        this.setChromeColor(FONT_COLOR.PRIMARY);
        this.renderHover();
    }

    public destroy(): void {
        this.repairVisualDebugTween?.stop();
        this.repairVisualDebugTween = undefined;

        this.hitArea.off(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);
        this.hitArea.off(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);
        this.hitArea.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.root.destroy(true);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.metricView.setTextColor(color);
    }

    private setProgressLine(color: number, progress: number): void {
        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);

        this.progressLine
            .setFillStyle(color, 1)
            .setScale(clampedProgress, 1)
            .setVisible(clampedProgress > 0);
    }

    private hideProgressLine(): void {
        this.progressLine.setVisible(false);
    }

    private setUnavailableVisual(unavailable: boolean): void {
        const alpha = unavailable ? UNAVAILABLE_CONTENT_ALPHA : 1;

        this.progressIconView.getRoot().setAlpha(alpha);
        this.metricView.getRoot().setAlpha(alpha);
    }

    private renderRepairVisualDebug(): void {
        if (this.repairVisualDebugState === "done") {
            return;
        }

        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;
        const repairProgress =
            this.repairVisualDebugState === "repairing"
                ? this.repairVisualDebugProgress
                : 0;

        this.progressMode = MISSILE_LAUNCHER_PROGRESS_MODE.REPAIR;
        this.progressIconView.setBaseColor(colors.readyColor);
        this.setUnavailableVisual(true);
        this.setChromeColor(FONT_COLOR.PRIMARY);
        this.setProgressLine(colors.repairColor, 1 - repairProgress);
        this.integrityView.update(0, this.liveIntegrityMax);

        this.hoverAction =
            this.repairVisualDebugState === "broken"
                ? MISSILE_LAUNCHER_HOVER_ACTION.REPAIR
                : MISSILE_LAUNCHER_HOVER_ACTION.NONE;

        this.renderHover();
    }

    private startRepairVisualDebug(): void {
        if (this.repairVisualDebugState !== "broken") {
            return;
        }

        this.repairVisualDebugState = "repairing";
        this.repairVisualDebugProgress = 0;
        this.renderRepairVisualDebug();

        const debugState = {
            progress: 0,
        };

        this.repairVisualDebugTween = this.scene.tweens.add({
            targets: debugState,
            progress: 1,
            duration: REPAIR_VISUAL_DEBUG_DURATION_MS,
            ease: "Linear",
            onUpdate: () => {
                this.repairVisualDebugProgress = debugState.progress;
                this.renderRepairVisualDebug();
            },
            onComplete: () => {
                this.repairVisualDebugTween = undefined;
                this.repairVisualDebugState = "done";
                this.repairVisualDebugProgress = 1;
                this.integrityView.update(this.liveIntegrityCurrent, this.liveIntegrityMax);
                this.hoverAction = this.liveHoverAction;
                this.resetProgress();
            },
        });
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
        if (!this.interactionEnabled) {
            return;
        }

        if (this.repairVisualDebugState === "broken") {
            this.startRepairVisualDebug();
            return;
        }

        if (this.repairVisualDebugState === "repairing") {
            return;
        }

        if (this.hoverAction === MISSILE_LAUNCHER_HOVER_ACTION.NONE) {
            return;
        }

        this.onActionRequested?.();
    }
}
