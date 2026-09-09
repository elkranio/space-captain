// src/app/scenes/game/bridge/view/captain_dashboard/enemy_ship/header/BridgeEnemyShipHeaderView.ts
import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeBeamTargetSelectedPayload,
    type BridgeEnemyShipDashboardUpdatedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeShipDashboardHeaderView from "../../BridgeShipDashboardHeaderView";

// Enemy event adapter for the shared ship dashboard header presentation.
export default class BridgeEnemyShipHeaderView {
    private readonly headerView: BridgeShipDashboardHeaderView;
    private selectingTarget = false;
    private pulseElapsedMs = 0;
    private actorId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
    ) {
        this.headerView = new BridgeShipDashboardHeaderView(
            scene,
            width,
            height,
            {
                onHullTargetSelected: () => this.handleHeaderTargetSelected({ kind: "hull" }),
                onBridgeTargetSelected: () => this.handleHeaderTargetSelected({ kind: "bridge" }),
            },
        );
        this.headerView.setVisible(false);
        this.headerView.setPowerCoreVisible(false);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
        this.eventBus.on(
            BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED,
            this.handleBeamSelectionUpdated,
            this,
        );
        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.headerView.getRoot();
    }

    public setPosition(x: number, y: number): void {
        this.headerView.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
        this.eventBus.off(
            BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED,
            this.handleBeamSelectionUpdated,
            this,
        );
        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        this.headerView.destroy();
    }

    private handleDashboardUpdated(
        payload: BridgeEnemyShipDashboardUpdatedPayload,
    ): void {
        if (!payload) {
            this.actorId = undefined;
            this.headerView.setVisible(false);
            this.headerView.clearHull();
            this.headerView.setHullTargetLocked(false);
            this.headerView.setBridgeTargetLocked(false);
            this.clearPowerCore();
            return;
        }

        this.actorId = payload.actorId;
        this.headerView.setVisible(true);
        this.headerView.setHull(payload.hull.current, payload.hull.max);
        this.headerView.setHullTargetLocked(payload.beamTarget?.kind === "hull");
        this.headerView.setBridgeTargetLocked(payload.beamTarget?.kind === "bridge");

        const powerCore = payload.powerCore;

        if (!powerCore) {
            this.clearPowerCore();
            return;
        }

        this.headerView.setPowerCoreVisible(true);
        this.headerView.setPowerCore(
            powerCore.current,
            powerCore.max,
            powerCore.rechargeProgress,
        );
    }

    private handleHeaderTargetSelected(node: BridgeBeamTargetSelectedPayload["node"]): void {
        if (!this.actorId) {
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTED, {
            actorId: this.actorId,
            node,
        });
    }

    private handleBeamSelectionUpdated(weaponId: string | null): void {
        this.selectingTarget = weaponId !== null;
        this.pulseElapsedMs = 0;
        this.headerView.setTargetSelectionEnabled(this.selectingTarget);
        this.headerView.setTargetPulse(1);
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        if (!this.selectingTarget) {
            return;
        }

        const style = CAPTAIN_DASHBOARD_STYLE.targetSelection;
        this.pulseElapsedMs = (this.pulseElapsedMs + deltaMs) % (style.pulseDurationMs * 2);
        const wave = (1 + Math.cos(Math.PI * this.pulseElapsedMs / style.pulseDurationMs)) / 2;
        const alpha = style.pulseMinAlpha + (1 - style.pulseMinAlpha) * wave;
        this.headerView.setTargetPulse(alpha);
    }

    private clearPowerCore(): void {
        this.headerView.clearPowerCore();
        this.headerView.setPowerCoreVisible(false);
    }
}
