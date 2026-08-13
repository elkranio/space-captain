// src/app/manifests/ships/ship_sprite.ts

import shipSpriteManifestData from './ship_sprites.json';
import {
    type ShipSpriteId,
} from '../../../engine/defs/ship_chassis';
import {
    DEFAULT_ATLAS_KEY,
    type SpriteEntry,
} from '../types';

type ShipSpriteManifestEntry = {
    frameKey: string;
};

type ShipSpriteManifest =
    Record<
        string,
        ShipSpriteManifestEntry
    >;

const SHIP_SPRITE_MANIFEST:
    ShipSpriteManifest =
        shipSpriteManifestData;

export const SHIP_SPRITES =
    Object.fromEntries(
        Object.entries(
            SHIP_SPRITE_MANIFEST,
        ).map(
            (
                [
                    spriteId,
                    entry,
                ],
            ) => {
                return [
                    spriteId,
                    {
                        atlasKey:
                            DEFAULT_ATLAS_KEY,

                        frameKey:
                            entry.frameKey,
                    },
                ];
            },
        ),
    ) as Record<
        ShipSpriteId,
        SpriteEntry
    >;
