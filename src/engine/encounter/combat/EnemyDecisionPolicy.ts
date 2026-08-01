// src/engine/encounter/combat/EnemyDecisionPolicy.ts

import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';

// Пока policy намеренно простая:
//
// - для каждой роли идёт round-robin
//   по её оружию в порядке loadout;
// - недоступное оружие пропускается;
// - scheduler остаётся только исполнителем.
//
// Позже здесь появятся состояние боя,
// defensive priorities и behavior preset.
export default class EnemyDecisionPolicy {
    public selectWeapon(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipWeaponState | undefined {
        const weapons =
            actor.weapons.filter((weapon) => {
                return (
                    this.getWeaponRole(weapon) ===
                    role
                );
            });

        if (weapons.length === 0) {
            return undefined;
        }

        const startIndex =
            actor.decision
                .nextWeaponIndexByRole[role] ??
            0;

        for (
            let offset = 0;
            offset < weapons.length;
            offset += 1
        ) {
            const index =
                (startIndex + offset) %
                weapons.length;

            const weapon = weapons[index];

            if (
                !weapon ||
                !this.canOperateWeapon(weapon)
            ) {
                continue;
            }

            actor.decision
                .nextWeaponIndexByRole[role] =
                (index + 1) % weapons.length;

            return weapon;
        }

        return undefined;
    }

    private getWeaponRole(
        weapon: ShipWeaponState,
    ): OfficerRole {
        if (
            weapon.kind ===
            SHIP_WEAPON_KIND.SPAM_PROJECTOR
        ) {
            return OFFICER_ROLE.SCIENCE;
        }

        return OFFICER_ROLE.WEAPONS;
    }

    private canOperateWeapon(
        weapon: ShipWeaponState,
    ): boolean {
        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return (
                    weapon.loadedMissileId !== null &&
                    weapon.ammoCount > 0
                );

            case SHIP_WEAPON_KIND.LASER:
                return true;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return (
                    weapon.activeChannelId === null
                );

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return true;
        }
    }
}
