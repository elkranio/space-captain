// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeDriveTileView.ts
import {
    EQUIPMENT_SPRITE_ID,
    EQUIPMENT_SPRITES,
} from "../../../../../../../manifests/equipment";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// EVADE execution remains outside this presentation-only tile for now.
// The tile only renders the installed Drive and integrity.
export default class BridgeDriveTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly progressIconView: BridgeEquipmentProgressIconView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.DRIVE];
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

        this.progressIconView = new BridgeEquipmentProgressIconView(this.scene, sprite);
        this.progressIconView.setPosition(centerX, centerY);
        this.progressIconView.setMaxDisplaySize(TILE.iconMaxWidth, TILE.iconMaxHeight);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(0, TILE.statusY + TILE.integrityOffsetY);
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.root.add([
            divider,
            this.progressIconView.getRoot(),
            this.integrityView.getRoot(),
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityView.update(current, max);
    }

    public setBroken(): void {
        this.setStateColor(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor);
    }

    public setResourceBlocked(): void {
        this.setStateColor(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor);
    }

    public resetState(): void {
        this.progressIconView.setBaseColor(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private setStateColor(color: number): void {
        this.progressIconView.setBaseColor(color);
    }
}
