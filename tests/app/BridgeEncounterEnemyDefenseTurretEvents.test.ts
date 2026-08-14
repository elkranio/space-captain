// tests/app/BridgeEncounterEnemyDefenseTurretEvents.test.ts

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    DEFENSE_TURRET_SHOT_OUTCOME,
} from '../../src/engine/defs/defense_turret';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';
import type {
    MissileEventProjectileSnapshot,
} from '../../src/engine/encounter/model/missile_event_projectile';

const projectile:
    MissileEventProjectileSnapshot = {
        id:
            'projectile_player_00',

        designation: 'M1',

        kind:
            COMBAT_PROJECTILE_KIND
                .MISSILE,

        source: {
            kind:
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP,
        },

        sourceWeaponId:
            'player_missile_launcher_00',

        target: {
            kind:
                COMBAT_TARGET_KIND.ACTOR,

            actorId:
                'ship_enemy_00',
        },


        timeToImpactMs: 9000,
        initialTimeToImpactMs: 12000,
    };

describe(
    'Bridge enemy defense-turret events',
    () => {
        it(
            'emits the shot before intercepted missile removal',
            () => {
                const emit = vi.fn();

                const handler =
                    new BridgeEncounterEngineEventHandler(
                        {
                            emit,
                        } as unknown as BridgeEventBus,

                        vi.fn(),
                        new GameRuntime(),
                    );

                handler.handle([
                    {
                        type:
                            ENCOUNTER_EVENT
                                .ENEMY_DEFENSE_TURRET_LOADING_STARTED,

                        sourceActorId:
                            'ship_enemy_00',

                        defenseTurretId:
                            'defense_turret_00',

                        projectileId:
                            projectile.id,

                        loadDurationMs: 3000,
                    },

                    {
                        type:
                            ENCOUNTER_EVENT
                                .ENEMY_DEFENSE_TURRET_FIRED,

                        sourceActorId:
                            'ship_enemy_00',

                        defenseTurretId:
                            'defense_turret_00',

                        projectile: {
                            ...projectile,
                        },

                        outcome:
                            DEFENSE_TURRET_SHOT_OUTCOME
                                .HIT,

                        remainingCharges: 2,
                    },

                    {
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_MISSILE_RESOLVED,

                        projectile: {
                            ...projectile,
                        },

                        outcome:
                            PLAYER_MISSILE_OUTCOME
                                .INTERCEPTED,
                    },
                ]);

                expect(
                    emit.mock.calls,
                ).toEqual([
                    [
                        BRIDGE_EVENT
                            .ENEMY_DEFENSE_TURRET_FIRED,

                        {
                            sourceActorId:
                                'ship_enemy_00',

                            projectileId:
                                projectile.id,

                            outcome:
                                DEFENSE_TURRET_SHOT_OUTCOME
                                    .HIT,
                        },
                    ],

                    [
                        BRIDGE_EVENT
                            .OUTGOING_MISSILE_REMOVED,

                        {
                            projectileId:
                                projectile.id,

                            targetActorId:
                                'ship_enemy_00',

                            outcome:
                                PLAYER_MISSILE_OUTCOME
                                    .INTERCEPTED,
                        },
                    ],
                ]);
            },
        );
    },
);
