// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgePlayerShipChassisView.ts
import {
    SHIP_CHASSIS_SURFACE_HEIGHT,
    SHIP_CHASSIS_SURFACE_WIDTH,
} from "../../../../../../../../engine/defs/ship_chassis";
import { SHIP_SLOT_HEIGHT, SHIP_SLOT_KIND, SHIP_SLOT_WIDTH } from "../../../../../../../../engine/defs/ship_slot";
import { SHIELD_GENERATOR_STATUS } from "../../../../../../../../engine/defs/shield_generator";
import { SHIP_WEAPON_KIND } from "../../../../../../../../engine/defs/ship_weapon";
import { EQUIPMENT_SPRITE_ID, EQUIPMENT_SPRITES } from "../../../../../../../manifests/equipment";
import { DEFAULT_ATLAS_KEY } from "../../../../../../../manifests/types";
import type BridgeScene from "../../../../BridgeScene";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerChassisPayload,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponDashboardPayload,
} from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeBeamCannonTileView, {
    BEAM_CANNON_HOVER_ACTION,
    BEAM_CANNON_PROGRESS_MODE,
    type BeamCannonHoverAction,
} from "./BridgeBeamCannonTileView";
import BridgeDefenseTurretTileView, { DEFENSE_TURRET_PROGRESS_MODE } from "./BridgeDefenseTurretTileView";
import BridgeDriveTileView from "./BridgeDriveTileView";
import BridgePowerCoreTileView from "./BridgePowerCoreTileView";
import BridgeMissileLauncherTileView, {
    MISSILE_LAUNCHER_HOVER_ACTION,
    MISSILE_LAUNCHER_PROGRESS_MODE,
    type MissileLauncherHoverAction,
} from "./BridgeMissileLauncherTileView";
import BridgeShieldGeneratorTileView, { SHIELD_GENERATOR_PROGRESS_MODE } from "./BridgeShieldGeneratorTileView";
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

const SEMANTIC_TILE = CAPTAIN_DASHBOARD_LAYOUT.semanticTile;

type PlayerWeaponTileEntry =
    | {
          kind: typeof SHIP_WEAPON_KIND.MISSILE_LAUNCHER;
          tile: BridgeMissileLauncherTileView;
      }
    | {
          kind: typeof SHIP_WEAPON_KIND.BEAM_CANNON;
          tile: BridgeBeamCannonTileView;
      }
    | {
          kind: typeof SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER;
          tile: BridgeStickyMineDispenserTileView;
      }
    | {
          kind: typeof SHIP_WEAPON_KIND.SPAM_PROJECTOR;
          tile: BridgeSpamProjectorTileView;
      };

