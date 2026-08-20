export const BEAM_SHIELD_TIMING_PHASE = {
    TOO_EARLY: "too_early",
    VALID: "valid",
    EXPIRED: "expired",
    HIDDEN: "hidden",
} as const;

export type BeamShieldTimingStripState =
    | {
          phase: typeof BEAM_SHIELD_TIMING_PHASE.HIDDEN;
      }
    | {
          phase: typeof BEAM_SHIELD_TIMING_PHASE.EXPIRED;
      }
    | {
          phase: typeof BEAM_SHIELD_TIMING_PHASE.TOO_EARLY;

          earlyWidth01: number;
          earlyFill01: number;
          validWidth01: number;
      }
    | {
          phase: typeof BEAM_SHIELD_TIMING_PHASE.VALID;

          earlyWidth01: number;
          validWidth01: number;
          validFill01: number;
      };

type BeamShieldWindow = {
    opensAtRemainingMs: number;
    closesAtRemainingMs: number;
};

type GetBeamShieldTimingStripStateInput = {
    remainingMs: number;
    initialRemainingMs: number;
    shieldWindow: BeamShieldWindow | null | undefined;
};

export function getBeamShieldTimingStripState({
    remainingMs,
    initialRemainingMs,
    shieldWindow,
}: GetBeamShieldTimingStripStateInput): BeamShieldTimingStripState {
    if (shieldWindow === undefined) {
        return {
            phase: BEAM_SHIELD_TIMING_PHASE.HIDDEN,
        };
    }

    if (shieldWindow === null) {
        return {
            phase: BEAM_SHIELD_TIMING_PHASE.EXPIRED,
        };
    }

    const earlyDurationMs = Math.max(0, initialRemainingMs - shieldWindow.opensAtRemainingMs);
    const validStartRemainingMs = Math.min(initialRemainingMs, shieldWindow.opensAtRemainingMs);
    const validDurationMs = Math.max(0, validStartRemainingMs - shieldWindow.closesAtRemainingMs);
    const visibleDurationMs = earlyDurationMs + validDurationMs;

    if (visibleDurationMs <= 0 || remainingMs <= shieldWindow.closesAtRemainingMs) {
        return {
            phase: BEAM_SHIELD_TIMING_PHASE.EXPIRED,
        };
    }

    const earlyWidth01 = earlyDurationMs / visibleDurationMs;
    const validWidth01 = validDurationMs / visibleDurationMs;

    if (remainingMs > shieldWindow.opensAtRemainingMs) {
        return {
            phase: BEAM_SHIELD_TIMING_PHASE.TOO_EARLY,

            earlyWidth01,
            earlyFill01:
                earlyDurationMs > 0
                    ? Math.max(
                          0,
                          Math.min(1, (remainingMs - shieldWindow.opensAtRemainingMs) / earlyDurationMs),
                      )
                    : 0,

            validWidth01,
        };
    }

    if (validDurationMs <= 0) {
        return {
            phase: BEAM_SHIELD_TIMING_PHASE.EXPIRED,
        };
    }

    return {
        phase: BEAM_SHIELD_TIMING_PHASE.VALID,

        earlyWidth01,
        validWidth01,
        validFill01: Math.max(
            0,
            Math.min(1, (remainingMs - shieldWindow.closesAtRemainingMs) / validDurationMs),
        ),
    };
}
