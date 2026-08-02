// tests/engine/encounter/combat_test_support.ts

import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    type LaserWeaponState,
    type MissileLauncherState,
    type StickyMineDispenserState,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import type {
    ShipEncounterActorState,
} from '../../../src/engine/encounter/actors/ship/ship_encounter_actor';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import type {
    EncounterState,
} from '../../../src/engine/encounter/model/state';

export type AnchoredPlayerCombatTestSetup = {
    engine: EncounterEngine;
    state: EncounterState;
    targetActor: ShipEncounterActorState;
};

export function createAnchoredPlayerCombatTestSetup():
    AnchoredPlayerCombatTestSetup {
    const run =
        createNewRunState();

    const startNode =
        run.universe.nodes.find((node) => {
            return node.id === 'node_start';
        });

    if (!startNode) {
        throw new Error(
            'Expected new-game start node',
        );
    }

    const engine =
        new EncounterEngine({
            node:
                startNode,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId:
                    startNode
                        .arrivalAnchorId,
            },

            drive:
                run.player.ship.drive,

            pointDefense:
                run.player.ship
                    .pointDefense,

            shieldGenerator:
                run.player.ship
                    .shieldGenerator,

            weapons:
                run.player.ship
                    .weapons,
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

    const targetActor =
        loadedEvent.state.actors.find(
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
        state:
            loadedEvent.state,

        targetActor,
    };
}

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind: typeof SHIP_WEAPON_KIND.LASER,
): LaserWeaponState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        typeof SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER,
): MissileLauncherState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        typeof SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER,
): StickyMineDispenserState;

export function getPlayerWeaponOrThrow(
    state: EncounterState,
    kind:
        | typeof SHIP_WEAPON_KIND.LASER
        | typeof SHIP_WEAPON_KIND
              .MISSILE_LAUNCHER
        | typeof SHIP_WEAPON_KIND
              .STICKY_MINE_DISPENSER,
):
    | LaserWeaponState
    | MissileLauncherState
    | StickyMineDispenserState {
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
        case SHIP_WEAPON_KIND.LASER:
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return weapon;

        default:
            throw new Error(
                'Unsupported player weapon kind in combat test: ' +
                    weapon.kind,
            );
    }
}
