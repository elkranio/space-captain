import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

export type BridgeHeaderTargetEdge = "left" | "right";

const INNER_CORNER_CUT = 2;

// Header targeting uses the same highlight stroke as equipment slots.
// Only the outer top corner gets the stronger chamfer; the outer bottom
// corner stays square so the region reads as part of the header bar.
export default class BridgeHeaderTargetChromeView {
    private readonly root: Phaser.GameObjects.Graphics;

    constructor(
        scene: BridgeScene,
        private readonly outerEdge: BridgeHeaderTargetEdge,
    ) {
        this.root = scene.add.graphics().setVisible(false);
    }

    public getRoot(): Phaser.GameObjects.Graphics {
        return this.root;
    }

    public setBounds(x: number, y: number, width: number, height: number): void {
        this.root.setPosition(x, y);
        this.draw(width, height);
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }

    public setAlpha(alpha: number): void {
        this.root.setAlpha(alpha);
    }

    public destroy(): void {
        this.root.destroy();
    }

    private draw(width: number, height: number): void {
        const style = CAPTAIN_DASHBOARD_STYLE.equipmentSlot;
        const inset = style.highlightInset;
        const drawWidth = Math.max(0, width - inset * 2);
        const drawHeight = Math.max(0, height - inset * 2);
        const outerCut = Math.min(
            style.cornerCut,
            Math.floor(drawWidth / 2),
            Math.floor(drawHeight / 2),
        );
        const innerCut = Math.min(
            INNER_CORNER_CUT,
            Math.floor(drawWidth / 2),
            Math.floor(drawHeight / 2),
        );
        const topLeftCut = this.outerEdge === "left" ? outerCut : innerCut;
        const bottomLeftCut = this.outerEdge === "left" ? 0 : innerCut;
        const topRightCut = this.outerEdge === "right" ? outerCut : innerCut;
        const bottomRightCut = this.outerEdge === "right" ? 0 : innerCut;

        this.root.clear();
        this.root.lineStyle(
            style.highlightBorderThickness,
            style.highlightBorderColor,
            style.highlightBorderAlpha,
        );
        this.root
            .beginPath()
            .moveTo(inset + topLeftCut, inset)
            .lineTo(inset + drawWidth - topRightCut, inset)
            .lineTo(inset + drawWidth, inset + topRightCut)
            .lineTo(inset + drawWidth, inset + drawHeight - bottomRightCut)
            .lineTo(inset + drawWidth - bottomRightCut, inset + drawHeight)
            .lineTo(inset + bottomLeftCut, inset + drawHeight)
            .lineTo(inset, inset + drawHeight - bottomLeftCut)
            .lineTo(inset, inset + topLeftCut)
            .closePath()
            .strokePath();
    }
}
