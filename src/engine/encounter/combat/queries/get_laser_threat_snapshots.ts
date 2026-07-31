// src/engine/encounter/combat/queries/get_laser_threat_snapshots.ts

import { SHIP_WEAPONS } from '../../../content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import type { LaserAttackState } from '../../model/combat';
import type { EncounterState } from '../../model/state';

export type LaserThreatSnapshot = {
    attack: LaserAttackState;

    timeToFireMs: number;
    initialTimeToFireMs: number;
};

export function getLaserThreatSnapshots(
    state: EncounterState,
): LaserThreatSnapshot[] {
    return state.combat.laserAttacks.map((attack) => {
        const actor = state.actors.find((candidate) => {
            return candidate.id === attack.sourceActorId;
        });

        if (!actor) {
            throw new Error(
                `Laser threat source actor not found: ` +
                    `${attack.id}/${attack.sourceActorId}`,
            );
        }

        const weapon = actor.weapons.find((candidate) => {
            return candidate.id === attack.sourceWeaponId;
        });

        if (!weapon) {
            throw new Error(
                `Laser threat source weapon not found: ` +
                    `${attack.id}/${attack.sourceWeaponId}`,
            );
        }

        if (
            weapon.kind !== SHIP_WEAPON_KIND.LASER ||
            weapon.phase !== SHIP_WEAPON_PHASE.CHARGING
        ) {
            throw new Error(
                `Laser threat source weapon is not charging: ` +
                    `${attack.id}/${weapon.id}/${weapon.kind}/${weapon.phase}`,
            );
        }

        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
            throw new Error(
                `Laser threat weapon definition mismatch: ` +
                    `${attack.id}/${weapon.id}/${weapon.weaponId}`,
            );
        }

        return {
            attack: cloneLaserAttack(attack),

            timeToFireMs: Math.max(
                0,
                definition.chargeDurationMs -
                    weapon.phaseElapsedMs,
            ),

            initialTimeToFireMs:
                definition.chargeDurationMs,
        };
    });
}

function cloneLaserAttack(
    attack: LaserAttackState,
): LaserAttackState {
    return {
        ...attack,

        target: {
            ...attack.target,
        },

        identification: {
            ...attack.identification,
        },
    };
}
