import { describe, expect, it } from 'vitest';
import {
    BEAM_SHIELD_TIMING_PHASE,
    getBeamShieldTimingStripState,
} from '../../src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/get_beam_shield_timing_strip_state';

const SHIELD_WINDOW = {
    opensAtRemainingMs: 8000,
    closesAtRemainingMs: 3000,
};

describe('getBeamShieldTimingStripState', () => {
    it('shrinks the too-early red segment while keeping the valid segment ahead', () => {
        expect(
            getBeamShieldTimingStripState({
                remainingMs: 10000,
                initialRemainingMs: 12000,
                shieldWindow: SHIELD_WINDOW,
            }),
        ).toEqual({
            phase: BEAM_SHIELD_TIMING_PHASE.TOO_EARLY,
            earlyWidth01: 4 / 9,
            earlyFill01: 0.5,
            validWidth01: 5 / 9,
        });
    });

    it('shrinks only the valid segment after the shield window opens', () => {
        expect(
            getBeamShieldTimingStripState({
                remainingMs: 5500,
                initialRemainingMs: 12000,
                shieldWindow: SHIELD_WINDOW,
            }),
        ).toEqual({
            phase: BEAM_SHIELD_TIMING_PHASE.VALID,
            earlyWidth01: 4 / 9,
            validWidth01: 5 / 9,
            validFill01: 0.5,
        });
    });

    it('starts the valid segment full when the warning begins inside the shield window', () => {
        expect(
            getBeamShieldTimingStripState({
                remainingMs: 6000,
                initialRemainingMs: 6000,
                shieldWindow: SHIELD_WINDOW,
            }),
        ).toEqual({
            phase: BEAM_SHIELD_TIMING_PHASE.VALID,
            earlyWidth01: 0,
            validWidth01: 1,
            validFill01: 1,
        });
    });

    it('switches to expired at the latest useful shield start', () => {
        expect(
            getBeamShieldTimingStripState({
                remainingMs: 3000,
                initialRemainingMs: 12000,
                shieldWindow: SHIELD_WINDOW,
            }),
        ).toEqual({
            phase: BEAM_SHIELD_TIMING_PHASE.EXPIRED,
        });
    });

    it('distinguishes missing timing from an impossible timing window', () => {
        expect(
            getBeamShieldTimingStripState({
                remainingMs: 12000,
                initialRemainingMs: 12000,
                shieldWindow: undefined,
            }),
        ).toEqual({
            phase: BEAM_SHIELD_TIMING_PHASE.HIDDEN,
        });

        expect(
            getBeamShieldTimingStripState({
                remainingMs: 12000,
                initialRemainingMs: 12000,
                shieldWindow: null,
            }),
        ).toEqual({
            phase: BEAM_SHIELD_TIMING_PHASE.EXPIRED,
        });
    });
});
