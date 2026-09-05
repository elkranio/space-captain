// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipEquipmentGridView.ts
import { SHIELD_GENERATOR_STATUS } from "../../../../../../../../engine/defs/shield_generator";
import { SHIP_DRIVE_STATUS } from "../../../../../../../../engine/defs/ship_drive";
import { SHIP_WEAPON_KIND } from "../../../../../../../../engine/defs/ship_weapon";
import type BridgeScene from "../../../../BridgeScene";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgeEquipmentSlotPayload,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponDashboardPayload,
} from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeEquipmentSlotChromeView from "../../BridgeEquipmentSlotChromeView";
import BridgeBeamCannonTileView, {
    BEAM_CANNON_HOVER_ACTION,
    BEAM_CANNON_PROGRESS_MODE,
    type BeamCannonHoverAction,
} from "./BridgeBeamCannonTileView";
import BridgeDefenseTurretTileView, {
    DEFENSE_TURRET_PROGRESS_MODE,
} from "./BridgeDefenseTurretTileView";
import BridgeDriveTileView from "./BridgeDriveTileView";
import BridgeMissileLauncherTileView, {
    MISSILE_LAUNCHER_HOVER_ACTION,
    MISSILE_LAUNCHER_PROGRESS_MODE,
    type MissileLauncherHoverAction,
} from "./BridgeMissileLauncherTileView";
import BridgeShieldGeneratorTileView, {
    SHIELD_GENERATOR_PROGRESS_MODE,
} from "./BridgeShieldGeneratorTileView";
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

const GRID = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard.equipmentGrid;

