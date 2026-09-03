// Read-only equipment tile used only by the persistent enemy dashboard.
import type { SpriteEntry } from "../../../../../../../manifests/types";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type { BridgeEnemyEquipmentDashboardPayload } from "../../../../events/bridge_event";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,
    titleY: 3,

    integrityY: 72,
    stateBottomPadding: 10,
} as const;

export default class BridgeEnemyEquipmentTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly stateText: Phaser.GameObjects.BitmapText;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        private readonly height: number,
        sprite: SpriteEntry,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.titleText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.icon = this.scene.add
            .image(
                Math.round(this.width / 2),
                Math.round(this.height / 2) + 1,
                sprite.atlasKey,
                sprite.frameKey,
            )
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setFlipX(true);

        this.stateText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                this.height - TILE.stateBottomPadding - FONT_SIZE.PX_16,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(0, TILE.integrityY);
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.root.add([
            this.titleText,
            this.icon,
            this.stateText,
            this.integrityView.getRoot(),
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(payload: BridgeEnemyEquipmentDashboardPayload): void {
        const chromeColor = payload.broken
            ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
            : FONT_COLOR.PRIMARY;

        this.titleText
            .setText(payload.shortName)
            .setTint(chromeColor);

        this.icon
            .setTexture(payload.sprite.atlasKey, payload.sprite.frameKey)
            .setTint(
                payload.broken
                    ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
                    : CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
            );

        this.stateText
            .setText(payload.broken ? "BROKEN" : "")
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor);

        this.integrityView.update(
            payload.integrity.current,
            payload.integrity.max,
            payload.broken,
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
