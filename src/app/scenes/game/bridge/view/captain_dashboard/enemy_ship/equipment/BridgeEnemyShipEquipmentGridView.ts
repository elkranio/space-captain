import type BridgeScene from "../../../../BridgeScene";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDashboardUpdatedPayload,
    type BridgeEquipmentSlotPayload,
} from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import BridgeEnemyEquipmentTileView from "./BridgeEnemyEquipmentTileView";

const GRID = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard.equipmentGrid;

// Enemy chassis keeps canonical slot coordinates.
// Only this view mirrors columns so the physical board reads toward the center.
export default class BridgeEnemyShipEquipmentGridView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly tiles = new Map<string, BridgeEnemyEquipmentTileView>();
    private selectingTarget = false;
    private pulseElapsedMs = 0;

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
        this.eventBus.on(BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED, this.handleBeamSelectionUpdated, this);
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED, this.handleBeamSelectionUpdated, this);
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
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
            tile.setTargetSelectionEnabled(this.selectingTarget);
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

    private handleBeamSelectionUpdated(weaponId: string | null): void {
        this.selectingTarget = weaponId !== null;
        this.pulseElapsedMs = 0;
        for (const tile of this.tiles.values()) {
            tile.setTargetSelectionEnabled(this.selectingTarget);
            tile.setTargetPulse(1);
        }
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        if (!this.selectingTarget) {
            return;
        }

        const style = CAPTAIN_DASHBOARD_STYLE.targetSelection;
        this.pulseElapsedMs = (this.pulseElapsedMs + deltaMs) % (style.pulseDurationMs * 2);
        const wave = (1 + Math.cos(Math.PI * this.pulseElapsedMs / style.pulseDurationMs)) / 2;
        const alpha = style.pulseMinAlpha + (1 - style.pulseMinAlpha) * wave;
        for (const tile of this.tiles.values()) {
            tile.setTargetPulse(alpha);
        }
    }

    private clearTiles(): void {
        for (const tile of this.tiles.values()) {
            tile.destroy();
        }

        this.tiles.clear();
    }
}
