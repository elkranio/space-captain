import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

// Dumb visual shell for one chassis equipment slot.
// Geometry stays fixed; occupied/empty semantics stay outside this view.
export default class BridgeEquipmentSlotChromeView {
    private readonly root: Phaser.GameObjects.Graphics;

    constructor(
        scene: BridgeScene,
        width: number,
        height: number,
    ) {
        this.root = scene.add.graphics();

        const style = CAPTAIN_DASHBOARD_STYLE.equipmentSlot;
        const cut = Math.min(
            style.cornerCut,
            Math.floor(width / 2),
            Math.floor(height / 2),
        );

        this.root
            .fillStyle(style.backgroundColor, style.backgroundAlpha)
            .lineStyle(
                style.borderThickness,
                style.borderColor,
                style.borderAlpha,
            )
            .beginPath()
            .moveTo(cut, 0)
            .lineTo(width - cut, 0)
            .lineTo(width, cut)
            .lineTo(width, height - cut)
            .lineTo(width - cut, height)
            .lineTo(cut, height)
            .lineTo(0, height - cut)
            .lineTo(0, cut)
            .closePath()
            .fillPath()
            .strokePath();
    }

    public getRoot(): Phaser.GameObjects.Graphics {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }
}
