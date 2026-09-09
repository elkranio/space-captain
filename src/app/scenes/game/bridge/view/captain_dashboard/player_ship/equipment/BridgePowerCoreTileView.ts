// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePowerCoreTileView.ts
import { getEquipmentIconSprite } from "../../../../../../../manifests/equipment";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// Passive mounted Power Core presentation.
// Charges stay in the ship header; integrity is intentionally not invented here
// until Power Core gets real damage/broken semantics in the engine model.
export default class BridgePowerCoreTileView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        iconId: string,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const sprite = getEquipmentIconSprite(iconId);
        const iconView = new BridgeEquipmentProgressIconView(this.scene, sprite);

        iconView.setPosition(
            Math.round(width / 2),
            Math.round(height / 2) + TILE.iconCenterOffsetY,
        );
        iconView.setMaxDisplaySize(TILE.iconMaxWidth, TILE.iconMaxHeight);

        this.root.add(iconView.getRoot());
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
