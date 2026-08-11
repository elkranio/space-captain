// tests/runtime/GameRuntime.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../src/engine/defs/defense_capacitor';
import {
    MISSILE_ID,
} from '../../src/engine/defs/missile';
import {
    POINT_DEFENSE_ID,
} from '../../src/engine/defs/point_defense';
import {
    STICKY_MINE_ID,
} from '../../src/engine/defs/sticky_mine';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../src/engine/defs/ship_weapon';

describe('GameRuntime player ship hull', () => {
    it('creates a new run with full player ship state', () => {
        const runtime = new GameRuntime();

        expect(
            runtime.getCurrentRun().player.ship,
        ).toEqual({
            hull: 3,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',

                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            pointDefense: {
                id:
                    'point_defense_player_00',

                pointDefenseId:
                    POINT_DEFENSE_ID
                        .BASIC_00,
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

            shieldGenerator: {
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs:
                    20000,

                chargeRegenerationElapsedMs: 0,
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

    it('persists an exact player hull snapshot', () => {
        const runtime = new GameRuntime();

        runtime.setPlayerShipHull(
            2,
        );

        expect(
            runtime.getCurrentRun()
                .player.ship.hull,
        ).toBe(2);

        runtime.setPlayerShipHull(
            0,
        );

        expect(
            runtime.getCurrentRun().player.ship,
        ).toEqual({
            hull: 0,
            maxHull: 3,

            drive: {
                id: 'drive_player_00',

                driveId:
                    SHIP_DRIVE_ID.BASIC_00,

                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },

            pointDefense: {
                id:
                    'point_defense_player_00',

                pointDefenseId:
                    POINT_DEFENSE_ID
                        .BASIC_00,
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

            shieldGenerator: {
                charges: 3,
                maxCharges: 3,

                chargeRegenerationDurationMs:
                    20000,

                chargeRegenerationElapsedMs: 0,
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

    it('rejects a player hull snapshot outside its installed maximum', () => {
        const runtime = new GameRuntime();

        expect(() => {
            runtime.setPlayerShipHull(
                -1,
            );
        }).toThrow(
            'Player ship hull must be in [0, maxHull]: -1/3',
        );

        expect(() => {
            runtime.setPlayerShipHull(
                4,
            );
        }).toThrow(
            'Player ship hull must be in [0, maxHull]: 4/3',
        );
    });
});

describe('GameRuntime player drive', () => {
    it('updates persistent drive status without replacing the installed drive', () => {
        const runtime = new GameRuntime();

        runtime.setPlayerShipDriveState({
            id: 'drive_player_00',

            driveId:
                SHIP_DRIVE_ID.BASIC_00,

            status:
                SHIP_DRIVE_STATUS.DISABLED,
        });

        expect(
            runtime.getCurrentRun().player.ship.drive,
        ).toEqual({
            id: 'drive_player_00',

            driveId:
                SHIP_DRIVE_ID.BASIC_00,

            status:
                SHIP_DRIVE_STATUS.DISABLED,
        });
    });
});

describe('GameRuntime player defense capacitor', () => {
    it('updates persistent defense-capacitor runtime state', () => {
        const runtime =
            new GameRuntime();

        runtime
            .setPlayerShipDefenseCapacitorState({
                id:
                    'defense_capacitor_player_00',

                defenseCapacitorId:
                    DEFENSE_CAPACITOR_ID
                        .BASIC_00,

                charges: 2,
                rechargeElapsedMs: 7500,
            });

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .defenseCapacitor,
        ).toEqual({
            id:
                'defense_capacitor_player_00',

            defenseCapacitorId:
                DEFENSE_CAPACITOR_ID
                    .BASIC_00,

            charges: 2,
            rechargeElapsedMs: 7500,
        });
    });

    it('rejects invalid defense-capacitor runtime state', () => {
        const runtime =
            new GameRuntime();

        expect(() => {
            runtime
                .setPlayerShipDefenseCapacitorState({
                    id:
                        'defense_capacitor_player_00',

                    defenseCapacitorId:
                        DEFENSE_CAPACITOR_ID
                            .BASIC_00,

                    charges: 5,
                    rechargeElapsedMs: 0,
                });
        }).toThrow(
            'Player defense-capacitor charges must be an integer between 0 and 4: 5',
        );

        expect(() => {
            runtime
                .setPlayerShipDefenseCapacitorState({
                    id:
                        'defense_capacitor_player_00',

                    defenseCapacitorId:
                        DEFENSE_CAPACITOR_ID
                            .BASIC_00,

                    charges: 3,
                    rechargeElapsedMs: 24000,
                });
        }).toThrow(
            'Player defense-capacitor recharge elapsed must be in [0, 24000): 24000',
        );

        expect(() => {
            runtime
                .setPlayerShipDefenseCapacitorState({
                    id:
                        'defense_capacitor_player_00',

                    defenseCapacitorId:
                        DEFENSE_CAPACITOR_ID
                            .BASIC_00,

                    charges: 4,
                    rechargeElapsedMs: 1,
                });
        }).toThrow(
            'Full player defense capacitor must have zero recharge elapsed: 1',
        );
    });
});

describe('GameRuntime player shield generator', () => {
    it('updates persistent shield-generator runtime state', () => {
        const runtime = new GameRuntime();

        runtime
            .setPlayerShipShieldGeneratorState({
                charges: 1,
                maxCharges: 3,

                chargeRegenerationDurationMs:
                    20000,

                chargeRegenerationElapsedMs:
                    7500,
            });

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .shieldGenerator,
        ).toEqual({
            charges: 1,
            maxCharges: 3,

            chargeRegenerationDurationMs:
                20000,

            chargeRegenerationElapsedMs: 7500,
        });
    });

    it('rejects invalid shield-generator runtime state', () => {
        const runtime = new GameRuntime();

        expect(() => {
            runtime
                .setPlayerShipShieldGeneratorState({
                    charges: 4,
                    maxCharges: 3,

                    chargeRegenerationDurationMs:
                        20000,

                    chargeRegenerationElapsedMs:
                        0,
                });
        }).toThrow(
            'Player shield-generator charges ' +
                'must be an integer between 0 and 3: 4',
        );

        expect(() => {
            runtime
                .setPlayerShipShieldGeneratorState({
                    charges: 2,
                    maxCharges: 3,

                    chargeRegenerationDurationMs:
                        20000,

                    chargeRegenerationElapsedMs:
                        20000,
                });
        }).toThrow(
            'Player shield-generator regeneration elapsed ' +
                'must be in [0, 20000): 20000',
        );

        expect(() => {
            runtime
                .setPlayerShipShieldGeneratorState({
                    charges: 3,
                    maxCharges: 3,

                    chargeRegenerationDurationMs:
                        20000,

                    chargeRegenerationElapsedMs:
                        1,
                });
        }).toThrow(
            'Fully charged player shield generator ' +
                'must have zero regeneration elapsed: 1',
        );
    });
});
