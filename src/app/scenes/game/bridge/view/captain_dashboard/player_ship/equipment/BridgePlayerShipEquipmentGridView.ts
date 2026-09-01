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
import BridgeBeamCannonTileView, {
    BEAM_CANNON_HOVER_ACTION,
    BEAM_CANNON_PROGRESS_MODE,
    type BeamCannonHoverAction,
} from "./BridgeBeamCannonTileView";
import BridgeDefenseTurretTileView, {
    DEFENSE_TURRET_PROGRESS_MODE,
} from "./BridgeDefenseTurretTileView";
import BridgeMissileLauncherTileView, {
    MISSILE_LAUNCHER_HOVER_ACTION,
    MISSILE_LAUNCHER_PROGRESS_MODE,
    type MissileLauncherHoverAction,
} from "./BridgeMissileLauncherTileView";
import BridgeSpamProjectorTileView, {
    SPAM_PROJECTOR_HOVER_ACTION,
    SPAM_PROJECTOR_PROGRESS_MODE,
    type SpamProjectorHoverAction,
} from "./BridgeSpamProjectorTileView";
import BridgeStickyMineDispenserTileView, {
    STICKY_MINE_DISPENSER_HOVER_ACTION,
    STICKY_MINE_DISPENSER_PROGRESS_MODE,
    type StickyMineDispenserHoverAction,
} from "./BridgeStickyMineDispenserTileView";

const GRID = {
    columns: 4,
    rows: 3,

    columnGap: 4,
    rowGap: 4,
} as const;

