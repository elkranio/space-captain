// src/app/scenes/game/bridge/controller/encounter/officer_station_indicators/map_officer_availability_to_station_indicator_state.ts

import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
} from '../../../../../../../engine/encounter/model/officer_availability';
import type { BridgeOfficerStationIndicatorState } from '../../../events/bridge_event';

// Маппинг engine availability в bridge-level состояние лампы.
// Engine говорит про доступность officer-а, bridge view рисует это как station indicator.
export function mapOfficerAvailabilityToStationIndicatorState(
    availabilityState: OfficerAvailabilityState,
): BridgeOfficerStationIndicatorState {
    switch (availabilityState) {
        case OFFICER_AVAILABILITY_STATE.UNAVAILABLE:
            return 'off';

        case OFFICER_AVAILABILITY_STATE.AVAILABLE:
            return 'ready';

        case OFFICER_AVAILABILITY_STATE.BUSY:
            return 'busy';

        default:
            return assertNever(availabilityState);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unknown officer availability state: ${value}`);
}
