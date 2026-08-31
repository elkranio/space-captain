// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipEquipmentGridView.ts
import { SHIP_WEAPON_KIND } from "../../../../../../../../engine/defs/ship_weapon";
import type BridgeScene from "../../../../BridgeScene";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponDashboardPayload,
} from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeMissileLauncherTileView, {
    MISSILE_LAUNCHER_HOVER_ACTION,
    MISSILE_LAUNCHER_PROGRESS_MODE,
    type MissileLauncherHoverAction,
} from "./BridgeMissileLauncherTileView";

const GRID = {
    columns: 4,
    rows: 3,

    columnGap: 4,
    rowGap: 4,
} as const;

// Базовая 4x3 сетка equipment slots.
//
// Пока production-проход поддерживает только Missile Launcher.
// До появления authoritative slot coordinates оружие занимает grid cell
// по порядку полного weapons snapshot; неподдерживаемые виды оставляют cell пустым.
export default class BridgePlayerShipEquipmentGridView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileLauncherTiles = new Map<string, BridgeMissileLauncherTileView>();

    private readonly weaponsById = new Map<string, BridgePlayerWeaponDashboardPayload>();

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
            throw new Error("Player equipment grid requires positive slot size");
        }

        for (let row = 0; row < GRID.rows; row += 1) {
            for (let column = 0; column < GRID.columns; column += 1) {
                const x = column * (this.slotWidth + GRID.columnGap);
                const y = row * (this.slotHeight + GRID.rowGap);

                const slot = this.scene.add
                    .rectangle(
                        x,
                        y,
                        this.slotWidth,
                        this.slotHeight,
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

        this.eventBus.on(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handleDashboardUpdated, this);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handleDashboardUpdated, this);

        for (const tile of this.missileLauncherTiles.values()) {
            tile.destroy();
        }

        this.missileLauncherTiles.clear();
        this.weaponsById.clear();
        this.root.destroy(true);
    }

    private handleDashboardUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const weapons = payload.weapons ?? [];
        const visibleMissileIds = new Set<string>();

        this.weaponsById.clear();

        for (const [index, weapon] of weapons.entries()) {
            this.weaponsById.set(weapon.id, weapon);

            if (weapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
                continue;
            }

            if (index >= GRID.columns * GRID.rows) {
                continue;
            }

            visibleMissileIds.add(weapon.id);

            const tile = this.getOrCreateMissileLauncherTile(weapon.id);
            const column = index % GRID.columns;
            const row = Math.floor(index / GRID.columns);

            tile.setPosition(column * (this.slotWidth + GRID.columnGap), row * (this.slotHeight + GRID.rowGap));

            this.updateMissileLauncherTile(tile, weapon);
        }

        for (const [weaponId, tile] of this.missileLauncherTiles) {
            if (visibleMissileIds.has(weaponId)) {
                continue;
            }

            tile.destroy();
            this.missileLauncherTiles.delete(weaponId);
        }
    }

    private getOrCreateMissileLauncherTile(weaponId: string): BridgeMissileLauncherTileView {
        const existing = this.missileLauncherTiles.get(weaponId);

        if (existing) {
            return existing;
        }

        const tile = new BridgeMissileLauncherTileView(this.scene, this.slotWidth, this.slotHeight, () =>
            this.handleMissileLauncherActionRequested(weaponId),
        );

        this.missileLauncherTiles.set(weaponId, tile);
        this.root.add(tile.getRoot());

        return tile;
    }

    private updateMissileLauncherTile(
        tile: BridgeMissileLauncherTileView,
        weapon: BridgePlayerWeaponDashboardPayload,
    ): void {
        if (!weapon.ammo) {
            throw new Error("Captain dashboard Missile Launcher requires ammo payload: " + weapon.id);
        }

        if (!weapon.integrity) {
            throw new Error("Captain dashboard Missile Launcher requires integrity payload: " + weapon.id);
        }

        tile.setAmmo(weapon.ammo.current);
        tile.setIntegrity(weapon.integrity.current, weapon.integrity.max);

        if (weapon.targetingProgress !== undefined) {
            tile.setProgress(MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING, weapon.targetingProgress);
        } else if (weapon.cooldownProgress !== undefined) {
            tile.setProgress(MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN, weapon.cooldownProgress);
        } else {
            tile.resetProgress();
        }

        let hoverAction: MissileLauncherHoverAction = MISSILE_LAUNCHER_HOVER_ACTION.NONE;

        if (weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE) {
            hoverAction = MISSILE_LAUNCHER_HOVER_ACTION.FIRE;
        } else if (
            weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK &&
            weapon.action.cancelTaskId
        ) {
            hoverAction = MISSILE_LAUNCHER_HOVER_ACTION.CANCEL;
        }

        tile.setHoverAction(hoverAction);
    }

    private handleMissileLauncherActionRequested(weaponId: string): void {
        const weapon = this.weaponsById.get(weaponId);

        if (!weapon) {
            return;
        }

        if (weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE && weapon.action.command) {
            this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, weapon.action.command);
            return;
        }

        if (
            weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK &&
            weapon.action.cancelTaskId
        ) {
            this.eventBus.emit(BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED, {
                taskId: weapon.action.cancelTaskId,
            });
        }
    }
}
