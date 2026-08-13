// src/engine/encounter/combat/resolve_enemy_defense_turret_signature.ts

import type {
    DefenseTurretSignature,
} from '../../../defs/defense_turret';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatObservationState,
} from '../../model/enemy_threat_observation';

export type ResolveEnemyDefenseTurretSignatureInput = {
    observations:
        readonly EnemyThreatObservationState[];

    projectileId: string;

    // Random transitional signature committed when Weapons starts loading.
    fallbackSignature:
        DefenseTurretSignature;
};

// Deterministic report-consumption boundary.
//
// The physical runner does not inspect objective missile properties here.
// If Science has a concrete hypothesis for the active projectile, point
// defense trusts it whether the intel is UNCERTAIN or CONFIRMED.
// Without a hypothesis it keeps the transitional blind fallback.
//
// Final blindInterceptChance resolution is a later atom.
export function resolveEnemyDefenseTurretSignature({
    observations,
    projectileId,
    fallbackSignature,
}: ResolveEnemyDefenseTurretSignatureInput):
    DefenseTurretSignature {
    const observation =
        observations.find((candidate) => {
            return (
                candidate.kind ===
                    ENEMY_THREAT_KIND.MISSILE &&
                candidate.source.kind ===
                    ENEMY_THREAT_SOURCE_KIND
                        .COMBAT_PROJECTILE &&
                candidate.source.projectileId ===
                    projectileId
            );
        });

    if (
        !observation ||
        observation.report?.kind !==
            ENEMY_THREAT_KIND.MISSILE
    ) {
        return fallbackSignature;
    }

    return observation.report.hypothesis;
}
