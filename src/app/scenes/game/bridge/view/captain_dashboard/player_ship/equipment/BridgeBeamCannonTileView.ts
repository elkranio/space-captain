// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeBeamCannonTileView.ts
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
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 3,

    statusY: 70,

    integrityPipSize: 6,
    integrityPipGap: 2,

    hoverTextGap: 6,
    hoverHeaderHeight: 22,
    hoverHeaderAlpha: 0.14,
    hoverBorderThickness: 2,
} as const;

export const BEAM_CANNON_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    CHARGING: "charging",
} as const;

export type BeamCannonProgressMode =
    (typeof BEAM_CANNON_PROGRESS_MODE)[keyof typeof BEAM_CANNON_PROGRESS_MODE];

export const BEAM_CANNON_HOVER_ACTION = {
    NONE: "none",
    FIRE: "fire",
    CANCEL: "cancel",
    REPAIR: "repair",
} as const;

export type BeamCannonHoverAction =
    (typeof BEAM_CANNON_HOVER_ACTION)[keyof typeof BEAM_CANNON_HOVER_ACTION];

export default class BridgeBeamCannonTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly hoverHeaderBackground: Phaser.GameObjects.Rectangle;

    private readonly hoverOutline: BridgeEquipmentSlotChromeView;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    private readonly hoverRoleText: Phaser.GameObjects.BitmapText;

    private readonly hoverActionText: Phaser.GameObjects.BitmapText;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private integrityCurrent = 0;

    private integrityMax = 0;

    private progressVisible = false;

    private pointerOver = false;

    private hoverAction: BeamCannonHoverAction = BEAM_CANNON_HOVER_ACTION.NONE;

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
            .bitmapText(TILE.horizontalPadding, TILE.titleY, FONT_FAMILY.UI_PRIMARY, "BEAM CANNON", FONT_SIZE.PX_20)
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.BEAM_CANNON];

        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + 1;
        const hoverTextY = TILE.titleY;

        this.baseIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.progressIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setVisible(false);

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
            MICRO_ICON_ID.POWER_CHARGE,
        );
        this.metricView.setPosition(
            TILE.horizontalPadding,
            TILE.statusY,
        );
        this.metricView.setTextColor(this.chromeColor);

        this.integrityRoot = this.scene.add.container(0, 0);

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
            this.baseIcon,
            this.progressIcon,
            this.hoverRoleText,
            this.hoverActionText,
            this.metricView.getRoot(),
            this.integrityRoot,
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

    public setPowerCost(cost: number): void {
        this.metricView.setValue(cost);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityCurrent = current;
        this.integrityMax = max;
        this.renderIntegrity();
    }

    public setHoverAction(action: BeamCannonHoverAction): void {
        this.hoverAction = action;
        this.renderHover();
    }

    public setProgress(mode: BeamCannonProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case BEAM_CANNON_PROGRESS_MODE.COOLDOWN:
                this.baseIcon.setTint(colors.cooldownColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.cooldownColor);
                break;

            case BEAM_CANNON_PROGRESS_MODE.REPAIR:
                this.baseIcon.setTint(colors.repairColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.repairColor);
                break;

            case BEAM_CANNON_PROGRESS_MODE.CHARGING:
                this.baseIcon.setTint(colors.readyColor);
                this.progressIcon.setTint(colors.activityColor);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                break;
        }

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const cropWidth = Math.round(this.progressIcon.width * clampedProgress);

        this.progressVisible = cropWidth > 0;

        if (this.progressVisible) {
            this.progressIcon.setCrop(0, 0, cropWidth, this.progressIcon.height);
        }

        this.renderHover();
    }

    public setResourceBlocked(): void {
        const blockedColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        this.baseIcon.setTint(blockedColor);
        this.progressVisible = false;
        this.setChromeColor(blockedColor);
        this.renderHover();
    }

    public resetProgress(): void {
        this.baseIcon.setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);
        this.progressVisible = false;
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
        this.renderIntegrity();
    }

    private renderIntegrity(): void {
        this.integrityRoot.removeAll(true);

        if (this.integrityMax <= 0) {
            return;
        }

        const totalWidth = this.integrityMax * TILE.integrityPipSize + (this.integrityMax - 1) * TILE.integrityPipGap;
        const startX = this.width - TILE.horizontalPadding - totalWidth;
        const integrityColor =
            this.integrityCurrent <= 0
                ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
                : CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor;
        const emptyAlpha = CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.emptyAlpha;

        for (let index = 0; index < this.integrityMax; index += 1) {
            const filled = index < this.integrityCurrent;
            const x = startX + index * (TILE.integrityPipSize + TILE.integrityPipGap);

            const pip = this.scene.add
                .rectangle(
                    x,
                    TILE.statusY + 2,
                    TILE.integrityPipSize,
                    TILE.integrityPipSize,
                    integrityColor,
                    filled ? 1 : emptyAlpha,
                )
                .setOrigin(0, 0);

            this.integrityRoot.add(pip);
        }
    }

    private renderHover(): void {
        const showAction = this.pointerOver && this.hoverAction !== BEAM_CANNON_HOVER_ACTION.NONE;

        this.titleText.setVisible(!showAction);
        this.baseIcon.setVisible(true);
        this.progressIcon.setVisible(this.progressVisible);
        this.hoverHeaderBackground.setVisible(showAction);
        this.hoverOutline.setVisible(showAction);
        this.hoverRoleText.setVisible(showAction);
        this.hoverActionText.setVisible(showAction);

        if (!showAction) {
            return;
        }

        switch (this.hoverAction) {
            case BEAM_CANNON_HOVER_ACTION.FIRE:
                this.hoverRoleText.setText("W").setTint(OFFICER_ROLE_COLOR.weapons);
                this.hoverActionText.setText("FIRE");
                break;

            case BEAM_CANNON_HOVER_ACTION.CANCEL:
                this.hoverRoleText.setText("W").setTint(OFFICER_ROLE_COLOR.weapons);
                this.hoverActionText.setText("CANCEL");
                break;

            case BEAM_CANNON_HOVER_ACTION.REPAIR:
                this.hoverRoleText.setText("E").setTint(OFFICER_ROLE_COLOR.engineer);
                this.hoverActionText.setText("REPAIR");
                break;

            case BEAM_CANNON_HOVER_ACTION.NONE:
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
        if (this.hoverAction === BEAM_CANNON_HOVER_ACTION.NONE) {
            return;
        }

        this.onActionRequested?.();
    }
}