// Базовая 4x3 сетка equipment slots.
//
// Tile coordinates come only from the player chassis + runtime equipment mounts.
// The grid never derives placement from weapon order or equipment type.
export default class BridgePlayerShipEquipmentGridView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly missileLauncherTiles = new Map<string, BridgeMissileLauncherTileView>();

    private readonly beamCannonTiles = new Map<string, BridgeBeamCannonTileView>();

    private readonly stickyMineDispenserTiles = new Map<string, BridgeStickyMineDispenserTileView>();

    private readonly spamProjectorTiles = new Map<string, BridgeSpamProjectorTileView>();

    private defenseTurretTile?: BridgeDefenseTurretTileView;

    private shieldGeneratorTile?: BridgeShieldGeneratorTileView;

    private driveTile?: BridgeDriveTileView;

    private readonly weaponsById = new Map<string, BridgePlayerWeaponDashboardPayload>();
    private selectedBeamId: string | null = null;

    private readonly slotWidth: number;

    private readonly slotHeight: number;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
        private readonly onDefenseTurretInteractionRequested: () => void,
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

                const slot = new BridgeEquipmentSlotChromeView(
                    this.scene,
                    this.slotWidth,
                    this.slotHeight,
                );
                slot.setPosition(x, y);

                this.root.add(slot.getRoot());
            }
        }

        this.eventBus.on(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handleDashboardUpdated, this);
        this.eventBus.on(BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED, this.handleBeamSelectionUpdated, this);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handleDashboardUpdated, this);
        this.eventBus.off(BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED, this.handleBeamSelectionUpdated, this);

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

        this.shieldGeneratorTile?.destroy();
        this.shieldGeneratorTile = undefined;

        this.driveTile?.destroy();
        this.driveTile = undefined;

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

        for (const weapon of weapons) {
            this.weaponsById.set(weapon.id, weapon);

            const position = this.getEquipmentPosition(weapon.slot);

            if (!position) {
                continue;
            }

            switch (weapon.kind) {
                case SHIP_WEAPON_KIND.MISSILE_LAUNCHER: {
                    visibleMissileIds.add(weapon.id);

                    const tile = this.getOrCreateMissileLauncherTile(weapon.id);

                    tile.setPosition(position.x, position.y);
                    this.updateMissileLauncherTile(tile, weapon);
                    break;
                }

                case SHIP_WEAPON_KIND.BEAM_CANNON: {
                    visibleBeamIds.add(weapon.id);

                    const tile = this.getOrCreateBeamCannonTile(weapon.id);

                    tile.setPosition(position.x, position.y);
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

                    tile.setPosition(position.x, position.y);
                    this.updateStickyMineDispenserTile(tile, weapon);
                    break;
                }

                case SHIP_WEAPON_KIND.SPAM_PROJECTOR: {
                    visibleSpamProjectorIds.add(weapon.id);

                    const tile = this.getOrCreateSpamProjectorTile(weapon.id);

                    tile.setPosition(position.x, position.y);
                    this.updateSpamProjectorTile(tile, weapon);
                    break;
                }
            }
        }

        this.reconcileDefenseTurretTile(payload);
        this.reconcileShieldGeneratorTile(payload);
        this.reconcileDriveTile(payload);

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

        this.renderBeamSelection();
    }

    private handleBeamSelectionUpdated(weaponId: string | null): void {
        this.selectedBeamId = weaponId;
        this.renderBeamSelection();
    }

    private renderBeamSelection(): void {
        const selecting = this.selectedBeamId !== null;
        const otherAlpha = selecting ? CAPTAIN_DASHBOARD_STYLE.targetSelection.blockedTileAlpha : 1;

        for (const [weaponId, tile] of this.beamCannonTiles) {
            const selected = weaponId === this.selectedBeamId;
            tile.setSelectingTarget(selected);
            tile.setInteractionEnabled(!selecting || selected);
            tile.getRoot().setAlpha(selected ? 1 : otherAlpha);
        }

        for (const tile of [
            ...this.missileLauncherTiles.values(),
            ...this.stickyMineDispenserTiles.values(),
            ...this.spamProjectorTiles.values(),
        ]) {
            tile.setInteractionEnabled(!selecting);
            tile.getRoot().setAlpha(otherAlpha);
        }

        this.defenseTurretTile?.setSelectionBlocked(selecting);
        this.defenseTurretTile?.getRoot().setAlpha(otherAlpha);
        // These two tiles currently have no input surfaces of their own.
        this.shieldGeneratorTile?.getRoot().setAlpha(otherAlpha);
        this.driveTile?.getRoot().setAlpha(otherAlpha);
    }

    private getEquipmentPosition(
        slot: BridgeEquipmentSlotPayload | undefined,
    ): { x: number; y: number } | undefined {
        if (!slot) {
            return undefined;
        }

        const column = slot.column - 1;
        const row = slot.row - 1;

        if (
            column < 0 ||
            column >= GRID.columns ||
            row < 0 ||
            row >= GRID.rows
        ) {
            throw new Error(
                "Player equipment slot is outside the 4x3 dashboard grid: " +
                    slot.column +
                    "/" +
                    slot.row,
            );
        }

        return {
            x: column * (this.slotWidth + GRID.columnGap),
            y: row * (this.slotHeight + GRID.rowGap),
        };
    }

    private reconcileDefenseTurretTile(
        payload: BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const status = payload.status;
        const defenseTurret = status?.defenseTurret;
        const position = this.getEquipmentPosition(defenseTurret?.slot);

        if (!status || !defenseTurret || !position) {
            this.defenseTurretTile?.destroy();
            this.defenseTurretTile = undefined;
            return;
        }

        if (!this.defenseTurretTile) {
            this.defenseTurretTile = new BridgeDefenseTurretTileView(
                this.scene,
                this.slotWidth,
                this.slotHeight,
                this.onDefenseTurretInteractionRequested,
            );
            this.root.add(this.defenseTurretTile.getRoot());
        }

        this.defenseTurretTile.setPosition(position.x, position.y);
        this.updateDefenseTurretTile(this.defenseTurretTile, status);
    }

    private reconcileShieldGeneratorTile(
        payload: BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const status = payload.status;
        const shield = status?.shield;
        const position = this.getEquipmentPosition(shield?.slot);

        if (!status || !shield || !position) {
            this.shieldGeneratorTile?.destroy();
            this.shieldGeneratorTile = undefined;
            return;
        }

        if (!this.shieldGeneratorTile) {
            this.shieldGeneratorTile = new BridgeShieldGeneratorTileView(
                this.scene,
                this.slotWidth,
                this.slotHeight,
            );
            this.root.add(this.shieldGeneratorTile.getRoot());
        }

        this.shieldGeneratorTile.setPosition(position.x, position.y);
        this.updateShieldGeneratorTile(this.shieldGeneratorTile, status);
    }

    private reconcileDriveTile(
        payload: BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const status = payload.status;
        const position = this.getEquipmentPosition(status?.drive.slot);

        if (!status || !position) {
            this.driveTile?.destroy();
            this.driveTile = undefined;
            return;
        }

        if (!this.driveTile) {
            this.driveTile = new BridgeDriveTileView(
                this.scene,
                this.slotWidth,
                this.slotHeight,
            );
            this.root.add(this.driveTile.getRoot());
        }

        this.driveTile.setPosition(position.x, position.y);
        this.updateDriveTile(this.driveTile, status);
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
        tile.setTargetsAvailable(defenseTurret.targets.length > 0);
        tile.setInteractionEnabled(defenseTurret.integrity.current > 0);

        if (defenseTurret.integrity.current <= 0) {
            tile.setBroken();
        } else if (defenseTurret.intercept) {
            tile.setProgress(
                DEFENSE_TURRET_PROGRESS_MODE.INTERCEPT,
                defenseTurret.intercept.progress,
            );
        } else if (defenseTurret.cooldownProgress !== undefined) {
            tile.setProgress(
                DEFENSE_TURRET_PROGRESS_MODE.COOLDOWN,
                defenseTurret.cooldownProgress,
            );
        } else if (
            status.powerCore.current < defenseTurret.powerCost ||
            defenseTurret.operatorBusy
        ) {
            tile.setResourceBlocked();
        } else {
            tile.resetProgress();
        }
    }

    private updateShieldGeneratorTile(
        tile: BridgeShieldGeneratorTileView,
        status: NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>,
    ): void {
        const shield = status.shield;

        if (!shield) {
            throw new Error("Captain dashboard Shield Generator tile requires shield payload");
        }

        tile.setTitle(shield.shortName);
        tile.setPowerCost(shield.powerCost);
        tile.setIntegrity(shield.integrity.current, shield.integrity.max);

        if (shield.status === SHIELD_GENERATOR_STATUS.BROKEN) {
            tile.setBroken();
        } else if (shield.deployment) {
            tile.setProgress(
                SHIELD_GENERATOR_PROGRESS_MODE.DEPLOYMENT,
                shield.deployment.progress,
            );
        } else if (shield.cooldownProgress !== undefined) {
            tile.setProgress(
                SHIELD_GENERATOR_PROGRESS_MODE.COOLDOWN,
                shield.cooldownProgress,
            );
        } else if (status.powerCore.current < shield.powerCost) {
            tile.setResourceBlocked();
        } else {
            tile.resetProgress();
        }
    }

    private updateDriveTile(
        tile: BridgeDriveTileView,
        status: NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>,
    ): void {
        const drive = status.drive;

        tile.setTitle(drive.shortName);
        tile.setEvadePowerCost(drive.evadePowerCost);
        tile.setIntegrity(drive.integrity, drive.maxIntegrity);

        if (drive.status === SHIP_DRIVE_STATUS.DISABLED) {
            tile.setBroken();
        } else if (status.powerCore.current < drive.evadePowerCost) {
            tile.setResourceBlocked();
        } else {
            tile.resetState();
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

        if (weapon.targetingProgress !== undefined) {
            tile.setProgress(STICKY_MINE_DISPENSER_PROGRESS_MODE.TARGETING, weapon.targetingProgress);
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
        } else if (
            weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK &&
            weapon.action.cancelTaskId
        ) {
            hoverAction = STICKY_MINE_DISPENSER_HOVER_ACTION.CANCEL;
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
        if (this.selectedBeamId !== null) {
            if (this.selectedBeamId === weaponId) {
                this.eventBus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId });
            }
            return;
        }

        const weapon = this.weaponsById.get(weaponId);

        if (!weapon) {
            return;
        }

        if (weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE && weapon.action.command) {
            if (weapon.kind === SHIP_WEAPON_KIND.BEAM_CANNON) {
                this.eventBus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId });
                return;
            }

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
