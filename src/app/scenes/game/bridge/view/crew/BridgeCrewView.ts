// src/app/scenes/game/bridge/view/crew/BridgeCrewView.ts

import { OFFICER_ROLE, type OfficerRole } from '../../../../../../engine/defs/officer';
import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeCrewLoadedPayload,
    type BridgeOfficerActivityClearedPayload,
    type BridgeOfficerActivityProgressUpdatedPayload,
    type BridgeOfficerActivityStartedPayload,
    type BridgeOfficerStationIndicatorsUpdatedPayload,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { BRIDGE_CREW_SEAT_LAYOUT } from './bridge_crew_layout';
import BridgeSeatView from './seat/BridgeSeatView';

const OFFICER_ROLES = Object.values(OFFICER_ROLE);

// Root view bridge crew layer.
//
// Создаёт officer seat panels,
// заполняет их crew snapshot-ом
// и раздаёт seat-ам:
// - статусы station lights;
// - activity labels;
// - activity progress.
export default class BridgeCrewView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly seatViews: BridgeSeatView[] = [];

    private readonly seatViewByRole = new Map<OfficerRole, BridgeSeatView>();

    private latestIndicatorStates?: BridgeOfficerStationIndicatorsUpdatedPayload;

    private latestActivityProgressStates?: BridgeOfficerActivityProgressUpdatedPayload;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.scene.layers.get('bridge').add(this.root);

        this.createSeatViews();

        this.eventBus.on(BRIDGE_EVENT.CREW_LOADED, this.handleCrewLoaded, this);

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,

            this.handleOfficerStationIndicatorsUpdated,
            this,
        );

        this.eventBus.on(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, this.handleOfficerActivityStarted, this);

        this.eventBus.on(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, this.handleOfficerActivityCleared, this);

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,

            this.handleOfficerActivityProgressUpdated,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.CREW_LOADED, this.handleCrewLoaded, this);

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,

            this.handleOfficerStationIndicatorsUpdated,
            this,
        );

        this.eventBus.off(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, this.handleOfficerActivityStarted, this);

        this.eventBus.off(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, this.handleOfficerActivityCleared, this);

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,

            this.handleOfficerActivityProgressUpdated,
            this,
        );

        for (const seatView of this.seatViews) {
            seatView.destroy();
        }

        this.seatViews.length = 0;
        this.seatViewByRole.clear();

        this.latestIndicatorStates = undefined;
        this.latestActivityProgressStates = undefined;

        this.root.destroy(false);
    }

    private createSeatViews(): void {
        for (const seatLayout of BRIDGE_CREW_SEAT_LAYOUT) {
            const seatView = new BridgeSeatView(this.scene, this.root, seatLayout.position, this.eventBus);

            this.seatViews.push(seatView);

            if (seatLayout.officerRole === null) {
                continue;
            }

            if (this.seatViewByRole.has(seatLayout.officerRole)) {
                throw new Error(`Duplicate bridge seat for officer role: ${seatLayout.officerRole}`);
            }

            this.seatViewByRole.set(seatLayout.officerRole, seatView);
        }

        for (const role of OFFICER_ROLES) {
            if (!this.seatViewByRole.has(role)) {
                throw new Error(`Bridge seat not configured for officer role: ${role}`);
            }
        }
    }

    private handleCrewLoaded(payload: BridgeCrewLoadedPayload): void {
        this.clearSeats();

        for (const role of OFFICER_ROLES) {
            const officer = payload[role];

            if (officer.role !== role) {
                throw new Error(`Officer record role mismatch: ${role} !== ${officer.role}`);
            }

            this.getSeatViewOrThrow(role).setOfficer(officer);
        }

        this.applyLatestIndicatorStates();
        this.applyLatestActivityProgressStates();
    }

    private handleOfficerStationIndicatorsUpdated(payload: BridgeOfficerStationIndicatorsUpdatedPayload): void {
        this.latestIndicatorStates = payload;

        this.applyLatestIndicatorStates();
    }

    private handleOfficerActivityProgressUpdated(payload: BridgeOfficerActivityProgressUpdatedPayload): void {
        this.latestActivityProgressStates = payload;

        this.applyLatestActivityProgressStates();
    }

    private clearSeats(): void {
        for (const seatView of this.seatViews) {
            seatView.clearOfficer();
        }
    }

    private applyLatestIndicatorStates(): void {
        if (!this.latestIndicatorStates) {
            return;
        }

        for (const [role, seatView] of this.seatViewByRole) {
            seatView.setStatusLightState(this.latestIndicatorStates[role]);
        }
    }

    private applyLatestActivityProgressStates(): void {
        if (!this.latestActivityProgressStates) {
            return;
        }

        for (const [role, seatView] of this.seatViewByRole) {
            seatView.setActivityProgress(this.latestActivityProgressStates[role]);
        }
    }

    private handleOfficerActivityStarted(payload: BridgeOfficerActivityStartedPayload): void {
        this.getSeatViewOrThrow(payload.role).showActivity(payload.label);
    }

    private handleOfficerActivityCleared(payload: BridgeOfficerActivityClearedPayload): void {
        this.getSeatViewOrThrow(payload.role).clearActivity();
    }

    private getSeatViewOrThrow(role: OfficerRole): BridgeSeatView {
        const seatView = this.seatViewByRole.get(role);

        if (!seatView) {
            throw new Error(`Bridge seat not found for officer role: ${role}`);
        }

        return seatView;
    }
}
