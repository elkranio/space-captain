// src/engine/encounter/combat/EnemyScienceIntelResolver.ts

import {
    MISSILES,
} from '../../../../content/catalogs/missiles';
import {
    CREW_TRAIT_ID,
} from '../../../../defs/crew_trait';
import {
    MISSILE_SPECTRAL_BAND,
    type MissileSpectralBand,
} from '../../../../defs/missile';
import {
    OFFICER_ROLE,
} from '../../../../defs/officer';
import type {
    ShipEncounterActorState,
} from '../../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../../model/combat';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
    type EnemyThreatReport,
} from '../../../model/enemy_threat_observation';
import type {
    EncounterState,
} from '../../../model/state';

// Единственная граница между:
// - objective combat truth;
// - report, доступным enemy policy.
//
// HUNGOVER Science всегда выдаёт
// правдоподобный, но неверный вариант.
// Сам report не знает, что он ложный.
export default class EnemyScienceIntelResolver {
    constructor(
        private readonly state:
            EncounterState,
    ) {}

    public resolve(
        actor: ShipEncounterActorState,
        observationId: string,
    ): EnemyThreatReport {
        const observation =
            actor
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.id ===
                        observationId
                    );
                });

        if (!observation) {
            throw new Error(
                'Enemy threat observation is missing: ' +
                    actor.id +
                    '/' +
                    observationId,
            );
        }

        const truthfulReport =
            this.resolveTruth(
                actor,
                observation,
            );

        if (
            !this.isScienceHungover(
                actor,
            )
        ) {
            return truthfulReport;
        }

        return this.createFalseReport(
            truthfulReport,
        );
    }

    private resolveTruth(
        actor: ShipEncounterActorState,
        observation:
            EnemyThreatObservationState,
    ): EnemyThreatReport {
        switch (observation.kind) {
            case ENEMY_THREAT_KIND.MISSILE:
                return this.resolveMissileTruth(
                    actor,
                    observation,
                );

            case ENEMY_THREAT_KIND.LASER:
                throw new Error(
                    'Player laser does not expose Science intel ' +
                        'in the current combat model: ' +
                        actor.id +
                        '/' +
                        observation.id,
                );

            case ENEMY_THREAT_KIND
                .STICKY_MINE:
                throw new Error(
                    'Sticky mine observation ' +
                        'does not require Science intel: ' +
                        actor.id +
                        '/' +
                        observation.id,
                );
        }
    }

    private resolveMissileTruth(
        actor: ShipEncounterActorState,
        observation:
            EnemyThreatObservationState,
    ): EnemyThreatReport {
        const source =
            observation.source;

        if (
            source.kind !==
            ENEMY_THREAT_SOURCE_KIND
                .COMBAT_PROJECTILE
        ) {
            throw new Error(
                'Missile observation has ' +
                    'invalid source: ' +
                    actor.id +
                    '/' +
                    observation.id +
                    '/' +
                    source.kind,
            );
        }

        const projectile =
            this.state
                .combat
                .projectiles
                .find((candidate) => {
                    return (
                        candidate.id ===
                        source.projectileId
                    );
                });

        if (
            !projectile ||
            projectile.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR ||
            projectile.target.actorId !==
                actor.id
        ) {
            throw new Error(
                'Missile observation source ' +
                    'is no longer valid: ' +
                    actor.id +
                    '/' +
                    observation.id,
            );
        }

        return {
            kind:
                ENEMY_THREAT_KIND.MISSILE,

            spectralBand:
                MISSILES[
                    projectile.missileId
                ].spectralBand,
        };
    }

    private isScienceHungover(
        actor: ShipEncounterActorState,
    ): boolean {
        return (
            actor
                .crewTraitsByRole[
                    OFFICER_ROLE.SCIENCE
                ]
                ?.includes(
                    CREW_TRAIT_ID
                        .HUNGOVER,
                ) ??
            false
        );
    }

    private createFalseReport(
        truthfulReport:
            EnemyThreatReport,
    ): EnemyThreatReport {
        return {
            kind:
                ENEMY_THREAT_KIND
                    .MISSILE,

            spectralBand:
                this.getWrongSpectralBand(
                    truthfulReport
                        .spectralBand,
                ),
        };
    }

    private getWrongSpectralBand(
        truthfulBand:
            MissileSpectralBand,
    ): MissileSpectralBand {
        switch (truthfulBand) {
            case MISSILE_SPECTRAL_BAND.RED:
                return (
                    MISSILE_SPECTRAL_BAND
                        .BLUE
                );

            case MISSILE_SPECTRAL_BAND.BLUE:
                return (
                    MISSILE_SPECTRAL_BAND
                        .RED
                );
        }
    }

}
