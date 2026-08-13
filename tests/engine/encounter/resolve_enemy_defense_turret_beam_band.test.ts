// tests/engine/encounter/resolve_enemy_defense_turret_signature.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
import {
    DEFENSE_TURRET_SIGNATURE,
} from '../../../src/engine/defs/defense_turret';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    resolveEnemyDefenseTurretSignature,
} from '../../../src/engine/encounter/combat/defense_turret/resolve_enemy_defense_turret_signature';

describe('Enemy defense-turret beam-band resolution', () => {
    it('keeps the committed blind fallback without a Science report', () => {
        expect(
            resolveEnemyDefenseTurretSignature({
                observations: [
                    createMissileObservation(
                        'projectile_00',
                    ),
                ],

                projectileId:
                    'projectile_00',

                fallbackSignature:
                    DEFENSE_TURRET_SIGNATURE
                        .A,
            }),
        ).toBe(
            DEFENSE_TURRET_SIGNATURE.A,
        );
    });

    it('trusts the matching Science missile report', () => {
        const observation =
            createMissileObservation(
                'projectile_00',
            );

        observation.report = {
            status: 'confirmed',

            kind:
                ENEMY_THREAT_KIND.MISSILE,

            hypothesis:
                MISSILE_SIGNATURE.B,
        };

        expect(
            resolveEnemyDefenseTurretSignature({
                observations: [
                    observation,
                ],

                projectileId:
                    'projectile_00',

                fallbackSignature:
                    DEFENSE_TURRET_SIGNATURE
                        .A,
            }),
        ).toBe(
            DEFENSE_TURRET_SIGNATURE.B,
        );
    });

    it('ignores a report for another projectile', () => {
        const observation =
            createMissileObservation(
                'projectile_other',
            );

        observation.report = {
            status: 'confirmed',

            kind:
                ENEMY_THREAT_KIND.MISSILE,

            hypothesis:
                MISSILE_SIGNATURE.B,
        };

        expect(
            resolveEnemyDefenseTurretSignature({
                observations: [
                    observation,
                ],

                projectileId:
                    'projectile_00',

                fallbackSignature:
                    DEFENSE_TURRET_SIGNATURE
                        .A,
            }),
        ).toBe(
            DEFENSE_TURRET_SIGNATURE.A,
        );
    });
});

function createMissileObservation(
    projectileId: string,
): EnemyThreatObservationState {
    return {
        id:
            'missile:' +
            projectileId,

        kind:
            ENEMY_THREAT_KIND.MISSILE,

        source: {
            kind:
                ENEMY_THREAT_SOURCE_KIND
                    .COMBAT_PROJECTILE,

            projectileId,
        },
    };
}
