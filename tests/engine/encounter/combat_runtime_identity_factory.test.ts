// tests/engine/encounter/combat_runtime_identity_factory.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import CombatRuntimeIdentityFactory from '../../../src/engine/encounter/combat/CombatRuntimeIdentityFactory';

describe('Combat runtime identities', () => {
    it('keeps object ids independent and threat designations in one mixed sequence', () => {
        const identities =
            new CombatRuntimeIdentityFactory();

        expect(
            identities.createProjectileId(),
        ).toBe('projectile_1');

        expect(
            identities.createBeamCannonAttackId(),
        ).toBe('beam_cannon_attack_1');

        expect(
            identities.createProjectileId(),
        ).toBe('projectile_2');

        expect([
            identities
                .createThreatDesignation('M'),
            identities
                .createThreatDesignation('L'),
            identities
                .createThreatDesignation('M'),
        ]).toEqual([
            'M1',
            'L2',
            'M3',
        ]);
    });
});
