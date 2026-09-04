import { getTimedOfficerTaskDurationMs } from "../../content/catalogs/officer_tasks";
import { OFFICER_TASK_KIND, type OfficerTaskKind } from "../model/officer_task";

export type PlayerThreatDecisionTimingSnapshot = {
    missile: {
        interceptMinRemainingMs: number | null;
    };

    beam: {
        shieldWindow: {
            opensAtRemainingMs: number;
            closesAtRemainingMs: number;
        } | null;
    };

    stickyMine: {
        clearMinRemainingMs: number | null;
    };
};

type CreatePlayerThreatDecisionTimingSnapshotInput = {
    crewProgressMultiplier: number;

    // Undefined when the player has no Shield Generator.
    // Active shield lifetime uses world time, not officer progress time.
    shieldDurationMs?: number;
};

export function createPlayerThreatDecisionTimingSnapshot({
    crewProgressMultiplier,
    shieldDurationMs,
}: CreatePlayerThreatDecisionTimingSnapshotInput): PlayerThreatDecisionTimingSnapshot {
    if (!Number.isFinite(crewProgressMultiplier) || crewProgressMultiplier < 0) {
        throw new Error("Invalid player crew progress multiplier: " + crewProgressMultiplier);
    }

    if (shieldDurationMs !== undefined && (!Number.isFinite(shieldDurationMs) || shieldDurationMs < 0)) {
        throw new Error("Invalid player shield duration: " + shieldDurationMs);
    }

    const interceptDurationMs = getResolvedTaskWallDurationMs(
        OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET,
        crewProgressMultiplier,
    );

    const shieldDeployDurationMs = getResolvedTaskWallDurationMs(
        OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
        crewProgressMultiplier,
    );

    const clearMineDurationMs = getResolvedTaskWallDurationMs(
        OFFICER_TASK_KIND.CLEAR_STICKY_MINE,
        crewProgressMultiplier,
    );

    return {
        missile: {
            interceptMinRemainingMs: interceptDurationMs,
        },

        beam: {
            shieldWindow:
                shieldDeployDurationMs === null || shieldDurationMs === undefined
                    ? null
                    : {
                          opensAtRemainingMs: shieldDeployDurationMs + shieldDurationMs,
                          closesAtRemainingMs: shieldDeployDurationMs,
                      },
        },

        stickyMine: {
            clearMinRemainingMs: clearMineDurationMs,
        },
    };
}

function getResolvedTaskWallDurationMs(kind: OfficerTaskKind, crewProgressMultiplier: number): number | null {
    if (crewProgressMultiplier === 0) {
        return null;
    }

    return getTimedOfficerTaskDurationMs(kind) / crewProgressMultiplier;
}
