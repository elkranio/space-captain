// src/engine/generation/space_node_actor/ShipNodeActorFactory.ts

import {
    SHIP_NODE_ACTOR_PRESETS,
    type ShipNodeActorPresetId,
    type ShipNodeActorWeaponPreset,
} from '../../content/presets/ship_node_actors';
import { SHIP_WEAPON_KIND, type ShipWeaponState } from '../../defs/ship_weapon';
import { SPACE_NODE_ACTOR_KIND, type ShipSpaceNodeActorState } from '../../defs/universe';
import LaserWeaponFactory from '../ship_weapon/LaserWeaponFactory';
import MissileLauncherFactory from '../ship_weapon/MissileLauncherFactory';

export type CreateShipNodeActorInput = {
    // Runtime id конкретного корабля внутри ноды.
    id: string;

    presetId: ShipNodeActorPresetId;

    anchorId: string;
};

// Собирает свежий persistent state корабля,
// который затем копируется в runtime encounter.
export default class ShipNodeActorFactory {
    public static create({ id, presetId, anchorId }: CreateShipNodeActorInput): ShipSpaceNodeActorState {
        const preset = SHIP_NODE_ACTOR_PRESETS[presetId];

        return {
            id,
            kind: SPACE_NODE_ACTOR_KIND.SHIP,

            team: preset.team,

            shipId: preset.shipId,
            anchorId,

            weapons: preset.weapons.map((weapon) => {
                return this.createWeapon(weapon);
            }),
        };
    }

    private static createWeapon(preset: ShipNodeActorWeaponPreset): ShipWeaponState {
        switch (preset.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return MissileLauncherFactory.create({
                    id: preset.id,

                    presetId: preset.presetId,
                });

            case SHIP_WEAPON_KIND.LASER:
                return LaserWeaponFactory.create({
                    id: preset.id,

                    weaponId: preset.weaponId,
                });
        }
    }
}
