// Passive enemy Power Core slot presentation.
import type { SpriteEntry } from "../../../../../../../manifests/types";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

// Core is deliberately not a BridgeEnemyEquipmentTileView:
// it has no damage/broken contract yet and must not become a Beam target.
export default class BridgeEnemyPowerCoreTileView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
        sprite: SpriteEntry,
    ) {
        this.root = this.scene.add.container(0, 0);

        const icon = this.scene.add
            .image(
                Math.round(width / 2),
                Math.round(height / 2) + TILE.iconCenterOffsetY,
                sprite.atlasKey,
                sprite.frameKey,
            )
            .setFlipX(true);

        const scale = Math.min(
            1,
            TILE.iconMaxWidth / icon.width,
            TILE.iconMaxHeight / icon.height,
        );
        icon.setScale(scale);

        this.root.add(icon);
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
