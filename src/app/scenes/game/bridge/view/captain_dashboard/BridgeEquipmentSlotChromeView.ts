import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

type BridgeEquipmentSlotChromeVariant = "slot" | "highlight";

// Shared chamfered shape for chassis slots and interaction highlight.
export default class BridgeEquipmentSlotChromeView {
    private readonly root: Phaser.GameObjects.Graphics;

    constructor(
        scene: BridgeScene,
        width: number,
        height: number,
        variant: BridgeEquipmentSlotChromeVariant = "slot",
    ) {
        this.root = scene.add.graphics();

        const style = CAPTAIN_DASHBOARD_STYLE.equipmentSlot;
        const highlight = variant === "highlight";
        const inset = highlight ? style.highlightInset : 0;
        const drawWidth = width - inset * 2;
        const drawHeight = height - inset * 2;
        const cut = Math.min(
            style.cornerCut,
            Math.floor(drawWidth / 2),
            Math.floor(drawHeight / 2),
        );

        this.root.lineStyle(
            highlight
                ? style.highlightBorderThickness
                : style.borderThickness,
            highlight
                ? style.highlightBorderColor
                : style.borderColor,
            highlight
                ? style.highlightBorderAlpha
                : style.emptyBorderAlpha,
        );

        if (!highlight) {
            this.root.fillStyle(
                style.backgroundColor,
                style.backgroundAlpha,
            );
        }

        this.root
            .beginPath()
            .moveTo(inset + cut, inset)
            .lineTo(inset + drawWidth - cut, inset)
            .lineTo(inset + drawWidth, inset + cut)
            .lineTo(inset + drawWidth, inset + drawHeight - cut)
            .lineTo(inset + drawWidth - cut, inset + drawHeight)
            .lineTo(inset + cut, inset + drawHeight)
            .lineTo(inset, inset + drawHeight - cut)
            .lineTo(inset, inset + cut)
            .closePath();

        if (!highlight) {
            this.root.fillPath();
        }

        this.root.strokePath();
    }

    public getRoot(): Phaser.GameObjects.Graphics {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }
}
