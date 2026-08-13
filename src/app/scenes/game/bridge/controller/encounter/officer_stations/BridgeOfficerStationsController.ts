// src/app/scenes/game/bridge/controller/encounter/officer_stations/BridgeOfficerStationsController.ts

import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
    type OfficerAvailabilityStates,
} from '../../../../../../../engine/encounter/model/officer_availability';
import type { OfficerTaskState } from '../../../../../../../engine/encounter/model/officer_task';
import type {
    EncounterPresentationSnapshot,
} from '../../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot';
import {
    BRIDGE_EVENT,
    type BridgeOfficerActivityProgressUpdatedPayload,
    type BridgeOfficerCombatHintsUpdatedPayload,
    type BridgeOfficerStationIndicatorState,
    type BridgeOfficerStationIndicatorsUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import CombatActionHintMapper from './CombatActionHintMapper';

const OFFICER_STATIONS_SYNC_INTERVAL_MS = 200;

const OFFICER_STATION_ROLES = Object.values(OFFICER_ROLE);

// Управляет presentation-состоянием всех officer stations.
//
// Все данные одного refresh приходят из одного EncounterPresentationSnapshot:
// availability, active tasks, enemy presence и уже разрешённые команды.
// Controller не пересобирает один UI-state несколькими engine reads.
//
// Task progress обновляется каждый frame.
// Station lamps/hints ограничены 200 ms polling interval.
export default class BridgeOfficerStationsController {
    private elapsedMs = 0;

    private readonly combatActionHintMapper = new CombatActionHintMapper();

    constructor(
        private readonly encounterEngine: EncounterEngine,

        private readonly eventBus: BridgeEventBus,
    ) {}

    // #region Public API

    public step(
        deltaMs: number,
        snapshot:
            EncounterPresentationSnapshot =
                this.encounterEngine
                    .getPresentationSnapshot(),
    ): void {
        // Progress должен двигаться плавно,
        // поэтому не привязан к 200 ms lamp polling.
        this.syncActivityProgress(
            snapshot,
        );

        this.elapsedMs += deltaMs;

        if (this.elapsedMs < OFFICER_STATIONS_SYNC_INTERVAL_MS) {
            return;
        }

        this.elapsedMs = 0;

        this.syncStationStatus(
            snapshot,
        );
    }

    public sync(
        snapshot:
            EncounterPresentationSnapshot =
                this.encounterEngine
                    .getPresentationSnapshot(),
    ): void {
        this.syncStationStatus(
            snapshot,
        );

        this.syncActivityProgress(
            snapshot,
        );
    }

    public destroy(): void {
        this.elapsedMs = 0;
    }

    // #endregion

    // #region Synchronization

    private syncStationStatus(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        const availabilityStates =
            snapshot.player
                .officerAvailability;

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,

            this.createIndicatorStates(
                availabilityStates,
            ),
        );

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_COMBAT_HINTS_UPDATED,

            this.createCombatHintStates(
                snapshot,
                availabilityStates,
            ),
        );
    }

    private createCombatHintStates(
        snapshot:
            EncounterPresentationSnapshot,

        availabilityStates:
            OfficerAvailabilityStates,
    ): BridgeOfficerCombatHintsUpdatedPayload {
        const hintStates = {} as BridgeOfficerCombatHintsUpdatedPayload;

        for (const role of OFFICER_STATION_ROLES) {
            hintStates[role] = [];
        }

        const hasActiveEnemy =
            snapshot.enemyShips
                .some((enemy) => {
                    return (
                        enemy.hull.current >
                        0
                    );
                });

        if (!hasActiveEnemy) {
            return hintStates;
        }

        for (const role of OFFICER_STATION_ROLES) {
            if (availabilityStates[role] !== OFFICER_AVAILABILITY_STATE.AVAILABLE) {
                continue;
            }

            hintStates[role] =
                this.combatActionHintMapper
                    .map(
                        snapshot.commandsByRole[
                            role
                        ],
                    );
        }

        return hintStates;
    }

    private syncActivityProgress(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,

            this.createActivityProgressStates(
                snapshot.player
                    .officerTasks,
            ),
        );
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

    // #region Activity progress creation

    private createActivityProgressStates(tasks: OfficerTaskState[]): BridgeOfficerActivityProgressUpdatedPayload {
        const progressStates = {} as BridgeOfficerActivityProgressUpdatedPayload;

        // Полный snapshot:
        // отсутствие task тоже представлено явно.
        for (const role of OFFICER_STATION_ROLES) {
            progressStates[role] = null;
        }

        for (const task of tasks) {
            if (!task.showProgress) {
                continue;
            }

            if (task.durationMs === null || task.durationMs <= 0) {
                throw new Error(`Officer task ${task.kind} ` + `cannot show progress without ` + `a positive duration`);
            }

            progressStates[task.role] = clampProgress(task.elapsedMs / task.durationMs);
        }

        return progressStates;
    }

    // #endregion
}

function clampProgress(value: number): number {
    return Math.min(Math.max(value, 0), 1);
}

function assertNever(value: never): never {
    throw new Error(`Unknown officer availability state: ${value}`);
}
