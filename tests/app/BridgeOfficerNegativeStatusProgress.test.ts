import { describe, expect, it, vi } from 'vitest';
import BridgeEncounterSnapshotSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer';
import {
    BRIDGE_EVENT,
    BRIDGE_OFFICER_STATION_STATE,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import type { EncounterPresentationSnapshot } from '../../src/engine/encounter/snapshots/encounter_presentation_snapshot';

describe('Bridge officer negative status progress', () => {
    it('publishes Scientist neural recovery as remaining progress after station state', () => {
        const emit = vi.fn();
        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            {
                emit,
            } as unknown as BridgeEventBus,
            'player_00',
        );

        const snapshot = {
            player: {
                officerTasks: [],
                officerStatuses: [
                    {
                        kind: 'neural_recovery',
                        role: 'scientist',
                        durationMs: 3000,
                        elapsedMs: 1000,
                    },
                ],
            },
        } as unknown as EncounterPresentationSnapshot;

        synchronizer.syncOfficerStations(snapshot);

        expect(emit.mock.calls[0]).toEqual([
            BRIDGE_EVENT.OFFICER_STATIONS_UPDATED,
            {
                scientist: BRIDGE_OFFICER_STATION_STATE.INCAPACITATED,
                pilot: BRIDGE_OFFICER_STATION_STATE.IDLE,
                gunner: BRIDGE_OFFICER_STATION_STATE.IDLE,
                engineer: BRIDGE_OFFICER_STATION_STATE.IDLE,
            },
        ]);

        expect(emit.mock.calls[1]?.[0]).toBe(
            BRIDGE_EVENT.OFFICER_NEGATIVE_STATUS_PROGRESS_UPDATED,
        );
        const progressPayload = emit.mock.calls[1]?.[1];

        expect(progressPayload).toMatchObject({
            role: 'scientist',
        });
        expect(progressPayload?.remainingProgress).toBeCloseTo(2 / 3);
    });
});
