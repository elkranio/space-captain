// src/app/scenes/game/bridge/controller/encounter/officer_station_indicators/BridgeOfficerStationIndicatorsPoller.ts

import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import type { OfficerAvailabilityStates } from '../../../../../../../engine/encounter/model/officer_availability';
import { BRIDGE_EVENT, type BridgeOfficerStationIndicatorsUpdatedPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { areOfficerStationIndicatorStatesEqual } from './are_officer_station_indicator_states_equal';
import { mapOfficerAvailabilityToStationIndicatorState } from './map_officer_availability_to_station_indicator_state';
import { OFFICER_STATION_INDICATOR_ROLES } from './officer_station_indicator_roles';

const OFFICER_STATION_INDICATOR_POLL_INTERVAL_MS = 200;

// Poller bridge-level состояний officer station indicators.
// Периодически читает engine availability, мапит её в lamp states и эмитит update только при изменении.
export default class BridgeOfficerStationIndicatorsPoller {
    private elapsedMs = 0;
    private previousStates?: BridgeOfficerStationIndicatorsUpdatedPayload;

    constructor(
        private readonly engine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public step(deltaMs: number): void {
        this.elapsedMs += deltaMs;

        if (this.previousStates && this.elapsedMs < OFFICER_STATION_INDICATOR_POLL_INTERVAL_MS) {
            return;
        }

        this.elapsedMs = 0;

        this.syncStates();
    }

    public destroy(): void {
        this.previousStates = undefined;
        this.elapsedMs = 0;
    }

    private syncStates(): void {
        const states = this.createStationIndicatorStates(this.engine.getOfficerAvailabilityStates());

        if (areOfficerStationIndicatorStatesEqual(this.previousStates, states)) {
            return;
        }

        this.previousStates = states;

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED, states);
    }

    private createStationIndicatorStates(
        availabilityStates: OfficerAvailabilityStates,
    ): BridgeOfficerStationIndicatorsUpdatedPayload {
        const states = {} as BridgeOfficerStationIndicatorsUpdatedPayload;

        for (const role of OFFICER_STATION_INDICATOR_ROLES) {
            states[role] = mapOfficerAvailabilityToStationIndicatorState(availabilityStates[role]);
        }

        return states;
    }
}
