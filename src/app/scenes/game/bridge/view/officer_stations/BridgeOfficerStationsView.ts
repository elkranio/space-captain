import type { OfficerRole } from '../../../../../../engine/defs/officer';
import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import {
    BRIDGE_EVENT,
    type BridgeOfficerActivityClearedPayload,
    type BridgeOfficerActivityProgressUpdatedPayload,
    type BridgeOfficerActivityStartedPayload,
    type BridgeOfficerCombatHintsUpdatedPayload,
    type BridgeOfficerStationIndicatorsUpdatedPayload,
} from '../../events/bridge_event';
import { BRIDGE_OFFICER_STATION_LAYOUT } from './bridge_officer_station_layout';
import BridgeOfficerStationView from './station/BridgeOfficerStationView';

// Root view for the four modular bridge stations.
export default class BridgeOfficerStationsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly stationViews: BridgeOfficerStationView[] = [];

    private readonly stationViewByRole = new Map<OfficerRole, BridgeOfficerStationView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('bridge').add(this.root);

        this.createStationViews();
        this.registerEventHandlers();
    }

    public destroy(): void {
        this.unregisterEventHandlers();

        for (const stationView of this.stationViews) {
            stationView.destroy();
        }

        this.stationViews.length = 0;
        this.stationViewByRole.clear();

        this.root.destroy(false);
    }

    private createStationViews(): void {
        for (const layout of Object.values(BRIDGE_OFFICER_STATION_LAYOUT)) {
            const stationView = new BridgeOfficerStationView(this.scene, this.root, layout, this.eventBus);

            this.stationViews.push(stationView);
            this.stationViewByRole.set(layout.role, stationView);
        }
    }

    private registerEventHandlers(): void {
        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,
            this.handleIndicatorsUpdated,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_COMBAT_HINTS_UPDATED,
            this.handleCombatHintsUpdated,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, this.handleActivityStarted, this);
        this.eventBus.on(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, this.handleActivityCleared, this);

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,
            this.handleActivityProgressUpdated,
            this,
        );
    }

    private unregisterEventHandlers(): void {
        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,
            this.handleIndicatorsUpdated,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_COMBAT_HINTS_UPDATED,
            this.handleCombatHintsUpdated,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, this.handleActivityStarted, this);
        this.eventBus.off(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, this.handleActivityCleared, this);

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,
            this.handleActivityProgressUpdated,
            this,
        );
    }

    private handleIndicatorsUpdated(payload: BridgeOfficerStationIndicatorsUpdatedPayload): void {
        for (const [role, stationView] of this.stationViewByRole) {
            stationView.setIndicatorState(payload[role]);
        }
    }

    private handleCombatHintsUpdated(payload: BridgeOfficerCombatHintsUpdatedPayload): void {
        for (const [role, stationView] of this.stationViewByRole) {
            stationView.setCombatHints(payload[role]);
        }
    }

    private handleActivityStarted(payload: BridgeOfficerActivityStartedPayload): void {
        this.getStationViewOrThrow(payload.role).showActivity(payload.label);
    }

    private handleActivityCleared(payload: BridgeOfficerActivityClearedPayload): void {
        this.getStationViewOrThrow(payload.role).clearActivity();
    }

    private handleActivityProgressUpdated(payload: BridgeOfficerActivityProgressUpdatedPayload): void {
        for (const [role, stationView] of this.stationViewByRole) {
            stationView.setActivityProgress(payload[role]);
        }
    }

    private getStationViewOrThrow(role: OfficerRole): BridgeOfficerStationView {
        const stationView = this.stationViewByRole.get(role);

        if (!stationView) {
            throw new Error(`Bridge officer station not found for role: ${role}`);
        }

        return stationView;
    }
}
