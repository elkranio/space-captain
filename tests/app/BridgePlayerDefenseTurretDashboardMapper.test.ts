import { describe, expect, it } from 'vitest';
import {
    DEFENSE_TURRETS,
} from '../../src/engine/content/catalogs/defense_turrets';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../src/engine/defs/defense_turret';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    SHIP_EVADE_PHASE,
} from '../../src/engine/defs/ship_evade';
import {
    OFFICER_TASK_KIND,
} from '../../src/engine/defs/officer_task';
import {
    OFFICER_AVAILABILITY_STATE,
} from '../../src/engine/encounter/model/officer_availability';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../src/engine/encounter/model/command';
import {
    mapPlayerShipToBridgeDashboardPayload,
} from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgePlayerShipDashboardMapper';

type MapperInput =
    Parameters<
        typeof mapPlayerShipToBridgeDashboardPayload
    >[0];

describe(
    'Bridge player Defense Turret dashboard mapping',
    () => {
        it(
            'maps the active intercept task independently from the installed turret phase',
            () => {
                const input =
                    createBaseInput();

                input.player.officerTasks = [
                    {
                        id:
                            'defense_turret_task_00',

                        kind:
                            OFFICER_TASK_KIND
                                .GUNNER_DEFENSE_TURRET,

                        role:
                            OFFICER_ROLE.GUNNER,

                        sourceCommandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .GUNNER_INTERCEPT_MISSILE,

                        label:
                            'INTERCEPT',

                        durationMs: 3000,
                        elapsedMs: 1500,

                        canBeCancelledByPlayer:
                            true,

                        threatId:
                            'incoming_00',
                    },
                ];

                const payload =
                    mapPlayerShipToBridgeDashboardPayload(
                        input,
                    );

                expect(
                    payload.status
                        ?.defenseTurret,
                ).toEqual({
                    iconId:
                        DEFENSE_TURRETS[
                            DEFENSE_TURRET_ID.BASIC_00
                        ].iconId,

                    shortName:
                        'DEF. TURRET',

                    powerCost:
                        1,

                    phase:
                        DEFENSE_TURRET_PHASE
                            .READY,

                    slotId:
                        'defense_01',

                    integrity: {
                        current: 2,
                        max: 2,
                    },

                    targets: [],

                    operatorBusy: false,

                    intercept: {
                        threatId:
                            'incoming_00',

                        progress:
                            0.5,
                    },
                });
            },
        );

        it(
            'maps the independent recovery clock as normalized cooldown progress',
            () => {
                const input =
                    createBaseInput();

                const defenseTurret =
                    input.player
                        .defenseTurret;

                if (!defenseTurret) {
                    throw new Error(
                        'Expected Defense Turret fixture',
                    );
                }

                defenseTurret.state.phase =
                    DEFENSE_TURRET_PHASE
                        .COOLDOWN;

                defenseTurret
                    .state
                    .cooldownRemainingMs =
                    4000;

                const payload =
                    mapPlayerShipToBridgeDashboardPayload(
                        input,
                    );

                expect(
                    payload.status
                        ?.defenseTurret,
                ).toEqual({
                    iconId:
                        DEFENSE_TURRETS[
                            DEFENSE_TURRET_ID.BASIC_00
                        ].iconId,

                    shortName:
                        'DEF. TURRET',

                    powerCost:
                        1,

                    phase:
                        DEFENSE_TURRET_PHASE
                            .COOLDOWN,

                    slotId:
                        'defense_01',

                    integrity: {
                        current: 2,
                        max: 2,
                    },

                    targets: [],

                    operatorBusy: false,

                    cooldownProgress:
                        0.5,
                });
            },
        );
    },
);

function createBaseInput(): MapperInput {
    return {
        player: {
            hull: {
                hull: 3,
                maxHull: 3,
            },

            drive: {
                id:
                    'drive_player_00',

                driveId:
                    'basic_00',

                integrity: 1,
            },

            evade: {
                phase:
                    SHIP_EVADE_PHASE.READY,

                phaseElapsedMs: 0,
                cooldownRemainingMs: 0,
            },

            mounts: [
                {
                    slotId: 'drive',
                    equipmentId: 'drive_player_00',
                },
                {
                    slotId: 'power_core',
                    equipmentId: 'power_core_player_00',
                },
                {
                    slotId: 'defense_01',
                    equipmentId: 'defense_turret_player_00',
                },
            ],

            weapons: [],

            powerCore: {
                state: {
                    id:
                        'power_core_player_00',

                    powerCoreId:
                        'power_core_basic_00',

                    charges: 4,

                    rechargeElapsedMs:
                        0,
                },

                capacity: 4,

                integrity: {
                    current: 2,
                    max: 2,
                },
            },

            defenseTurret: {
                state: {
                    id:
                        'defense_turret_player_00',

                    defenseTurretId:
                        DEFENSE_TURRET_ID
                            .BASIC_00,

                    phase:
                        DEFENSE_TURRET_PHASE
                            .READY,

                    phaseElapsedMs:
                        0,

                    cooldownRemainingMs:
                        0,

                    targetProjectileId:
                        null,
                },

                cooldownDurationMs:
                    8000,

                integrity: {
                    current: 2,
                    max: 2,
                },
            },

            activeShield: null,

            officerAvailability: {
                [OFFICER_ROLE.SCIENTIST]:
                    OFFICER_AVAILABILITY_STATE
                        .AVAILABLE,

                [OFFICER_ROLE.PILOT]:
                    OFFICER_AVAILABILITY_STATE
                        .AVAILABLE,

                [OFFICER_ROLE.GUNNER]:
                    OFFICER_AVAILABILITY_STATE
                        .AVAILABLE,

                [OFFICER_ROLE.ENGINEER]:
                    OFFICER_AVAILABILITY_STATE
                        .AVAILABLE,
            },

            officerTasks: [],
        },

        commandsByRole: {
            [OFFICER_ROLE.SCIENTIST]: [],
            [OFFICER_ROLE.PILOT]: [],
            [OFFICER_ROLE.GUNNER]: [],
            [OFFICER_ROLE.ENGINEER]: [],
        },

        incomingMissiles: [],

        chassisId: 'player_00',
    };
}