// Базовая 4x3 сетка equipment slots.
//
// Пока production-проход поддерживает все четыре текущих вида player weapons.
// До появления authoritative slot coordinates оружие занимает grid cell
// по порядку полного weapons snapshot.
export default class BridgePlayerShipEquipmentGridView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileLauncherTiles = new Map<string, BridgeMissileLauncherTileView>();

    private readonly beamCannonTiles = new Map<string, BridgeBeamCannonTileView>();

    private readonly stickyMineDispenserTiles = new Map<string, BridgeStickyMineDispenserTileView>();

    private readonly spamProjectorTiles = new Map<string, BridgeSpamProjectorTileView>();

    private defenseTurretTile?: BridgeDefenseTurretTileView;

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

        for (const tile of this.beamCannonTiles.values()) {
            tile.destroy();
        }

        for (const tile of this.stickyMineDispenserTiles.values()) {
            tile.destroy();
        }

        for (const tile of this.spamProjectorTiles.values()) {
            tile.destroy();
        }

        this.defenseTurretTile?.destroy();
        this.defenseTurretTile = undefined;

        this.missileLauncherTiles.clear();
        this.beamCannonTiles.clear();
        this.stickyMineDispenserTiles.clear();
        this.spamProjectorTiles.clear();
        this.weaponsById.clear();
        this.root.destroy(true);
    }

    private handleDashboardUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const weapons = payload.weapons ?? [];
        const visibleMissileIds = new Set<string>();
        const visibleBeamIds = new Set<string>();
        const visibleStickyMineDispenserIds = new Set<string>();
        const visibleSpamProjectorIds = new Set<string>();

        this.weaponsById.clear();

        for (const [index, weapon] of weapons.entries()) {
            this.weaponsById.set(weapon.id, weapon);

            if (index >= GRID.columns * GRID.rows) {
                continue;
            }

            const column = index % GRID.columns;
            const row = Math.floor(index / GRID.columns);
            const x = column * (this.slotWidth + GRID.columnGap);
            const y = row * (this.slotHeight + GRID.rowGap);

            switch (weapon.kind) {
                case SHIP_WEAPON_KIND.MISSILE_LAUNCHER: {
                    visibleMissileIds.add(weapon.id);

                    const tile = this.getOrCreateMissileLauncherTile(weapon.id);

                    tile.setPosition(x, y);
                    this.updateMissileLauncherTile(tile, weapon);
                    break;
                }

                case SHIP_WEAPON_KIND.BEAM_CANNON: {
                    visibleBeamIds.add(weapon.id);

                    const tile = this.getOrCreateBeamCannonTile(weapon.id);

                    tile.setPosition(x, y);
                    this.updateBeamCannonTile(
                        tile,
                        weapon,
                        payload.status?.powerCore.current,
                    );
                    break;
                }

                case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER: {
                    visibleStickyMineDispenserIds.add(weapon.id);

                    const tile = this.getOrCreateStickyMineDispenserTile(weapon.id);

                    tile.setPosition(x, y);
                    this.updateStickyMineDispenserTile(tile, weapon);
                    break;
                }

                case SHIP_WEAPON_KIND.SPAM_PROJECTOR: {
                    visibleSpamProjectorIds.add(weapon.id);

                    const tile = this.getOrCreateSpamProjectorTile(weapon.id);

                    tile.setPosition(x, y);
                    this.updateSpamProjectorTile(tile, weapon);
                    break;
                }
            }
        }

        this.reconcileDefenseTurretTile(payload, weapons.length);

        for (const [weaponId, tile] of this.missileLauncherTiles) {
            if (visibleMissileIds.has(weaponId)) {
                continue;
            }

            tile.destroy();
            this.missileLauncherTiles.delete(weaponId);
        }

        for (const [weaponId, tile] of this.beamCannonTiles) {
            if (visibleBeamIds.has(weaponId)) {
                continue;
            }

            tile.destroy();
            this.beamCannonTiles.delete(weaponId);
        }

        for (const [weaponId, tile] of this.stickyMineDispenserTiles) {
            if (visibleStickyMineDispenserIds.has(weaponId)) {
                continue;
            }

            tile.destroy();
            this.stickyMineDispenserTiles.delete(weaponId);
        }

        for (const [weaponId, tile] of this.spamProjectorTiles) {
            if (visibleSpamProjectorIds.has(weaponId)) {
                continue;
            }

            tile.destroy();
            this.spamProjectorTiles.delete(weaponId);
        }
    }

    private reconcileDefenseTurretTile(
        payload: BridgePlayerShipDashboardUpdatedPayload,
        slotIndex: number,
    ): void {
        const status = payload.status;
        const defenseTurret = status?.defenseTurret;

        if (!status || !defenseTurret || slotIndex >= GRID.columns * GRID.rows) {
            this.defenseTurretTile?.destroy();
            this.defenseTurretTile = undefined;
            return;
        }

        if (!this.defenseTurretTile) {
            this.defenseTurretTile = new BridgeDefenseTurretTileView(
                this.scene,
                this.slotWidth,
                this.slotHeight,
            );
            this.root.add(this.defenseTurretTile.getRoot());
        }

        const column = slotIndex % GRID.columns;
        const row = Math.floor(slotIndex / GRID.columns);
        const x = column * (this.slotWidth + GRID.columnGap);
        const y = row * (this.slotHeight + GRID.rowGap);

        this.defenseTurretTile.setPosition(x, y);
        this.updateDefenseTurretTile(this.defenseTurretTile, status);
    }

    private getOrCreateStickyMineDispenserTile(weaponId: string): BridgeStickyMineDispenserTileView {
        const existing = this.stickyMineDispenserTiles.get(weaponId);

        if (existing) {
            return existing;
        }

        const tile = new BridgeStickyMineDispenserTileView(this.scene, this.slotWidth, this.slotHeight, () => {
            this.handleWeaponActionRequested(weaponId);
        });

        this.stickyMineDispenserTiles.set(weaponId, tile);
        this.root.add(tile.getRoot());

        return tile;
    }

    private getOrCreateSpamProjectorTile(weaponId: string): BridgeSpamProjectorTileView {
        const existing = this.spamProjectorTiles.get(weaponId);

        if (existing) {
            return existing;
        }

        const tile = new BridgeSpamProjectorTileView(this.scene, this.slotWidth, this.slotHeight, () => {
            this.handleWeaponActionRequested(weaponId);
        });

        this.spamProjectorTiles.set(weaponId, tile);
        this.root.add(tile.getRoot());

        return tile;
    }

    private getOrCreateMissileLauncherTile(weaponId: string): BridgeMissileLauncherTileView {
        const existing = this.missileLauncherTiles.get(weaponId);

        if (existing) {
            return existing;
        }

        const tile = new BridgeMissileLauncherTileView(this.scene, this.slotWidth, this.slotHeight, () =>
            this.handleWeaponActionRequested(weaponId),
        );

        this.missileLauncherTiles.set(weaponId, tile);
        this.root.add(tile.getRoot());

        return tile;
    }

    private getOrCreateBeamCannonTile(weaponId: string): BridgeBeamCannonTileView {
        const existing = this.beamCannonTiles.get(weaponId);

        if (existing) {
            return existing;
        }

        const tile = new BridgeBeamCannonTileView(this.scene, this.slotWidth, this.slotHeight, () =>
            this.handleWeaponActionRequested(weaponId),
        );

        this.beamCannonTiles.set(weaponId, tile);
        this.root.add(tile.getRoot());

        return tile;
    }

    private updateDefenseTurretTile(
        tile: BridgeDefenseTurretTileView,
        status: NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>,
    ): void {
        const defenseTurret = status.defenseTurret;

        if (!defenseTurret) {
            throw new Error("Captain dashboard Defense Turret tile requires turret payload");
        }

        tile.setTitle(defenseTurret.shortName);
        tile.setPowerCost(defenseTurret.powerCost);
        tile.setIntegrity(defenseTurret.integrity.current, defenseTurret.integrity.max);

        if (defenseTurret.intercept) {
            tile.setProgress(
                DEFENSE_TURRET_PROGRESS_MODE.INTERCEPT,
                defenseTurret.intercept.progress,
            );
        } else if (defenseTurret.cooldownProgress !== undefined) {
            tile.setProgress(
                DEFENSE_TURRET_PROGRESS_MODE.COOLDOWN,
                defenseTurret.cooldownProgress,
            );
        } else if (status.powerCore.current < defenseTurret.powerCost) {
            tile.setResourceBlocked();
        } else {
            tile.resetProgress();
        }
    }

    private updateStickyMineDispenserTile(
        tile: BridgeStickyMineDispenserTileView,
        weapon: BridgePlayerWeaponDashboardPayload,
    ): void {
        if (!weapon.ammo) {
            throw new Error("Captain dashboard Sticky Mine Dispenser requires ammo payload: " + weapon.id);
        }

        if (!weapon.integrity) {
            throw new Error("Captain dashboard Sticky Mine Dispenser requires integrity payload: " + weapon.id);
        }

        tile.setTitle(weapon.shortName);
        tile.setAmmo(weapon.ammo.current);
        tile.setIntegrity(weapon.integrity.current, weapon.integrity.max);

        if (weapon.dispensingProgress !== undefined) {
            tile.setProgress(STICKY_MINE_DISPENSER_PROGRESS_MODE.DISPENSING, weapon.dispensingProgress);
        } else if (weapon.cooldownProgress !== undefined) {
            tile.setProgress(STICKY_MINE_DISPENSER_PROGRESS_MODE.COOLDOWN, weapon.cooldownProgress);
        } else if (weapon.ammo.current === 0) {
            tile.setResourceBlocked();
        } else {
            tile.resetProgress();
        }

        let hoverAction: StickyMineDispenserHoverAction = STICKY_MINE_DISPENSER_HOVER_ACTION.NONE;

        if (weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE) {
            hoverAction = STICKY_MINE_DISPENSER_HOVER_ACTION.FIRE;
        }

        tile.setHoverAction(hoverAction);
    }

    private updateSpamProjectorTile(
        tile: BridgeSpamProjectorTileView,
        weapon: BridgePlayerWeaponDashboardPayload,
    ): void {
        if (!weapon.integrity) {
            throw new Error("Captain dashboard SPAM Projector requires integrity payload: " + weapon.id);
        }

        tile.setTitle(weapon.shortName);
        tile.setPurged(weapon.purged === true);
        tile.setIntegrity(weapon.integrity.current, weapon.integrity.max);

        if (weapon.channelingProgress !== undefined) {
            tile.setProgress(SPAM_PROJECTOR_PROGRESS_MODE.CHANNELING, weapon.channelingProgress);
        } else if (weapon.cooldownProgress !== undefined) {
            tile.setProgress(SPAM_PROJECTOR_PROGRESS_MODE.COOLDOWN, weapon.cooldownProgress);
        } else {
            tile.resetProgress();
        }

        let hoverAction: SpamProjectorHoverAction = SPAM_PROJECTOR_HOVER_ACTION.NONE;

        if (weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE) {
            hoverAction = SPAM_PROJECTOR_HOVER_ACTION.FIRE;
        } else if (
            weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK &&
            weapon.action.cancelTaskId
        ) {
            hoverAction = SPAM_PROJECTOR_HOVER_ACTION.CANCEL;
        }

        tile.setHoverAction(hoverAction);
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

        tile.setTitle(weapon.shortName);
        tile.setAmmo(weapon.ammo.current);
        tile.setIntegrity(weapon.integrity.current, weapon.integrity.max);

        if (weapon.targetingProgress !== undefined) {
            tile.setProgress(MISSILE_LAUNCHER_PROGRESS_MODE.TARGETING, weapon.targetingProgress);
        } else if (weapon.cooldownProgress !== undefined) {
            tile.setProgress(MISSILE_LAUNCHER_PROGRESS_MODE.COOLDOWN, weapon.cooldownProgress);
        } else if (weapon.ammo.current === 0) {
            tile.setResourceBlocked();
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

    private updateBeamCannonTile(
        tile: BridgeBeamCannonTileView,
        weapon: BridgePlayerWeaponDashboardPayload,
        powerCoreCharges: number | undefined,
    ): void {
        if (weapon.powerCost === undefined) {
            throw new Error("Captain dashboard Beam Cannon requires power cost payload: " + weapon.id);
        }

        if (!weapon.integrity) {
            throw new Error("Captain dashboard Beam Cannon requires integrity payload: " + weapon.id);
        }

        tile.setTitle(weapon.shortName);
        tile.setPowerCost(weapon.powerCost);
        tile.setIntegrity(weapon.integrity.current, weapon.integrity.max);

        if (weapon.chargingProgress !== undefined) {
            tile.setProgress(BEAM_CANNON_PROGRESS_MODE.CHARGING, weapon.chargingProgress);
        } else if (weapon.cooldownProgress !== undefined) {
            tile.setProgress(BEAM_CANNON_PROGRESS_MODE.COOLDOWN, weapon.cooldownProgress);
        } else if (powerCoreCharges !== undefined && powerCoreCharges < weapon.powerCost) {
            tile.setResourceBlocked();
        } else {
            tile.resetProgress();
        }

        let hoverAction: BeamCannonHoverAction = BEAM_CANNON_HOVER_ACTION.NONE;

        if (weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE) {
            hoverAction = BEAM_CANNON_HOVER_ACTION.FIRE;
        } else if (
            weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK &&
            weapon.action.cancelTaskId
        ) {
            hoverAction = BEAM_CANNON_HOVER_ACTION.CANCEL;
        }

        tile.setHoverAction(hoverAction);
    }

    private handleWeaponActionRequested(weaponId: string): void {
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
