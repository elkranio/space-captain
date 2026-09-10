// tests/engine/encounter/combat_test_support.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createPlayerShipFixture } from '../../fixtures/engine/player_ship_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createStationAndBeaconNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    STANDARD_COMBAT_SHIP_BEHAVIOR,
} from '../../../src/engine/content/presets/ship_behaviors';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    SHIELD_GENERATOR_ID,
} from '../../../src/engine/defs/shield_generator';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    type BeamCannonState,
    type MissileLauncherState,
    type ShipWeaponState,
    type SpamProjectorState,
    type StickyMineDispenserState,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { createDebugStartEnemyShip } from '../../../src/engine/generation/new_game/debug_start_ship_factory';
import PowerCoreFactory from '../../../src/engine/generation/ship_system/PowerCoreFactory';
import ShieldGeneratorFactory from '../../../src/engine/generation/ship_system/ShieldGeneratorFactory';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import BeamCannonFactory from '../../../src/engine/generation/ship_weapon/BeamCannonFactory';
import MissileLauncherFactory from '../../../src/engine/generation/ship_weapon/MissileLauncherFactory';
import SpamProjectorFactory from '../../../src/engine/generation/ship_weapon/SpamProjectorFactory';
import StickyMineDispenserFactory from '../../../src/engine/generation/ship_weapon/StickyMineDispenserFactory';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import type {
    ShipEncounterActorState,
} from '../../../src/engine/encounter/actors/ship_encounter_actor';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import type {
    EncounterState,
} from '../../../src/engine/encounter/model/state';

export function getTestMissileTargetingDurationMs(): number {
    return getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE,
    );
}

export type AnchoredPlayerCombatTestSetup = {
    engine: EncounterEngine;
    state: EncounterState;
    targetActor: ShipEncounterActorState;
};

export type AnchoredPlayerCombatTestSetupOptions = {
    random?: () => number;
    playerPowerCoreMounted?: boolean;
};

export function createAnchoredPlayerCombatTestSetup(
    options:
        AnchoredPlayerCombatTestSetupOptions = {},
):
    AnchoredPlayerCombatTestSetup {
    const {
        node,
        beaconId,
    } =
        createStationAndBeaconNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.createFromShip({
            id:
                'ship_generic_00',

            anchorId:
                beaconId,

            team:
                ENCOUNTER_TEAM.ENEMY,

            ship:
                createDebugStartEnemyShip(),

            crewRoles: [
                OFFICER_ROLE.SCIENTIST,
                OFFICER_ROLE.PILOT,
                OFFICER_ROLE.GUNNER,
                OFFICER_ROLE.ENGINEER,
            ],

            behavior:
                STANDARD_COMBAT_SHIP_BEHAVIOR,
        }),
    );

    const engine =
        new EncounterEngine({
            playerShip:
                createPlayerShipFixture({
                    playerHull:
                        createPlayerHullFixture(),

                    mounts: [
                        {
                            slotId: 'drive',
                            equipmentId: 'drive_player_00',
                        },
                        ...(options.playerPowerCoreMounted === false
                            ? []
                            : [
                                  {
                                      slotId: 'power_core',
                                      equipmentId: 'power_core_player_00',
                                  },
                              ]),
                    ],

                    drive:
                        createShipDriveFixture(),

                    powerCore:
                        PowerCoreFactory.create({
                            id:
                                'power_core_player_00',

                            powerCoreId:
                                POWER_CORE_ID
                                    .BASIC_00,
                        }),

                    shieldGenerator:
                        ShieldGeneratorFactory.create({
                            id:
                                'shield_generator_player_00',

                            shieldGeneratorId:
                                SHIELD_GENERATOR_ID
                                    .BASIC_00,
                        }),

                    weapons:
                        createCanonicalPlayerCombatWeapons(),
                }),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    beaconId,
            },

            random:
                options.random ?? (() => 0.5),
        });

    const [loadedEvent] =
        engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT.ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    const state =
        getMutableEncounterStateForTest(engine);

    const targetActor =
        state.actors.find(
            (actor) => {
                return (
                    actor.team ===
                    ENCOUNTER_TEAM.ENEMY
                );
            },
        );

    if (!targetActor) {
        throw new Error(
            'Expected enemy target actor',
        );
    }

    return {
        engine,
        state,

        targetActor,
    };
}

export function createCanonicalPlayerCombatWeapons():
    ShipWeaponState[] {
    return [
        BeamCannonFactory.create({
            id:
                'beam_cannon_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .BEAM_CANNON_00,
        }),

        MissileLauncherFactory.create({
            id:
                'missile_launcher_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .MISSILE_LAUNCHER_00,
        }),

        StickyMineDispenserFactory.create({
            id:
                'sticky_mine_dispenser_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00,
        }),

        SpamProjectorFactory.create({
            id:
                'spam_projector_player_00',

            weaponId:
                SHIP_WEAPON_ID
                    .SPAM_PROJECTOR_00,
        }),
    ];
}

export type EncounterBeamCannonState =
    BeamCannonState &
    EncounterState['combat']['playerWeapons'][number];

export type EncounterMissileLauncherState =
    MissileLauncherState &
    EncounterState['combat']['playerWeapons'][number];

export type EncounterStickyMineDispenserState =
    StickyMineDispenserState &
    EncounterState['combat']['playerWeapons'][number];

export type EncounterSpamProjectorState =
    SpamProjectorState &
    EncounterState['combat']['playerWeapons'][number];

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind: typeof SHIP_WEAPON_KIND.BEAM_CANNON,
): EncounterBeamCannonState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        typeof SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER,
): EncounterMissileLauncherState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        typeof SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER,
): EncounterStickyMineDispenserState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        typeof SHIP_WEAPON_KIND
            .SPAM_PROJECTOR,
): EncounterSpamProjectorState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        | typeof SHIP_WEAPON_KIND.BEAM_CANNON
        | typeof SHIP_WEAPON_KIND
              .MISSILE_LAUNCHER
        | typeof SHIP_WEAPON_KIND
              .STICKY_MINE_DISPENSER
        | typeof SHIP_WEAPON_KIND
              .SPAM_PROJECTOR,
):
    | EncounterBeamCannonState
    | EncounterMissileLauncherState
    | EncounterStickyMineDispenserState
    | EncounterSpamProjectorState {
    const weapon =
        state.combat.playerWeapons.find(
            (candidate) => {
                return (
                    candidate.kind ===
                    kind
                );
            },
        );

    if (!weapon) {
        throw new Error(
            'Expected installed player weapon: ' +
                kind,
        );
    }

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.BEAM_CANNON:
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
        case SHIP_WEAPON_KIND
            .SPAM_PROJECTOR:
            return weapon;

        default:
            throw new Error(
                'Unsupported player weapon in combat test: ' +
                    String(weapon),
            );
    }
}
