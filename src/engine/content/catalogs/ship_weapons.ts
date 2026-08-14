// src/engine/content/catalogs/ship_weapons.ts

import missileLauncherTuningData from '../data/missile_launchers.json';
import beamCannonTuningData from '../data/beam_cannons.json';
import spamProjectorTuningData from '../data/spam_projectors.json';
import stickyMineDispenserTuningData from '../data/sticky_mine_dispensers.json';
import shipWeaponRulesData from '../data/ship_weapon_rules.json';
import {
    SHIP_WEAPON_RULES_SCHEMA,
} from '../schemas/ship_weapon_rules';
import {
    BEAM_CANNON_TUNING_SCHEMA,
    MISSILE_LAUNCHER_TUNING_SCHEMA,
    SPAM_PROJECTOR_TUNING_SCHEMA,
    STICKY_MINE_DISPENSER_TUNING_SCHEMA,
} from '../schemas/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    type BeamCannonDefinition,
    type MissileLauncherDefinition,
    type ShipWeaponDefinition,
    type ShipWeaponId,
    type SpamProjectorDefinition,
    type StickyMineDispenserDefinition,
} from '../../defs/ship_weapon';

const SHIP_WEAPON_RULES =
    SHIP_WEAPON_RULES_SCHEMA.parse(
        shipWeaponRulesData,
    );

const MISSILE_LAUNCHER_TUNING =
    MISSILE_LAUNCHER_TUNING_SCHEMA.parse(
        missileLauncherTuningData,
    );

const BEAM_CANNON_TUNING =
    BEAM_CANNON_TUNING_SCHEMA.parse(
        beamCannonTuningData,
    );

const SPAM_PROJECTOR_TUNING =
    SPAM_PROJECTOR_TUNING_SCHEMA.parse(
        spamProjectorTuningData,
    );

const STICKY_MINE_DISPENSER_TUNING =
    STICKY_MINE_DISPENSER_TUNING_SCHEMA.parse(
        stickyMineDispenserTuningData,
    );

// Любое enemy weapon сначала проходит одинаковый targeting.
// Это не даёт определить тип атаки по длительности warning lamp.
export const SHIP_WEAPON_TARGETING_DURATION_MS =
    SHIP_WEAPON_RULES
        .enemy_targeting
        .durationMs;

const MISSILE_LAUNCHERS =
    Object.entries(
        MISSILE_LAUNCHER_TUNING,
    ).map(
        (
            [
                id,
                tuning,
            ],
        ): MissileLauncherDefinition => {
            return {
                id,
                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,
                ...tuning,
            };
        },
    );

const BEAM_CANNONS =
    Object.entries(
        BEAM_CANNON_TUNING,
    ).map(
        (
            [
                id,
                tuning,
            ],
        ): BeamCannonDefinition => {
            return {
                id,
                kind:
                    SHIP_WEAPON_KIND.BEAM_CANNON,
                ...tuning,
            };
        },
    );

const SPAM_PROJECTORS =
    Object.entries(
        SPAM_PROJECTOR_TUNING,
    ).map(
        (
            [
                id,
                tuning,
            ],
        ): SpamProjectorDefinition => {
            return {
                id,
                kind:
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,
                ...tuning,
            };
        },
    );

const STICKY_MINE_DISPENSERS =
    Object.entries(
        STICKY_MINE_DISPENSER_TUNING,
    ).map(
        (
            [
                id,
                tuning,
            ],
        ): StickyMineDispenserDefinition => {
            return {
                id,
                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,
                ...tuning,
            };
        },
    );

const ALL_SHIP_WEAPON_DEFINITIONS:
    ShipWeaponDefinition[] = [
        ...MISSILE_LAUNCHERS,
        ...BEAM_CANNONS,
        ...SPAM_PROJECTORS,
        ...STICKY_MINE_DISPENSERS,
    ];

type ShipWeaponCatalog =
    Record<
        ShipWeaponId,
        ShipWeaponDefinition
    > & {
        [SHIP_WEAPON_ID
            .MISSILE_LAUNCHER_00]:
            MissileLauncherDefinition;

        [SHIP_WEAPON_ID.BEAM_CANNON_00]:
            BeamCannonDefinition;

        [SHIP_WEAPON_ID
            .SPAM_PROJECTOR_00]:
            SpamProjectorDefinition;

        [SHIP_WEAPON_ID
            .STICKY_MINE_DISPENSER_00]:
            StickyMineDispenserDefinition;
    };

const shipWeapons:
    Record<
        ShipWeaponId,
        ShipWeaponDefinition
    > = {};

for (
    const definition of
    ALL_SHIP_WEAPON_DEFINITIONS
) {
    if (
        Object.prototype
            .hasOwnProperty.call(
                shipWeapons,
                definition.id,
            )
    ) {
        throw new Error(
            'Duplicate ship weapon content id: ' +
                definition.id,
        );
    }

    shipWeapons[
        definition.id
    ] = definition;
}

// Open string ids stay available for editor-created content,
// while stable builtin ids retain their concrete definition types.
export const SHIP_WEAPONS =
    shipWeapons as ShipWeaponCatalog;
