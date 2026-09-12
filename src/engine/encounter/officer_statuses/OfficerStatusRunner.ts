// src/engine/encounter/officer_statuses/OfficerStatusRunner.ts

import type { OfficerRole } from "../../defs/officer";
import {
    OFFICER_STATUS_KIND,
    type OfficerStatusState,
} from "../model/officer_status";
import type { EncounterState } from "../model/state";

// Owns temporary officer states that are independent from officer work tasks.
export default class OfficerStatusRunner {
    constructor(private readonly state: EncounterState) {}

    public startNeuralRecovery(role: OfficerRole, durationMs: number): void {
        if (!Number.isFinite(durationMs) || durationMs < 0) {
            throw new Error("Invalid neural recovery duration: " + role + "/" + durationMs);
        }

        if (durationMs === 0) {
            return;
        }

        const activeStatus = this.state.officerStatuses[role];

        if (activeStatus) {
            throw new Error(
                "Cannot start neural recovery: officer " +
                    role +
                    " already has status " +
                    activeStatus.kind,
            );
        }

        this.state.officerStatuses[role] = {
            kind: OFFICER_STATUS_KIND.NEURAL_RECOVERY,
            role,

            durationMs,
            elapsedMs: 0,
        };
    }

    public step(deltaMs: number): void {
        if (!Number.isFinite(deltaMs) || deltaMs < 0) {
            throw new Error("Invalid officer status delta: " + deltaMs);
        }

        const statuses = Object.values(this.state.officerStatuses).filter(
            (status): status is OfficerStatusState => {
                return status !== undefined;
            },
        );

        for (const status of statuses) {
            status.elapsedMs = Math.min(status.elapsedMs + deltaMs, status.durationMs);

            if (status.elapsedMs >= status.durationMs) {
                delete this.state.officerStatuses[status.role];
            }
        }
    }
}
