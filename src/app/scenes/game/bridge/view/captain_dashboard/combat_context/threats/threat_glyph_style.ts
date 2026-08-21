export const THREAT_CELL = {
    width: 123,
    height: 66,

    glyphX: 8,
    glyphY: 0,

    actionCenterY: 43,
    actionGap: 5,

    disabledAlpha: 0.35,

    terminalBlinkPeriodMs: 300,
    earlyBlinkPeriodMs: 500,
} as const;

export const THREAT_GLYPH_COLOR = {
    MISSILE: 0xf2a33a,
    BEAM: 0x4bc7e8,
    BEAM_EARLY: 0x7f878f,
    MINE: 0xb13aa5,
    SPAM: 0x5bd14a,
    SPAM_EXPIRED: 0x66717a,
} as const;
