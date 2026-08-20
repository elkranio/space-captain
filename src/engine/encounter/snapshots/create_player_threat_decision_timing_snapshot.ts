import { getTimedOfficerTaskDurationMs } from "../../content/catalogs/officer_tasks";
import { OFFICER_TASK_KIND, type OfficerTaskKind } from "../model/officer_task";

export type PlayerThreatDecisionTimingSnapshot = {
    missile: {
        trackAndInterceptMinRemainingMs: number | null;
        interceptMinRemainingMs: number | null;
    };

    beam: {
        trackMinRemainingMs: number | null;

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

    const trackDurationMs = getResolvedTaskWallDurationMs(
        OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,
        crewProgressMultiplier,
    );

    const interceptDurationMs = getResolvedTaskWallDurationMs(
        OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET,
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
            trackAndInterceptMinRemainingMs:
                trackDurationMs === null || interceptDurationMs === null
                    ? null
                    : trackDurationMs + interceptDurationMs,

            interceptMinRemainingMs: interceptDurationMs,
        },

        beam: {
            trackMinRemainingMs:
                trackDurationMs === null
                    ? null
                    : trackDurationMs + (shieldDurationMs === undefined ? 0 : (shieldDeployDurationMs ?? 0)),

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
