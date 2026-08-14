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
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../src/engine/defs/shield_generator';

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
            defenseTurret: {
                id:
                    'defense_turret_player_00',

                defenseTurretId:
                    DEFENSE_TURRET_ID
                        .BASIC_00,

                phase:
                    DEFENSE_TURRET_PHASE
                        .READY,

                phaseElapsedMs: 0,

                targetProjectileId:
                    null,
            },

            powerCore: {
                id:
                    'power_core_player_00',

                powerCoreId:
                    POWER_CORE_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            },

            shieldGenerator: {
                id:
                    'shield_generator_player_00',

                shieldGeneratorId:
                    SHIELD_GENERATOR_ID
                        .BASIC_00,

                status:
                    SHIELD_GENERATOR_STATUS
                        .ONLINE,

                phase:
                    SHIELD_GENERATOR_PHASE
                        .READY,

                phaseElapsedMs: 0,
            },

            weapons: [
                {
                    id: 'beam_cannon_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00,

                    kind:
                        SHIP_WEAPON_KIND.BEAM_CANNON,

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
            .defenseTurret
            .phase =
                DEFENSE_TURRET_PHASE
                    .COOLDOWN;

        expect(
            firstRun
                .player
                .ship
                .defenseTurret,
        ).not.toBe(
            secondRun
                .player
                .ship
                .defenseTurret,
        );

        expect(
            secondRun
                .player
                .ship
                .defenseTurret
                .phase,
        ).toBe(
            DEFENSE_TURRET_PHASE
                .READY,
        );
        firstRun
            .player
            .ship
            .powerCore
            .charges = 1;

        firstRun
            .player
            .ship
            .powerCore
            .rechargeElapsedMs = 12000;

        firstRun
            .player
            .ship
            .shieldGenerator
            .status =
                SHIELD_GENERATOR_STATUS
                    .BROKEN;

        firstRun
            .player
            .ship
            .shieldGenerator
            .phase =
                SHIELD_GENERATOR_PHASE
                    .COOLDOWN;

        firstRun
            .player
            .ship
            .shieldGenerator
            .phaseElapsedMs = 900;

        expect(
            firstRun
                .player
                .ship
                .shieldGenerator,
        ).not.toBe(
            secondRun
                .player
                .ship
                .shieldGenerator,
        );

        const firstWeapon =
            firstRun.player.ship.weapons[0];

        const secondWeapon =
            secondRun.player.ship.weapons[0];

        if (!firstWeapon || !secondWeapon) {
            throw new Error(
                'Expected installed player beamCannons',
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
            defenseTurret: {
                id:
                    'defense_turret_player_00',

                defenseTurretId:
                    DEFENSE_TURRET_ID
                        .BASIC_00,

                phase:
                    DEFENSE_TURRET_PHASE
                        .READY,

                phaseElapsedMs: 0,

                targetProjectileId:
                    null,
            },

            powerCore: {
                id:
                    'power_core_player_00',

                powerCoreId:
                    POWER_CORE_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            },

            shieldGenerator: {
                id:
                    'shield_generator_player_00',

                shieldGeneratorId:
                    SHIELD_GENERATOR_ID
                        .BASIC_00,

                status:
                    SHIELD_GENERATOR_STATUS
                        .ONLINE,

                phase:
                    SHIELD_GENERATOR_PHASE
                        .READY,

                phaseElapsedMs: 0,
            },

            weapons: [
                {
                    id: 'beam_cannon_player_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00,

                    kind:
                        SHIP_WEAPON_KIND.BEAM_CANNON,

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
