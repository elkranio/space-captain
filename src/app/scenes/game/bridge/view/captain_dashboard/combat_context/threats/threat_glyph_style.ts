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
    MINE: 0xb13aa5,
    SPAM: 0x5bd14a,
} as const;

export const SPAM_DURATION_BAR = {
    x: THREAT_CELL.glyphX,
    y: 38,
    width: 107,
    height: 4,

    trackColor: 0x31465b,
} as const;
