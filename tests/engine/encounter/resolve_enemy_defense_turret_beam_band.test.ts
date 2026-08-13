// tests/engine/encounter/resolve_enemy_defense_turret_beam_band.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILE_SPECTRAL_BAND,
} from '../../../src/engine/defs/missile';
import {
    DEFENSE_TURRET_BEAM_BAND,
} from '../../../src/engine/defs/defense_turret';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    resolveEnemyDefenseTurretBeamBand,
} from '../../../src/engine/encounter/combat/defense_turret/resolve_enemy_defense_turret_beam_band';

describe('Enemy defense-turret beam-band resolution', () => {
    it('keeps the committed blind fallback without a Science report', () => {
        expect(
            resolveEnemyDefenseTurretBeamBand({
                observations: [
                    createMissileObservation(
                        'projectile_00',
                    ),
                ],

                projectileId:
                    'projectile_00',

                fallbackBeamBand:
                    DEFENSE_TURRET_BEAM_BAND
                        .RED,
            }),
        ).toBe(
            DEFENSE_TURRET_BEAM_BAND.RED,
        );
    });

    it('trusts the matching Science missile report', () => {
        const observation =
            createMissileObservation(
                'projectile_00',
            );

        observation.report = {
            kind:
                ENEMY_THREAT_KIND.MISSILE,

            spectralBand:
                MISSILE_SPECTRAL_BAND.BLUE,
        };

        expect(
            resolveEnemyDefenseTurretBeamBand({
                observations: [
                    observation,
                ],

                projectileId:
                    'projectile_00',

                fallbackBeamBand:
                    DEFENSE_TURRET_BEAM_BAND
                        .RED,
            }),
        ).toBe(
            DEFENSE_TURRET_BEAM_BAND.BLUE,
        );
    });

    it('ignores a report for another projectile', () => {
        const observation =
            createMissileObservation(
                'projectile_other',
            );

        observation.report = {
            kind:
                ENEMY_THREAT_KIND.MISSILE,

            spectralBand:
                MISSILE_SPECTRAL_BAND.BLUE,
        };

        expect(
            resolveEnemyDefenseTurretBeamBand({
                observations: [
                    observation,
                ],

                projectileId:
                    'projectile_00',

                fallbackBeamBand:
                    DEFENSE_TURRET_BEAM_BAND
                        .RED,
            }),
        ).toBe(
            DEFENSE_TURRET_BEAM_BAND.RED,
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
