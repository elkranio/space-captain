// tests/engine/encounter/player_weapon_state.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import LaserWeaponFactory from '../../../src/engine/generation/ship_weapon/LaserWeaponFactory';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('Player weapon encounter state', () => {
    it('clones installed weapons into encounter state and detached queries', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const installedWeapon =
            LaserWeaponFactory.create({
                id: 'laser_player_test',

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,
            });

        const installedWeapons = [
            installedWeapon,
        ];

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },

            drive:
                createShipDriveFixture(),

            pointDefense:
                createPointDefenseFixture(),

            weapons: installedWeapons,
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

        const encounterWeapons =
            loadedEvent.state
                .combat
                .playerWeapons;

        expect(encounterWeapons).toEqual([
            {
                id: 'laser_player_test',

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,

                kind:
                    SHIP_WEAPON_KIND.LASER,

                phase:
                    SHIP_WEAPON_PHASE.READY,

                phaseElapsedMs: 0,
            },
        ]);

        expect(encounterWeapons).not.toBe(
            installedWeapons,
        );

        const encounterWeapon =
            encounterWeapons[0];

        if (!encounterWeapon) {
            throw new Error(
                'Expected encounter player weapon',
            );
        }

        expect(encounterWeapon).not.toBe(
            installedWeapon,
        );

        installedWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        installedWeapon.phaseElapsedMs = 500;

        expect(encounterWeapon.phase).toBe(
            SHIP_WEAPON_PHASE.READY,
        );

        expect(
            encounterWeapon.phaseElapsedMs,
        ).toBe(0);

        const querySnapshot =
            engine.getPlayerWeaponStates();

        expect(querySnapshot).not.toBe(
            encounterWeapons,
        );

        expect(querySnapshot[0]).not.toBe(
            encounterWeapon,
        );

        const queryWeapon =
            querySnapshot[0];

        if (!queryWeapon) {
            throw new Error(
                'Expected queried player weapon',
            );
        }

        queryWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        queryWeapon.phaseElapsedMs = 750;

        expect(
            engine.getPlayerWeaponStates(),
        ).toEqual([
            {
                id: 'laser_player_test',

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,

                kind:
                    SHIP_WEAPON_KIND.LASER,

                phase:
                    SHIP_WEAPON_PHASE.READY,

                phaseElapsedMs: 0,
            },
        ]);
    });
});
