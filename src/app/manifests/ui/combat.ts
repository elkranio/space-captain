import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "../types";

export const UI_COMBAT_SPRITE_ID = {
    ROLE_E: "role_e",
    ROLE_H: "role_h",
    ROLE_S: "role_s",
    ROLE_W: "role_w",

    THREAT_BEAM_CANNON: "threat_beam_cannon",
    THREAT_MINE: "threat_mine",
    THREAT_MISSILE: "threat_missile",
    THREAT_SPAM: "threat_spam",
} as const;

export type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];

export const UI_COMBAT_SPRITES = {
    [UI_COMBAT_SPRITE_ID.ROLE_E]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/role_glyphs/role_e",
    },

    [UI_COMBAT_SPRITE_ID.ROLE_H]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/role_glyphs/role_h",
    },

    [UI_COMBAT_SPRITE_ID.ROLE_S]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/role_glyphs/role_s",
    },

    [UI_COMBAT_SPRITE_ID.ROLE_W]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "ui/role_glyphs/role_w",
    },

    [UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/threat_icons/beam_cannon",
    },

    [UI_COMBAT_SPRITE_ID.THREAT_MINE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/threat_icons/mine",
    },

    [UI_COMBAT_SPRITE_ID.THREAT_MISSILE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/threat_icons/missile",
    },

    [UI_COMBAT_SPRITE_ID.THREAT_SPAM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "bridge/ui/threat_icons/spam",
    },
} satisfies Record<UiCombatSpriteId, SpriteEntry>;
