// src/engine/encounter/combat/queries/get_beam_cannon_threat_snapshots.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from "../../../defs/ship_weapon";
import type { BeamCannonAttackState } from "../../model/combat";
import type { EncounterState } from "../../model/state";
import { createDetachedSnapshot } from "../../snapshots/create_detached_snapshot";

export type BeamCannonThreatSnapshot = {
    attack: BeamCannonAttackState;

    timeToFireMs: number;
    initialTimeToFireMs: number;
};

export function getBeamCannonThreatSnapshots(state: EncounterState): BeamCannonThreatSnapshot[] {
    return createDetachedSnapshot(
        state.combat.beamCannonAttacks.map((attack) => {
            const actor = state.actors.find((candidate) => {
                return candidate.id === attack.sourceActorId;
            });

            if (!actor) {
                throw new Error(`BeamCannon threat source actor not found: ` + `${attack.id}/${attack.sourceActorId}`);
            }

            const weapon = actor.weapons.find((candidate) => {
                return candidate.id === attack.sourceWeaponId;
            });

            if (!weapon) {
                throw new Error(
                    `BeamCannon threat source weapon not found: ` + `${attack.id}/${attack.sourceWeaponId}`,
                );
            }

            if (weapon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON || weapon.phase !== SHIP_WEAPON_PHASE.CHARGING) {
                throw new Error(
                    `BeamCannon threat source weapon is not charging: ` +
                        `${attack.id}/${weapon.id}/${weapon.kind}/${weapon.phase}`,
                );
            }

            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
                throw new Error(
                    `BeamCannon threat weapon definition mismatch: ` + `${attack.id}/${weapon.id}/${weapon.weaponId}`,
                );
            }

            return {
                attack,

                timeToFireMs: Math.max(0, definition.chargeDurationMs - weapon.phaseElapsedMs),

                initialTimeToFireMs: definition.chargeDurationMs,
            };
        }),
    );
}
