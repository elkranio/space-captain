// tests/app/MissileSpriteManifest.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILE_SPRITE_ID,
    MISSILE_SPRITES,
} from '../../src/app/manifests/combat/missiles/missile_sprite';
import {
    DEFAULT_ATLAS_KEY,
} from '../../src/app/manifests/types';

describe('Missile sprite manifest', () => {
    it('keeps explicit incoming and outgoing frames', () => {
        expect(
            MISSILE_SPRITE_ID,
        ).toEqual({
            GENERIC_INCOMING_00:
                'generic_incoming_00',

            GENERIC_OUTGOING_00:
                'generic_outgoing_00',
        });

        expect(
            MISSILE_SPRITES,
        ).toEqual({
            generic_incoming_00: {
                atlasKey:
                    DEFAULT_ATLAS_KEY,

                frameKey:
                    'combat/missiles/generic_incoming_00',
            },

            generic_outgoing_00: {
                atlasKey:
                    DEFAULT_ATLAS_KEY,

                frameKey:
                    'combat/missiles/generic_outgoing_00',
            },
        });
    });
});
