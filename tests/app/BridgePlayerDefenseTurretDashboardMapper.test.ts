import { describe, expect, it } from 'vitest';
import {
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../src/engine/defs/defense_turret';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
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
                const payload =
                    mapPlayerShipToBridgeDashboardPayload({
                        ...createBaseInput(),

                        officerTasks: [
                            {
                                id:
                                    'defense_turret_task_00',

                                kind:
                                    OFFICER_TASK_KIND
                                        .WEAPONS_DEFENSE_TURRET,

                                role:
                                    OFFICER_ROLE.WEAPONS,

                                sourceCommandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .WEAPONS_INTERCEPT_MISSILE,

                                label:
                                    'INTERCEPT',

                                showProgress: true,

                                durationMs: 3000,
                                elapsedMs: 1500,

                                canBeCancelledByPlayer:
                                    true,

                                canBeInterruptedByDamage:
                                    true,

                                threatId:
                                    'incoming_00',
                            },
                        ],
                    });

                expect(
                    payload.status
                        ?.defenseTurret,
                ).toEqual({
                    phase:
                        DEFENSE_TURRET_PHASE
                            .READY,

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
                    input.playerStatus
                        ?.defenseTurret;

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
                    phase:
                        DEFENSE_TURRET_PHASE
                            .COOLDOWN,

                    cooldownProgress:
                        0.5,
                });
            },
        );
    },
);

function createBaseInput(): MapperInput {
    return {
        weapons: [],

        availableWeaponsCommands:
            [],

        weaponsOfficerAvailability:
            OFFICER_AVAILABILITY_STATE
                .AVAILABLE,

        availableHelmCommands: [],

        helmOfficerAvailability:
            OFFICER_AVAILABILITY_STATE
                .AVAILABLE,

        officerTasks: [],

        playerStatus: {
            hull: {
                hull: 3,
                maxHull: 3,
            },

            drive: {
                id:
                    'drive_player_00',

                driveId:
                    'drive_basic_00',

                status:
                    'online',

                integrity: 1,
            },

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
            },
        },
    };
}
