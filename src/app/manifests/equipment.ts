import { DEFAULT_ATLAS_KEY, type SpriteEntry } from "./types";

export const EQUIPMENT_SPRITE_ID = {
    MISSILE_LAUNCHER: "missile_launcher",
    BEAM_CANNON: "beam_cannon",
    STICKY_MINE_DISPENSER: "sticky_mine_dispenser",
    SPAM_PROJECTOR: "spam_projector",
    DEFENSE_TURRET: "defense_turret",
    SHIELD_GENERATOR: "shield_generator",
    DRIVE: "drive",
} as const;

export type EquipmentSpriteId = (typeof EQUIPMENT_SPRITE_ID)[keyof typeof EQUIPMENT_SPRITE_ID];

export const EQUIPMENT_SPRITES = {
    [EQUIPMENT_SPRITE_ID.MISSILE_LAUNCHER]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_missile_launcher",
    },

    [EQUIPMENT_SPRITE_ID.BEAM_CANNON]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_beam_cannon",
    },

    [EQUIPMENT_SPRITE_ID.STICKY_MINE_DISPENSER]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_mine_dispenser",
    },

    [EQUIPMENT_SPRITE_ID.SPAM_PROJECTOR]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_spam_projector",
    },

    [EQUIPMENT_SPRITE_ID.DEFENSE_TURRET]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_defense_turret",
    },

    [EQUIPMENT_SPRITE_ID.SHIELD_GENERATOR]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_shield_generator",
    },

    [EQUIPMENT_SPRITE_ID.DRIVE]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: "equipment/icon_drive",
    },
} satisfies Record<EquipmentSpriteId, SpriteEntry>;
