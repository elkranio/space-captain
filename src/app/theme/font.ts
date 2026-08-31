// src/app/theme/font.ts

export const FONT_FAMILY = {
    VGA_8X14: "vga_8x14",
    CHAKRA_PETCH_SEMIBOLD_14: "chakra_petch_semibold",
} as const;

export const WEB_FONT_FAMILY = {
    RAJDHANI: "Rajdhani",
    CHAKRA_PETCH: "Chakra Petch",
    QUANTICO: "Quantico",
} as const;

export const FONT_WEIGHT = {
    REGULAR: "400",
    SEMIBOLD: "600",
    BOLD: "700",
} as const;

export const FONT_SIZE = {
    PX_12: 12,
    PX_14: 14,
    PX_16: 16,
    PX_20: 20,
} as const;

export const FONT_COLOR = {
    WHITE: 0xffffff,
    PRIMARY: 0xd7e6ff,
    MUTED: 0xb7c5d6,
    SECONDARY: 0x8fb5d6,
    SPEAKER: 0xf2b36d,
    ACTIVITY: 0xea9e3e,
    DANGER: 0xff4d4d,
} as const;