// Player chassis schematic.
// Blueprint and slot geometry come from one chassis payload; this view only maps
// the centered authoring surface into the available dashboard bounds.
export default class BridgePlayerShipChassisView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly schematicLayer: Phaser.GameObjects.Container;

    private readonly blueprintLayer: Phaser.GameObjects.Container;

    private readonly slotLayer: Phaser.GameObjects.Container;

    private readonly equipmentLayer: Phaser.GameObjects.Container;

    private readonly weaponTiles = new Map<string, PlayerWeaponTileEntry>();

    private defenseTurretTile?: BridgeDefenseTurretTileView;

    private shieldGeneratorTile?: BridgeShieldGeneratorTileView;

    private driveTile?: BridgeDriveTileView;

    private powerCoreTile?: BridgePowerCoreTileView;

    private readonly weaponsById = new Map<string, BridgePlayerWeaponDashboardPayload>();
    private selectedBeamId: string | null = null;

    private readonly slotPositions = new Map<string, { x: number; y: number }>();

    private chassisKey = "";

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

        this.slotWidth = SHIP_SLOT_WIDTH;
        this.slotHeight = SHIP_SLOT_HEIGHT;

        const scale = Math.min(1, width / SHIP_CHASSIS_SURFACE_WIDTH, height / SHIP_CHASSIS_SURFACE_HEIGHT);

        this.schematicLayer = this.scene.add.container(
            Math.round((width - SHIP_CHASSIS_SURFACE_WIDTH * scale) / 2),
            Math.round((height - SHIP_CHASSIS_SURFACE_HEIGHT * scale) / 2),
        );
        this.schematicLayer.setScale(scale);

        this.blueprintLayer = this.scene.add.container(0, 0);
        this.slotLayer = this.scene.add.container(0, 0);
        this.equipmentLayer = this.scene.add.container(0, 0);
        this.schematicLayer.add([this.blueprintLayer, this.slotLayer, this.equipmentLayer]);
        this.root.add(this.schematicLayer);

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

        for (const entry of this.weaponTiles.values()) {
            entry.tile.destroy();
        }

        this.defenseTurretTile?.destroy();
        this.defenseTurretTile = undefined;

        this.shieldGeneratorTile?.destroy();
        this.shieldGeneratorTile = undefined;

        this.driveTile?.destroy();
        this.driveTile = undefined;

        this.powerCoreTile?.destroy();
        this.powerCoreTile = undefined;

        this.weaponTiles.clear();
        this.weaponsById.clear();
        this.slotPositions.clear();
        this.root.destroy(true);
    }

    private renderChassis(chassis: BridgePlayerChassisPayload | undefined): void {
        const nextChassisKey = JSON.stringify(chassis ?? null);

        if (nextChassisKey === this.chassisKey) {
            return;
        }

        this.chassisKey = nextChassisKey;
        this.slotPositions.clear();
        this.blueprintLayer.removeAll(true);
        this.slotLayer.removeAll(true);

        if (!chassis) {
            return;
        }

        const blueprint = this.scene.add.image(
            SHIP_CHASSIS_SURFACE_WIDTH / 2,
            SHIP_CHASSIS_SURFACE_HEIGHT / 2,
            DEFAULT_ATLAS_KEY,
            "world/ships/blueprints/" + chassis.blueprintId,
        );
        this.blueprintLayer.add(blueprint);

        const slotFrameAsset = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.SLOT_FRAME];

        for (const slot of chassis.slots) {
            const position = {
                x: SHIP_CHASSIS_SURFACE_WIDTH / 2 + slot.x - SHIP_SLOT_WIDTH / 2,
                y: SHIP_CHASSIS_SURFACE_HEIGHT / 2 + slot.y - SHIP_SLOT_HEIGHT / 2,
            };

            this.slotPositions.set(slot.id, position);

            const frame = this.scene.add
                .image(position.x, position.y, slotFrameAsset.atlasKey, slotFrameAsset.frameKey)
                .setOrigin(0, 0);
            this.slotLayer.add(frame);

            if (slot.kind !== SHIP_SLOT_KIND.HULL && slot.kind !== SHIP_SLOT_KIND.BRIDGE) {
                continue;
            }

            const icon = this.scene.add
                .image(
                    position.x + SHIP_SLOT_WIDTH / 2 + SEMANTIC_TILE.iconCenterOffsetX,
                    position.y + SHIP_SLOT_HEIGHT / 2 + SEMANTIC_TILE.iconCenterOffsetY,
                    DEFAULT_ATLAS_KEY,
                    "equipment/icons/" + slot.kind,
                )
                .setOrigin(0.5);

            const iconScale = Math.min(
                SEMANTIC_TILE.iconMaxWidth / icon.width,
                SEMANTIC_TILE.iconMaxHeight / icon.height,
            );

            icon.setDisplaySize(
                Math.round(icon.width * iconScale),
                Math.round(icon.height * iconScale),
            );

            this.slotLayer.add(icon);
        }
    }

    private handleDashboardUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        this.renderChassis(payload.chassis);

        const visibleWeaponIds = new Set<string>();

        this.weaponsById.clear();

        for (const weapon of payload.weapons ?? []) {
            this.weaponsById.set(weapon.id, weapon);

            const position = this.getEquipmentPosition(weapon.slotId);

            if (!position) {
                continue;
            }

            visibleWeaponIds.add(weapon.id);

            const entry = this.getOrCreateWeaponTile(weapon);

            entry.tile.setPosition(position.x, position.y);

            this.updateWeaponTile(
                entry,
                weapon,
                payload.status ? payload.status.powerCore?.current ?? 0 : undefined,
            );
        }

        this.reconcileDefenseTurretTile(payload);
        this.reconcileShieldGeneratorTile(payload);
        this.reconcileDriveTile(payload);
        this.reconcilePowerCoreTile(payload);

        for (const [weaponId, entry] of this.weaponTiles) {
            if (visibleWeaponIds.has(weaponId)) {
                continue;
            }

            entry.tile.destroy();
            this.weaponTiles.delete(weaponId);
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

        for (const [weaponId, entry] of this.weaponTiles) {
            switch (entry.kind) {
                case SHIP_WEAPON_KIND.BEAM_CANNON: {
                    const selected = weaponId === this.selectedBeamId;

                    entry.tile.setSelectingTarget(selected);
                    entry.tile.setInteractionEnabled(!selecting || selected);
                    entry.tile.getRoot().setAlpha(selected ? 1 : otherAlpha);
                    break;
                }

                case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                    entry.tile.setInteractionEnabled(!selecting);
                    entry.tile.getRoot().setAlpha(otherAlpha);
                    break;

                default: {
                    const exhaustiveEntry: never = entry;

                    return exhaustiveEntry;
                }
            }
        }

        this.defenseTurretTile?.setSelectionBlocked(selecting);
        this.defenseTurretTile?.getRoot().setAlpha(otherAlpha);
        // These tiles currently have no input surfaces of their own.
        this.shieldGeneratorTile?.getRoot().setAlpha(otherAlpha);
        this.driveTile?.getRoot().setAlpha(otherAlpha);
        this.powerCoreTile?.getRoot().setAlpha(otherAlpha);
    }

    private getEquipmentPosition(slotId: string | undefined): { x: number; y: number } | undefined {
        if (!slotId) {
            return undefined;
        }

        const position = this.slotPositions.get(slotId);

        if (!position) {
            throw new Error("Player equipment chassis slot not found: " + slotId);
        }

        return position;
    }

    private reconcilePowerCoreTile(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const powerCore = payload.status?.powerCore;
        const position = this.getEquipmentPosition(powerCore?.slotId);

        if (!powerCore || !position) {
            this.powerCoreTile?.destroy();
            this.powerCoreTile = undefined;
            return;
        }

        if (!this.powerCoreTile) {
            this.powerCoreTile = new BridgePowerCoreTileView(
                this.scene,
                powerCore.iconId,
                this.slotWidth,
                this.slotHeight,
            );
            this.equipmentLayer.add(this.powerCoreTile.getRoot());
        }

        this.powerCoreTile.setPosition(position.x, position.y);
        this.powerCoreTile.setIntegrity(
            powerCore.integrity.current,
            powerCore.integrity.max,
        );
    }

    private reconcileDefenseTurretTile(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const status = payload.status;
        const defenseTurret = status?.defenseTurret;
        const position = this.getEquipmentPosition(defenseTurret?.slotId);

        if (!status || !defenseTurret || !position) {
            this.defenseTurretTile?.destroy();
            this.defenseTurretTile = undefined;
            return;
        }

        if (!this.defenseTurretTile) {
            this.defenseTurretTile = new BridgeDefenseTurretTileView(
                this.scene,
                defenseTurret.iconId,
                this.slotWidth,
                this.slotHeight,
                this.onDefenseTurretInteractionRequested,
            );
            this.equipmentLayer.add(this.defenseTurretTile.getRoot());
        }

        this.defenseTurretTile.setPosition(position.x, position.y);
        this.updateDefenseTurretTile(this.defenseTurretTile, status);
    }

    private reconcileShieldGeneratorTile(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const status = payload.status;
        const shield = status?.shield;
        const position = this.getEquipmentPosition(shield?.slotId);

        if (!status || !shield || !position) {
            this.shieldGeneratorTile?.destroy();
            this.shieldGeneratorTile = undefined;
            return;
        }

        if (!this.shieldGeneratorTile) {
            this.shieldGeneratorTile = new BridgeShieldGeneratorTileView(
                this.scene,
                shield.iconId,
                this.slotWidth,
                this.slotHeight,
            );
            this.equipmentLayer.add(this.shieldGeneratorTile.getRoot());
        }

        this.shieldGeneratorTile.setPosition(position.x, position.y);
        this.updateShieldGeneratorTile(this.shieldGeneratorTile, status);
    }

    private reconcileDriveTile(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const status = payload.status;
        const position = this.getEquipmentPosition(status?.drive.slotId);

        if (!status || !position) {
            this.driveTile?.destroy();
            this.driveTile = undefined;
            return;
        }

        if (!this.driveTile) {
            this.driveTile = new BridgeDriveTileView(
                this.scene,
                status.drive.iconId,
                this.slotWidth,
                this.slotHeight,
            );
            this.equipmentLayer.add(this.driveTile.getRoot());
        }

        this.driveTile.setPosition(position.x, position.y);
        this.updateDriveTile(this.driveTile, status);
    }

    private getOrCreateWeaponTile(weapon: BridgePlayerWeaponDashboardPayload): PlayerWeaponTileEntry {
        const existing = this.weaponTiles.get(weapon.id);

        if (existing?.kind === weapon.kind) {
            return existing;
        }

        existing?.tile.destroy();

        const handleActionRequested = () => {
            this.handleWeaponActionRequested(weapon.id);
        };

        let entry: PlayerWeaponTileEntry;

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                entry = {
                    kind: weapon.kind,
                    tile: new BridgeMissileLauncherTileView(
                        this.scene,
                        weapon.iconId,
                        this.slotWidth,
                        this.slotHeight,
                        handleActionRequested,
                    ),
                };
                break;

            case SHIP_WEAPON_KIND.BEAM_CANNON:
                entry = {
                    kind: weapon.kind,
                    tile: new BridgeBeamCannonTileView(
                        this.scene,
                        weapon.iconId,
                        this.slotWidth,
                        this.slotHeight,
                        handleActionRequested,
                    ),
                };
                break;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                entry = {
                    kind: weapon.kind,
                    tile: new BridgeStickyMineDispenserTileView(
                        this.scene,
                        weapon.iconId,
                        this.slotWidth,
                        this.slotHeight,
                        handleActionRequested,
                    ),
                };
                break;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                entry = {
                    kind: weapon.kind,
                    tile: new BridgeSpamProjectorTileView(
                        this.scene,
                        weapon.iconId,
                        this.slotWidth,
                        this.slotHeight,
                        handleActionRequested,
                    ),
                };
                break;

            default: {
                const exhaustiveKind: never = weapon.kind;

                return exhaustiveKind;
            }
        }

        this.weaponTiles.set(weapon.id, entry);
        this.equipmentLayer.add(entry.tile.getRoot());

        return entry;
    }

    private updateWeaponTile(
        entry: PlayerWeaponTileEntry,
        weapon: BridgePlayerWeaponDashboardPayload,
        powerCoreCharges: number | undefined,
    ): void {
        switch (entry.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                this.updateMissileLauncherTile(entry.tile, weapon);
                return;

            case SHIP_WEAPON_KIND.BEAM_CANNON:
                this.updateBeamCannonTile(entry.tile, weapon, powerCoreCharges);
                return;

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                this.updateStickyMineDispenserTile(entry.tile, weapon);
                return;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                this.updateSpamProjectorTile(entry.tile, weapon);
                return;

            default: {
                const exhaustiveEntry: never = entry;

                return exhaustiveEntry;
            }
        }
    }

    private updateDefenseTurretTile(
        tile: BridgeDefenseTurretTileView,
        status: NonNullable<BridgePlayerShipDashboardUpdatedPayload["status"]>,
    ): void {
        const defenseTurret = status.defenseTurret;

        if (!defenseTurret) {
            throw new Error("Captain dashboard Defense Turret tile requires turret payload");
        }

        tile.setPowerCost(defenseTurret.powerCost);
        tile.setIntegrity(defenseTurret.integrity.current, defenseTurret.integrity.max);
        tile.setTargetsAvailable(defenseTurret.targets.length > 0);
        tile.setInteractionEnabled(defenseTurret.integrity.current > 0);

        if (defenseTurret.integrity.current <= 0) {
            tile.setBroken();
        } else if (defenseTurret.intercept) {
            tile.setProgress(DEFENSE_TURRET_PROGRESS_MODE.INTERCEPT, defenseTurret.intercept.progress);
        } else if (defenseTurret.cooldownProgress !== undefined) {
            tile.setProgress(DEFENSE_TURRET_PROGRESS_MODE.COOLDOWN, defenseTurret.cooldownProgress);
        } else if ((status.powerCore?.current ?? 0) < defenseTurret.powerCost || defenseTurret.operatorBusy) {
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

        tile.setPowerCost(shield.powerCost);
        tile.setIntegrity(shield.integrity.current, shield.integrity.max);

        if (shield.status === SHIELD_GENERATOR_STATUS.BROKEN) {
            tile.setBroken();
        } else if (shield.deployment) {
            tile.setProgress(SHIELD_GENERATOR_PROGRESS_MODE.DEPLOYMENT, shield.deployment.progress);
        } else if (shield.cooldownProgress !== undefined) {
            tile.setProgress(SHIELD_GENERATOR_PROGRESS_MODE.COOLDOWN, shield.cooldownProgress);
        } else if ((status.powerCore?.current ?? 0) < shield.powerCost) {
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

        tile.setIntegrity(drive.integrity, drive.maxIntegrity);

        if (drive.integrity === 0) {
            tile.setBroken();
        } else if ((status.powerCore?.current ?? 0) < drive.evadePowerCost) {
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
