import type BridgeScene from "../../../../BridgeScene";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDashboardUpdatedPayload,
    type BridgeEquipmentSlotPayload,
} from "../../../../events/bridge_event";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import BridgeEnemyEquipmentTileView from "./BridgeEnemyEquipmentTileView";

const GRID = {
    columns: 4,
    rows: 3,

    columnGap: 4,
    rowGap: 4,
} as const;

// Enemy chassis keeps canonical slot coordinates.
// Only this view mirrors columns so the physical board reads toward the center.
export default class BridgeEnemyShipEquipmentGridView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly tiles = new Map<string, BridgeEnemyEquipmentTileView>();

    private readonly slotWidth: number;

    private readonly slotHeight: number;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.slotWidth = Math.floor((width - GRID.columnGap * (GRID.columns - 1)) / GRID.columns);
        this.slotHeight = Math.floor((height - GRID.rowGap * (GRID.rows - 1)) / GRID.rows);

        if (this.slotWidth <= 0 || this.slotHeight <= 0) {
            throw new Error("Enemy equipment grid requires positive slot size");
        }

        for (let row = 0; row < GRID.rows; row += 1) {
            for (let column = 0; column < GRID.columns; column += 1) {
                const x = column * (this.slotWidth + GRID.columnGap);
                const y = row * (this.slotHeight + GRID.rowGap);

                const slot = new BridgeEquipmentSlotChromeView(
                    this.scene,
                    this.slotWidth,
                    this.slotHeight,
                );
                slot.setPosition(x, y);

                this.root.add(slot.getRoot());
            }
        }

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );

        this.clearTiles();
        this.root.destroy(true);
    }

    private handleDashboardUpdated(payload: BridgeEnemyShipDashboardUpdatedPayload): void {
        if (!payload) {
            this.clearTiles();
            return;
        }

        const visibleIds = new Set<string>();

        for (const equipment of payload.equipment) {
            const position = this.getEquipmentPosition(equipment.slot);

            visibleIds.add(equipment.id);

            let tile = this.tiles.get(equipment.id);

            if (!tile) {
                tile = new BridgeEnemyEquipmentTileView(
                    this.scene,
                    this.slotWidth,
                    this.slotHeight,
                    equipment.sprite,
                );

                this.tiles.set(equipment.id, tile);
                this.root.add(tile.getRoot());
            }

            tile.setPosition(position.x, position.y);
            tile.update(equipment);
        }

        for (const [equipmentId, tile] of this.tiles) {
            if (visibleIds.has(equipmentId)) {
                continue;
            }

            tile.destroy();
            this.tiles.delete(equipmentId);
        }
    }

    private getEquipmentPosition(slot: BridgeEquipmentSlotPayload): { x: number; y: number } {
        const canonicalColumn = slot.column - 1;
        const row = slot.row - 1;

        if (
            canonicalColumn < 0 ||
            canonicalColumn >= GRID.columns ||
            row < 0 ||
            row >= GRID.rows
        ) {
            throw new Error(
                "Enemy equipment slot is outside the 4x3 dashboard grid: " +
                    slot.column +
                    "/" +
                    slot.row,
            );
        }

        const displayColumn = GRID.columns - 1 - canonicalColumn;

        return {
            x: displayColumn * (this.slotWidth + GRID.columnGap),
            y: row * (this.slotHeight + GRID.rowGap),
        };
    }

    private clearTiles(): void {
        for (const tile of this.tiles.values()) {
            tile.destroy();
        }

        this.tiles.clear();
    }
}
