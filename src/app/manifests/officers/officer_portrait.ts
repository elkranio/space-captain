// src\app\manifests\officers\officer_portrait.ts

import { OFFICER_PORTRAIT, type OfficerPortrait } from '../../../engine/defs/officer';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const OFFICER_PORTRAIT_MANIFEST = {
    [OFFICER_PORTRAIT.COMMS_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/comms/human_00_calm',
    },
    [OFFICER_PORTRAIT.COMMS_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/comms/alien_00_calm',
    },

    [OFFICER_PORTRAIT.SCIENCE_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/science/human_00_calm',
    },
    [OFFICER_PORTRAIT.SCIENCE_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/science/alien_00_calm',
    },

    [OFFICER_PORTRAIT.HELM_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/helm/human_00_calm',
    },
    [OFFICER_PORTRAIT.HELM_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/helm/alien_00_calm',
    },

    [OFFICER_PORTRAIT.WEAPONS_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/weapons/human_00_calm',
    },
    [OFFICER_PORTRAIT.WEAPONS_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/weapons/alien_00_calm',
    },

    [OFFICER_PORTRAIT.ENGINEER_HUMAN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/engineer/human_00_calm',
    },
    [OFFICER_PORTRAIT.ENGINEER_ALIEN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'officers/engineer/alien_00_calm',
    },
} satisfies Record<OfficerPortrait, SpriteEntry>;
