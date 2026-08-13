import type {
    MissileId,
} from '../../defs/missile';
import {
    COMBAT_PROJECTILE_KIND,
    type CombatSource,
    type CombatTarget,
} from './combat';

// Presentation-safe projectile payload for encounter events.
//
// The mutable combat projectile owns hidden objective signature truth and
// observer identification state. Events only expose the physical information
// required to present the discrete missile transition.
export type MissileEventProjectileSnapshot = {
    id: string;
    designation: string;

    kind:
        typeof COMBAT_PROJECTILE_KIND
            .MISSILE;

    source:
        CombatSource;

    sourceWeaponId:
        string;

    target:
        CombatTarget;

    missileId:
        MissileId;

    timeToImpactMs:
        number;

    initialTimeToImpactMs:
        number;
};

// Explicit allowlist instead of Omit: adding a new internal projectile field
// must never make it cross the encounter outbox automatically.
export function createMissileEventProjectileSnapshot(
    projectile:
        MissileEventProjectileSnapshot,
): MissileEventProjectileSnapshot {
    return {
        id:
            projectile.id,

        designation:
            projectile.designation,

        kind:
            projectile.kind,

        source: {
            ...projectile.source,
        },

        sourceWeaponId:
            projectile.sourceWeaponId,

        target: {
            ...projectile.target,
        },

        missileId:
            projectile.missileId,

        timeToImpactMs:
            projectile.timeToImpactMs,

        initialTimeToImpactMs:
            projectile.initialTimeToImpactMs,
    };
}
