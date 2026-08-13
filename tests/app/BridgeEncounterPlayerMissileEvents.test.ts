import {
    MISSILE_SIGNATURE,
} from '../../src/engine/defs/missile';
// tests/app/BridgeEncounterPlayerMissileEvents.test.ts

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
    MISSILE_ID,
} from '../../src/engine/defs/missile';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
    type MissileCombatProjectileState,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';

const projectile:
    MissileCombatProjectileState = {
        id: 'projectile_player_00',
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
            'missile_launcher_player_00',

        target: {
            kind:
                COMBAT_TARGET_KIND.ACTOR,

            actorId:
                'ship_enemy_00',
        },

        signature:
                MISSILE_SIGNATURE.A,

            identification: {
            status:
                THREAT_IDENTIFICATION_STATUS
                    .IDENTIFIED,

            signature: 'signature_a',
        },

        missileId:
            MISSILE_ID.BASIC_00,

        timeToImpactMs: 12000,
        initialTimeToImpactMs: 12000,
    };

describe('Bridge player missile event mapping', () => {
    it('maps launch and resolution to outgoing-only bridge events', () => {
        const emit = vi.fn();

        const setEncounterInteractive =
            vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const handler =
            new BridgeEncounterEngineEventHandler(
                eventBus,

                setEncounterInteractive,

                new GameRuntime(),
            );

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_MISSILE_LAUNCHED,

                projectile: {
                    ...projectile,
                },
            },

            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_MISSILE_RESOLVED,

                projectile: {
                    ...projectile,

                    timeToImpactMs: 0,
                },

                outcome:
                    PLAYER_MISSILE_OUTCOME
                        .HIT,

                damage: 1,
                remainingHull: 1,
            },
        ]);

        expect(
            emit.mock.calls,
        ).toEqual([
            [
                BRIDGE_EVENT
                    .OUTGOING_MISSILE_ADDED,

                {
                    projectileId:
                        'projectile_player_00',

                    missileId:
                        MISSILE_ID.BASIC_00,

                    targetActorId:
                        'ship_enemy_00',

                    initialTimeToImpactMs:
                        12000,
                },
            ],

            [
                BRIDGE_EVENT
                    .OUTGOING_MISSILE_REMOVED,

                {
                    projectileId:
                        'projectile_player_00',

                    targetActorId:
                        'ship_enemy_00',

                    outcome:
                        PLAYER_MISSILE_OUTCOME
                            .HIT,
                },
            ],
        ]);

        expect(
            emit.mock.calls.some(
                ([eventName]) => {
                    return (
                        eventName ===
                            BRIDGE_EVENT
                                .INCOMING_MISSILE_ADDED ||
                        eventName ===
                            BRIDGE_EVENT
                                .INCOMING_MISSILE_REMOVED
                    );
                },
            ),
        ).toBe(false);

        expect(
            setEncounterInteractive,
        ).not.toHaveBeenCalled();
    });
});
