// src\app\manifests\officers\officer_portrait.ts

import { OFFICER_PORTRAIT_ID, type OfficerPortraitId } from '../../../engine/defs/officer';

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const OFFICER_PORTRAIT_SPRITES = {
    [OFFICER_PORTRAIT_ID.SILHOUETTE_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/silhouette_00',
    },

    [OFFICER_PORTRAIT_ID.SCIENCE_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/science/human_00_calm',
    },
    [OFFICER_PORTRAIT_ID.SCIENCE_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/science/alien_00_calm',
    },

    [OFFICER_PORTRAIT_ID.HELM_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/helm/human_00_calm',
    },
    [OFFICER_PORTRAIT_ID.HELM_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/helm/alien_00_calm',
    },

    [OFFICER_PORTRAIT_ID.WEAPONS_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/weapons/human_00_calm',
    },
    [OFFICER_PORTRAIT_ID.WEAPONS_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/weapons/alien_00_calm',
    },

    [OFFICER_PORTRAIT_ID.ENGINEER_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/engineer/human_00_calm',
    },
    [OFFICER_PORTRAIT_ID.ENGINEER_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/engineer/alien_00_calm',
    },
} satisfies Record<OfficerPortraitId, SpriteEntry>;
