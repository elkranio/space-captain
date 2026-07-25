// src/app/scenes/game/bridge/controller/encounter/officer_stations/BridgeOfficerStationsController.ts

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

const OFFICER_STATIONS_SYNC_INTERVAL_MS = 200;

const OFFICER_STATION_ROLES = Object.values(OFFICER_ROLE);

// Управляет presentation-состоянием всех officer stations.
//
// Периодически читает актуальную officer availability
// из EncounterEngine, переводит domain states в lamp states
// и эмитит полный snapshot для bridge views.
export default class BridgeOfficerStationsController {
    private elapsedMs = 0;

    constructor(
        private readonly encounterEngine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
    ) {}

    // #region Public API

    public step(deltaMs: number): void {
        this.elapsedMs += deltaMs;

        if (this.elapsedMs < OFFICER_STATIONS_SYNC_INTERVAL_MS) {
            return;
        }

        this.elapsedMs = 0;
        this.sync();
    }

    public sync(): void {
        const availabilityStates = this.encounterEngine.getOfficerAvailabilityStates();

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,
            this.createIndicatorStates(availabilityStates),
        );
    }

    public destroy(): void {
        this.elapsedMs = 0;
    }

    // #endregion

    // #region Indicator state creation

    private createIndicatorStates(
        availabilityStates: OfficerAvailabilityStates,
    ): BridgeOfficerStationIndicatorsUpdatedPayload {
        const indicatorStates = {} as BridgeOfficerStationIndicatorsUpdatedPayload;

        for (const role of OFFICER_STATION_ROLES) {
            indicatorStates[role] = this.mapAvailabilityToIndicatorState(availabilityStates[role]);
        }

        return indicatorStates;
    }

    private mapAvailabilityToIndicatorState(
        availabilityState: OfficerAvailabilityState,
    ): BridgeOfficerStationIndicatorState {
        switch (availabilityState) {
            case OFFICER_AVAILABILITY_STATE.UNAVAILABLE:
                return 'off';

            case OFFICER_AVAILABILITY_STATE.AVAILABLE:
                return 'ready';

            case OFFICER_AVAILABILITY_STATE.BUSY:
                return 'busy';

            case OFFICER_AVAILABILITY_STATE.BLOCKED:
                return 'blocked';

            default:
                return assertNever(availabilityState);
        }
    }

    // #endregion
}

function assertNever(value: never): never {
    throw new Error(`Unknown officer availability state: ${value}`);
}
