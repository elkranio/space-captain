// src/app/manifests/ui/speech_bubble.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const SPEECH_BUBBLE_SPRITE_ID = {
    OFFICER_BARK_00_TOP_LEFT: "officer_bark_00_top_left",
    OFFICER_BARK_00_TOP: "officer_bark_00_top",
    OFFICER_BARK_00_TOP_RIGHT: "officer_bark_00_top_right",

    OFFICER_BARK_00_LEFT: "officer_bark_00_left",
    OFFICER_BARK_00_CENTER: "officer_bark_00_center",
    OFFICER_BARK_00_RIGHT: "officer_bark_00_right",

    OFFICER_BARK_00_BOTTOM_LEFT: "officer_bark_00_bottom_left",
    OFFICER_BARK_00_BOTTOM: "officer_bark_00_bottom",
    OFFICER_BARK_00_BOTTOM_RIGHT: "officer_bark_00_bottom_right",

    OFFICER_BARK_00_TAIL_BOTTOM: "officer_bark_00_tail_bottom",
} as const;

export type SpeechBubbleSpriteId = (typeof SPEECH_BUBBLE_SPRITE_ID)[keyof typeof SPEECH_BUBBLE_SPRITE_ID];

export const SPEECH_BUBBLE_SPRITES = {
    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TOP_LEFT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/top_left",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TOP]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/top",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TOP_RIGHT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/top_right",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_LEFT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/left",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_CENTER]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/center",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_RIGHT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/right",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_BOTTOM_LEFT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/bottom_left",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_BOTTOM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/bottom",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_BOTTOM_RIGHT]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/bottom_right",
    },

    [SPEECH_BUBBLE_SPRITE_ID.OFFICER_BARK_00_TAIL_BOTTOM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/speech_bubble/officer_bark_00/tail_bottom",
    },
} satisfies Record<SpeechBubbleSpriteId, SpriteEntry>;
