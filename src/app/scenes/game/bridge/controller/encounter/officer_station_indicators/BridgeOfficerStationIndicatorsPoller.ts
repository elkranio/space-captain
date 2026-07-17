// src/app/scenes/game/bridge/controller/encounter/officer_station_indicators/BridgeOfficerStationIndicatorsPoller.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
    type OfficerAvailabilityStates,
} from '../../../../../../../engine/encounter/model/officer_availability';
import {
    BRIDGE_EVENT,
    type BridgeOfficerStationIndicatorState,
    type BridgeOfficerStationIndicatorsUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

const OFFICER_STATION_INDICATOR_POLL_INTERVAL_MS = 200;

const OFFICER_STATION_INDICATOR_ROLES = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;

// Poller bridge-level состояний officer station indicators.
// Периодически читает engine availability, мапит её в lamp states и эмитит полный snapshot.
export default class BridgeOfficerStationIndicatorsPoller {
    private elapsedMs = 0;

    constructor(
        private readonly engine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public step(deltaMs: number): void {
        this.elapsedMs += deltaMs;

        if (this.elapsedMs < OFFICER_STATION_INDICATOR_POLL_INTERVAL_MS) {
            return;
        }

        this.elapsedMs = 0;
        this.sync();
    }

    public sync(): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,
            this.createStationIndicatorStates(this.engine.getOfficerAvailabilityStates()),
        );
    }

    public destroy(): void {
        this.elapsedMs = 0;
    }

    private createStationIndicatorStates(
        availabilityStates: OfficerAvailabilityStates,
    ): BridgeOfficerStationIndicatorsUpdatedPayload {
        const states = {} as BridgeOfficerStationIndicatorsUpdatedPayload;

        for (const role of OFFICER_STATION_INDICATOR_ROLES) {
            states[role] = this.mapAvailabilityToStationIndicatorState(availabilityStates[role]);
        }

        return states;
    }

    private mapAvailabilityToStationIndicatorState(
        availabilityState: OfficerAvailabilityState,
    ): BridgeOfficerStationIndicatorState {
        switch (availabilityState) {
            case OFFICER_AVAILABILITY_STATE.UNAVAILABLE:
                return 'off';

            case OFFICER_AVAILABILITY_STATE.AVAILABLE:
                return 'ready';

            case OFFICER_AVAILABILITY_STATE.BUSY:
                return 'busy';
        }
    }
}
