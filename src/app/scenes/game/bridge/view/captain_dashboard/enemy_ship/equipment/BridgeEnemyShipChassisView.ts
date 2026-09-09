import {
    SHIP_CHASSIS_SURFACE_HEIGHT,
    SHIP_CHASSIS_SURFACE_WIDTH,
} from "../../../../../../../../engine/defs/ship_chassis";
import {
    SHIP_SLOT_HEIGHT,
    SHIP_SLOT_KIND,
    SHIP_SLOT_WIDTH,
} from "../../../../../../../../engine/defs/ship_slot";
import {
    EQUIPMENT_SPRITE_ID,
    EQUIPMENT_SPRITES,
} from "../../../../../../../manifests/equipment";
import { DEFAULT_ATLAS_KEY } from "../../../../../../../manifests/types";
import type BridgeScene from "../../../../BridgeScene";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgeEnemyEquipmentDashboardPayload,
    type BridgeEnemyShipDashboardUpdatedPayload,
} from "../../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeEnemyEquipmentTileView from "./BridgeEnemyEquipmentTileView";
import BridgeEnemyPowerCoreTileView from "./BridgeEnemyPowerCoreTileView";

const SLOT_FRAME = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.SLOT_FRAME];

// Read-only enemy chassis schematic.
// Domain chassis x/y stay authoritative; the right-side view mirrors x so both ships face inward.
export default class BridgeEnemyShipChassisView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly schematicLayer: Phaser.GameObjects.Container;

    private readonly blueprintLayer: Phaser.GameObjects.Container;

    private readonly slotLayer: Phaser.GameObjects.Container;

    private readonly equipmentLayer: Phaser.GameObjects.Container;

    private readonly slotPositions = new Map<string, { x: number; y: number }>();

    private readonly equipmentById = new Map<string, BridgeEnemyEquipmentTileView>();

    private powerCoreTile?: BridgeEnemyPowerCoreTileView;

    private actorId?: string;

    private chassisKey?: string;

    private selectionActive = false;

    private pulseAlpha = 1;

    private pulseTween: Phaser.Tweens.Tween | null = null;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.schematicLayer = this.scene.add.container(0, 0);
        this.blueprintLayer = this.scene.add.container(0, 0);
        this.slotLayer = this.scene.add.container(0, 0);
        this.equipmentLayer = this.scene.add.container(0, 0);

        const schematicScale = Math.min(
            1,
            width / SHIP_CHASSIS_SURFACE_WIDTH,
            height / SHIP_CHASSIS_SURFACE_HEIGHT,
        );

        this.schematicLayer.setPosition(
            Math.round(
                (width - SHIP_CHASSIS_SURFACE_WIDTH * schematicScale) / 2,
            ),
            Math.round(
                (height - SHIP_CHASSIS_SURFACE_HEIGHT * schematicScale) / 2,
            ),
        );
        this.schematicLayer.setScale(schematicScale);

        this.schematicLayer.add([
            this.blueprintLayer,
            this.slotLayer,
            this.equipmentLayer,
        ]);
        this.root.add(this.schematicLayer);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
        this.eventBus.on(
            BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED,
            this.handleSelectionUpdated,
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
        this.eventBus.off(
            BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED,
            this.handleSelectionUpdated,
            this,
        );
        this.pulseTween?.remove();
        this.clearEquipment();
        this.clearPowerCore();
        this.root.destroy(true);
    }

    private handleDashboardUpdated = (
        payload: BridgeEnemyShipDashboardUpdatedPayload,
    ): void => {
        if (!payload) {
            this.actorId = undefined;
            this.renderChassis(undefined);
            this.clearEquipment();
            this.clearPowerCore();
            return;
        }

        if (
            this.actorId !== undefined &&
            this.actorId !== payload.actorId
        ) {
            this.clearEquipment();
            this.clearPowerCore();
        }

        this.actorId = payload.actorId;
        this.renderChassis(payload.chassis);

        if (!payload.chassis) {
            this.clearEquipment();
            this.clearPowerCore();
            return;
        }

        this.reconcileEquipment(payload.equipment);
        this.reconcilePowerCore(payload.powerCore);
    };

    private renderChassis(
        chassis: NonNullable<BridgeEnemyShipDashboardUpdatedPayload>["chassis"],
    ): void {
        if (!chassis) {
            this.chassisKey = undefined;
            this.slotPositions.clear();
            this.blueprintLayer.removeAll(true);
            this.slotLayer.removeAll(true);
            return;
        }

        const chassisKey = [
            chassis.blueprintId,
            ...chassis.slots.map((slot) => {
                return [
                    slot.id,
                    slot.kind,
                    slot.x,
                    slot.y,
                ].join(":");
            }),
        ].join("|");

        if (this.chassisKey === chassisKey) {
            return;
        }

        this.chassisKey = chassisKey;
        this.slotPositions.clear();
        this.blueprintLayer.removeAll(true);
        this.slotLayer.removeAll(true);

        const blueprint = this.scene.add
            .image(
                Math.round(SHIP_CHASSIS_SURFACE_WIDTH / 2),
                Math.round(SHIP_CHASSIS_SURFACE_HEIGHT / 2),
                DEFAULT_ATLAS_KEY,
                "world/ships/blueprints/" + chassis.blueprintId,
            )
            .setOrigin(0.5)
            .setFlipX(true);

        this.blueprintLayer.add(blueprint);

        for (const slot of chassis.slots) {
            const position = {
                x: Math.round(
                    SHIP_CHASSIS_SURFACE_WIDTH / 2 -
                    slot.x -
                    SHIP_SLOT_WIDTH / 2,
                ),
                y: Math.round(
                    SHIP_CHASSIS_SURFACE_HEIGHT / 2 +
                    slot.y -
                    SHIP_SLOT_HEIGHT / 2,
                ),
            };

            this.slotPositions.set(slot.id, position);

            const frame = this.scene.add
                .image(
                    position.x,
                    position.y,
                    SLOT_FRAME.atlasKey,
                    SLOT_FRAME.frameKey,
                )
                .setOrigin(0, 0);

            this.slotLayer.add(frame);

            if (
                slot.kind !== SHIP_SLOT_KIND.HULL &&
                slot.kind !== SHIP_SLOT_KIND.BRIDGE
            ) {
                continue;
            }

            const icon = this.scene.add
                .image(
                    position.x + SHIP_SLOT_WIDTH / 2,
                    position.y + SHIP_SLOT_HEIGHT / 2,
                    DEFAULT_ATLAS_KEY,
                    "equipment/icons/" + slot.kind,
                )
                .setOrigin(0.5)
                .setFlipX(true);

            this.slotLayer.add(icon);
        }
    }

    private reconcileEquipment(
        equipment: BridgeEnemyEquipmentDashboardPayload[],
    ): void {
        const visibleEquipmentIds = new Set<string>();

        for (const entry of equipment) {
            const position = this.slotPositions.get(entry.slotId);

            if (!position) {
                throw new Error(
                    "Enemy equipment chassis slot not found: " + entry.slotId,
                );
            }

            visibleEquipmentIds.add(entry.id);

            let view = this.equipmentById.get(entry.id);

            if (!view) {
                view = new BridgeEnemyEquipmentTileView(
                    this.scene,
                    SHIP_SLOT_WIDTH,
                    SHIP_SLOT_HEIGHT,
                    entry.sprite,
                    this.handleTargetSelected,
                );

                this.equipmentById.set(entry.id, view);
                this.equipmentLayer.add(view.getRoot());
            }

            view.setPosition(position.x, position.y);
            view.update(entry);
            view.setTargetSelectionEnabled(this.selectionActive);
            view.setTargetPulse(this.pulseAlpha);
        }

        for (const [equipmentId, view] of this.equipmentById) {
            if (visibleEquipmentIds.has(equipmentId)) {
                continue;
            }

            view.destroy();
            this.equipmentById.delete(equipmentId);
        }
    }

    private reconcilePowerCore(
        powerCore: NonNullable<BridgeEnemyShipDashboardUpdatedPayload>["powerCore"],
    ): void {
        if (!powerCore) {
            this.clearPowerCore();
            return;
        }

        const position = this.slotPositions.get(powerCore.slotId);

        if (!position) {
            throw new Error(
                "Enemy Power Core chassis slot not found: " + powerCore.slotId,
            );
        }

        if (!this.powerCoreTile) {
            this.powerCoreTile = new BridgeEnemyPowerCoreTileView(
                this.scene,
                SHIP_SLOT_WIDTH,
                SHIP_SLOT_HEIGHT,
                powerCore.sprite,
            );
            this.equipmentLayer.add(this.powerCoreTile.getRoot());
        }

        this.powerCoreTile.setPosition(position.x, position.y);
    }

    private clearPowerCore(): void {
        this.powerCoreTile?.destroy();
        this.powerCoreTile = undefined;
    }

    private clearEquipment(): void {
        for (const view of this.equipmentById.values()) {
            view.destroy();
        }

        this.equipmentById.clear();
    }

    private handleSelectionUpdated = (weaponId: string | null): void => {
        const wasActive = this.selectionActive;
        this.selectionActive = weaponId !== null;

        if (this.selectionActive && !wasActive) {
            this.startPulse();
        } else if (!this.selectionActive && wasActive) {
            this.stopPulse();
        }

        for (const view of this.equipmentById.values()) {
            view.setTargetSelectionEnabled(this.selectionActive);
            view.setTargetPulse(this.pulseAlpha);
        }
    };

    private startPulse(): void {
        this.pulseTween?.remove();
        this.pulseAlpha = 1;
        this.pulseTween = this.scene.tweens.add({
            targets: this,
            pulseAlpha: CAPTAIN_DASHBOARD_STYLE.targetSelection.pulseMinAlpha,
            duration: CAPTAIN_DASHBOARD_STYLE.targetSelection.pulseDurationMs,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
            onUpdate: () => {
                for (const view of this.equipmentById.values()) {
                    view.setTargetPulse(this.pulseAlpha);
                }
            },
        });
    }

    private stopPulse(): void {
        this.pulseTween?.remove();
        this.pulseTween = null;
        this.pulseAlpha = 1;

        for (const view of this.equipmentById.values()) {
            view.setTargetPulse(1);
        }
    }

    private handleTargetSelected = (slotId: string): void => {
        if (!this.actorId) {
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTED, {
            actorId: this.actorId,
            node: {
                kind: "slot",
                slotId,
            },
        });
    };
}
