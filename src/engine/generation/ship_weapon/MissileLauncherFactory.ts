// src/engine/generation/ship_weapon/MissileLauncherFactory.ts

import { MISSILE_LAUNCHER_PRESETS, type MissileLauncherPresetId } from '../../content/ship_weapon_presets';
import { SHIP_WEAPONS } from '../../content/ship_weapons';
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type MissileLauncherState } from '../../defs/ship_weapon';

export type CreateMissileLauncherInput = {
    // Runtime id конкретной установленной ракетницы.
    id: string;

    presetId: MissileLauncherPresetId;

    // Нужен тестам и отдельным encounter setups.
    // Без override используется значение preset.
    ammoCount?: number;
};

// Собирает свежий mutable state установленной ракетницы
// из immutable content preset и weapon definition.
export default class MissileLauncherFactory {
    public static create({ id, presetId, ammoCount }: CreateMissileLauncherInput): MissileLauncherState {
        const preset = MISSILE_LAUNCHER_PRESETS[presetId];

        const definition = SHIP_WEAPONS[preset.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error(
                `Cannot create missile launcher from weapon definition: ` + `${definition.id}/${definition.kind}`,
            );
        }

        const resolvedAmmoCount = ammoCount ?? preset.ammoCount;

        if (
            !Number.isInteger(resolvedAmmoCount) ||
            resolvedAmmoCount < 0 ||
            resolvedAmmoCount > definition.ammoCapacity
        ) {
            throw new Error(
                `Invalid missile launcher ammo count: ` + `${resolvedAmmoCount}/${definition.ammoCapacity}`,
            );
        }

        return {
            id,

            weaponId: definition.id,
            kind: definition.kind,

            loadedMissileId: preset.loadedMissileId,

            ammoCount: resolvedAmmoCount,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
        };
    }
}
