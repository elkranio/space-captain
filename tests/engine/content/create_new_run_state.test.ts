// tests/engine/content/create_new_run_state.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    createNewRunState,
} from '../../../src/engine/content/new_game/create_new_run_state';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    MISSILE_ID,
} from '../../../src/engine/defs/missile';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';

describe('createNewRunState', () => {
    it('creates the configured starting player ship', () => {
        const run = createNewRunState();

        expect(run.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',

                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },
            defenseCapacitor: {
                id:
                    'defense_capacitor_player_00',

                defenseCapacitorId:
                    DEFENSE_CAPACITOR_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            },

            weapons: [
                {
                    id: 'laser_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .LASER_00,

                    kind:
                        SHIP_WEAPON_KIND.LASER,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },

                {
                    id:
                        'missile_launcher_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .MISSILE_LAUNCHER_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,

                    loadedMissileId:
                        MISSILE_ID.RED_00,

                    ammoCount: 5,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },

                {
                    id:
                        'sticky_mine_dispenser_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

                    loadedMineId:
                        STICKY_MINE_ID.BASIC_00,

                    ammoCount: 6,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,

                    dispensedMineCount: 0,
                },

                {
                    id:
                        'spam_projector_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .SPAM_PROJECTOR_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,

                    activeChannelId: null,
                },
            ],
        });
    });

    it('creates independent mutable player ship state for each run', () => {
        const firstRun = createNewRunState();
        const secondRun = createNewRunState();

        firstRun.player.ship.hull = 1;

        firstRun.player.ship.drive.status =
            SHIP_DRIVE_STATUS.DISABLED;
        firstRun
            .player
            .ship
            .defenseCapacitor
            .charges = 1;

        firstRun
            .player
            .ship
            .defenseCapacitor
            .rechargeElapsedMs = 12000;

        const firstWeapon =
            firstRun.player.ship.weapons[0];

        const secondWeapon =
            secondRun.player.ship.weapons[0];

        if (!firstWeapon || !secondWeapon) {
            throw new Error(
                'Expected installed player lasers',
            );
        }

        firstWeapon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        firstWeapon.phaseElapsedMs = 500;

        expect(
            firstRun.player.ship.weapons,
        ).not.toBe(
            secondRun.player.ship.weapons,
        );

        expect(firstWeapon).not.toBe(
            secondWeapon,
        );

        expect(secondRun.player.ship).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',

                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },
            defenseCapacitor: {
                id:
                    'defense_capacitor_player_00',

                defenseCapacitorId:
                    DEFENSE_CAPACITOR_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            },

            weapons: [
                {
                    id: 'laser_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .LASER_00,

                    kind:
                        SHIP_WEAPON_KIND.LASER,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },

                {
                    id:
                        'missile_launcher_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .MISSILE_LAUNCHER_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,

                    loadedMissileId:
                        MISSILE_ID.RED_00,

                    ammoCount: 5,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                },

                {
                    id:
                        'sticky_mine_dispenser_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

                    loadedMineId:
                        STICKY_MINE_ID.BASIC_00,

                    ammoCount: 6,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,

                    dispensedMineCount: 0,
                },

                {
                    id:
                        'spam_projector_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .SPAM_PROJECTOR_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,

                    activeChannelId: null,
                },
            ],
        });
    });
});
