import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const GRID = {
    columns: 4,
    rows: 3,

    columnGap: 4,
    rowGap: 4,
} as const;

// Базовая 4x3 сетка equipment slots.
//
// Пока рисует только постоянную геометрию пустых слотов.
// Содержимое конкретного equipment будет добавляться поверх этих slots
// отдельными tile views.
export default class BridgePlayerShipEquipmentGridView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const slotWidth = Math.floor(
            (width - GRID.columnGap * (GRID.columns - 1)) / GRID.columns,
        );
        const slotHeight = Math.floor(
            (height - GRID.rowGap * (GRID.rows - 1)) / GRID.rows,
        );

        if (slotWidth <= 0 || slotHeight <= 0) {
            throw new Error("Player equipment grid requires positive slot size");
        }

        for (let row = 0; row < GRID.rows; row += 1) {
            for (let column = 0; column < GRID.columns; column += 1) {
                const x = column * (slotWidth + GRID.columnGap);
                const y = row * (slotHeight + GRID.rowGap);

                const slot = this.scene.add
                    .rectangle(
                        x,
                        y,
                        slotWidth,
                        slotHeight,
                        CAPTAIN_DASHBOARD_STYLE.equipmentSlot.backgroundColor,
                        CAPTAIN_DASHBOARD_STYLE.equipmentSlot.backgroundAlpha,
                    )
                    .setOrigin(0, 0)
                    .setStrokeStyle(
                        CAPTAIN_DASHBOARD_STYLE.equipmentSlot.borderThickness,
                        CAPTAIN_DASHBOARD_STYLE.equipmentSlot.borderColor,
                    );

                this.root.add(slot);
            }
        }
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
