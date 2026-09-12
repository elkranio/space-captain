// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeSpamProjectorTileView.ts
import { getEquipmentIconSprite } from "../../../../../../../manifests/equipment";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentHoverActionView from "../../BridgeEquipmentHoverActionView";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentProgressBarView from "../../BridgeEquipmentProgressBarView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION } from "../../bridge_equipment_progress_presentation";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

export const SPAM_PROJECTOR_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    TARGETING: "targeting",
    CHANNELING: "channeling",
} as const;

export type SpamProjectorProgressMode =
    (typeof SPAM_PROJECTOR_PROGRESS_MODE)[keyof typeof SPAM_PROJECTOR_PROGRESS_MODE];

export const SPAM_PROJECTOR_HOVER_ACTION = {
    NONE: "none",
    FIRE: "fire",
    CANCEL: "cancel",
    REPAIR: "repair",
} as const;

export type SpamProjectorHoverAction =
    (typeof SPAM_PROJECTOR_HOVER_ACTION)[keyof typeof SPAM_PROJECTOR_HOVER_ACTION];

export default class BridgeSpamProjectorTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hoverView: BridgeEquipmentHoverActionView;

    private readonly progressIconView: BridgeEquipmentProgressIconView;

    private readonly progressBarView: BridgeEquipmentProgressBarView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private readonly hitArea: Phaser.GameObjects.Zone;

    private pointerOver = false;
    private interactionEnabled = true;

    private hoverAction: SpamProjectorHoverAction = SPAM_PROJECTOR_HOVER_ACTION.NONE;

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

    public setIntegrity(current: number, max: number): void {
        this.integrityView.update(current, max);
    }

    public setHoverAction(action: SpamProjectorHoverAction): void {
        this.hoverAction = action;
        this.renderHover();
    }

    public setProgress(mode: SpamProjectorProgressMode, progress: number): void {
        this.progressIconView.setBaseAppearance(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        switch (mode) {
            case SPAM_PROJECTOR_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setBaseAppearance(
                    CAPTAIN_DASHBOARD_STYLE.equipmentIcon.cooldownTint,
                    CAPTAIN_DASHBOARD_STYLE.equipmentIcon.cooldownAlpha,
                );
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.COOLDOWN,
                );
                break;

            case SPAM_PROJECTOR_PROGRESS_MODE.REPAIR:
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.REPAIR,
                );
                break;

            case SPAM_PROJECTOR_PROGRESS_MODE.TARGETING:
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.PREPARE,
                );
                break;

            case SPAM_PROJECTOR_PROGRESS_MODE.CHANNELING:
                this.progressBarView.setProgress(
                    progress,
                    BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION.ACTIVE,
                );
                break;
        }

        this.renderHover();
    }

    public resetProgress(): void {
        this.progressBarView.reset();
        this.progressIconView.setBaseAppearance(
            CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
        );
        this.renderHover();
    }

    public destroy(): void {
        this.hitArea.off(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);
        this.hitArea.off(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);
        this.hitArea.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.root.destroy(true);
    }

    private renderHover(): void {
        const showAction = this.pointerOver && this.hoverAction !== SPAM_PROJECTOR_HOVER_ACTION.NONE;

        this.hoverView.setVisible(showAction);
        this.integrityView.getRoot().setVisible(!showAction);

        if (!showAction) {
            return;
        }

        switch (this.hoverAction) {
            case SPAM_PROJECTOR_HOVER_ACTION.FIRE:
                this.hoverView.setAction("S", OFFICER_ROLE_COLOR.scientist, "FIRE");
                break;

            case SPAM_PROJECTOR_HOVER_ACTION.CANCEL:
                this.hoverView.setAction("S", OFFICER_ROLE_COLOR.scientist, "CANCEL");
                break;

            case SPAM_PROJECTOR_HOVER_ACTION.REPAIR:
                this.hoverView.setAction("E", OFFICER_ROLE_COLOR.engineer, "REPAIR");
                break;

            case SPAM_PROJECTOR_HOVER_ACTION.NONE:
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
        if (!this.interactionEnabled || this.hoverAction === SPAM_PROJECTOR_HOVER_ACTION.NONE) {
            return;
        }

        this.onActionRequested?.();
    }
}
