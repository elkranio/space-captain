import { CREW_ACTIONS } from "../../content/catalogs/crew_actions";

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

    // Undefined when the corresponding equipment is not installed.
    defenseTurretLoadDurationMs?: number;
    shieldDeploymentDurationMs?: number;

    // Undefined when the player has no Shield Generator.
    // Active shield lifetime uses world time, not officer progress time.
    shieldDurationMs?: number;
};

export function createPlayerThreatDecisionTimingSnapshot({
    crewProgressMultiplier,
    defenseTurretLoadDurationMs,
    shieldDeploymentDurationMs,
    shieldDurationMs,
}: CreatePlayerThreatDecisionTimingSnapshotInput): PlayerThreatDecisionTimingSnapshot {
    if (!Number.isFinite(crewProgressMultiplier) || crewProgressMultiplier < 0) {
        throw new Error("Invalid player crew progress multiplier: " + crewProgressMultiplier);
    }

    if (shieldDurationMs !== undefined && (!Number.isFinite(shieldDurationMs) || shieldDurationMs < 0)) {
        throw new Error("Invalid player shield duration: " + shieldDurationMs);
    }

    const interceptDurationMs = getResolvedTaskWallDurationMs(
        defenseTurretLoadDurationMs,
        crewProgressMultiplier,
    );

    const shieldDeployDurationMs = getResolvedTaskWallDurationMs(
        shieldDeploymentDurationMs,
        crewProgressMultiplier,
    );

    const clearMineDurationMs = getResolvedTaskWallDurationMs(
        CREW_ACTIONS.clear_sticky_mine.durationMs,
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

function getResolvedTaskWallDurationMs(durationMs: number | undefined, crewProgressMultiplier: number): number | null {
    if (durationMs !== undefined && (!Number.isFinite(durationMs) || durationMs < 0)) {
        throw new Error("Invalid player equipment operation duration: " + durationMs);
    }

    if (durationMs === undefined || crewProgressMultiplier === 0) {
        return null;
    }

    return durationMs / crewProgressMultiplier;
}
