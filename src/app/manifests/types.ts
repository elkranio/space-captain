// src\app\manifests\types.ts

export const DEFAULT_ATLAS_KEY = 'atlas' as const;

export type AtlasKey = typeof DEFAULT_ATLAS_KEY;

export type SpriteEntry = {
    atlasKey: AtlasKey;
    frameKey: string;
};
