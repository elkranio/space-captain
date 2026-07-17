// src/app/scenes/game/bridge/controller/encounter/officer_station_indicators/are_officer_station_indicator_states_equal.ts

import type { BridgeOfficerStationIndicatorsUpdatedPayload } from '../../../events/bridge_event';
import { OFFICER_STATION_INDICATOR_ROLES } from './officer_station_indicator_roles';

// Сравнивает полные snapshots ламп officer stations.
// Poller использует это, чтобы не эмитить bridge event без реального изменения.
export function areOfficerStationIndicatorStatesEqual(
    left: BridgeOfficerStationIndicatorsUpdatedPayload | undefined,
    right: BridgeOfficerStationIndicatorsUpdatedPayload,
): boolean {
    if (!left) {
        return false;
    }

    return OFFICER_STATION_INDICATOR_ROLES.every((role) => left[role] === right[role]);
}
