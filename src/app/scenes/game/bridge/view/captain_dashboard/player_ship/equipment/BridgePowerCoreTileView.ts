// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePowerCoreTileView.ts
import { getEquipmentIconSprite } from "../../../../../../../manifests/equipment";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// Mounted Power Core uses the same divider + integrity grammar as other equipment.
// Charges stay in the ship header; breaking the Core only pauses recharge.
export default class BridgePowerCoreTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    constructor(
        private readonly scene: BridgeScene,
        iconId: string,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const divider = this.scene.add
            .rectangle(
                TILE.horizontalPadding,
                TILE.dividerY,
                width - TILE.horizontalPadding * 2,
                TILE.dividerHeight,
                CAPTAIN_DASHBOARD_STYLE.equipmentAccent.iconColor,
                CAPTAIN_DASHBOARD_STYLE.equipmentSlot.borderAlpha,
            )
            .setOrigin(0, 0);

        const sprite = getEquipmentIconSprite(iconId);
        const iconView = new BridgeEquipmentProgressIconView(this.scene, sprite);

        iconView.setPosition(
            Math.round(width / 2),
            Math.round(height / 2) + TILE.iconCenterOffsetY,
        );
        iconView.setMaxDisplaySize(TILE.iconMaxWidth, TILE.iconMaxHeight);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(0, TILE.statusY + TILE.integrityOffsetY);
        this.integrityView.setRightEdge(width - TILE.integrityRightPadding);

        this.root.add([
            divider,
            iconView.getRoot(),
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

    public destroy(): void {
        this.root.destroy(true);
    }
}
