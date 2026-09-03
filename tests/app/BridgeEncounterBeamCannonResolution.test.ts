// tests/app/BridgeEncounterBeamCannonResolution.test.ts

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterPersistenceSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterPersistenceSynchronizer';
import BridgeEncounterEngineEventHandler from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterEngineEventHandler';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    COMBAT_TARGET_KIND,
    BEAM_CANNON_SHOT_OUTCOME,
    type BeamCannonAttackSnapshot,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../src/engine/encounter/model/event';

describe('BridgeEncounterEngineEventHandler beamCannon resolution', () => {
    it('adds a beamCannon threat when charging starts', () => {
        const { handler, emit } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.BEAM_CANNON_ATTACK_STARTED,

                attack: createAttack(),
            },
        ]);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.BEAM_CANNON_THREAT_ADDED,

                {
                    attackId: 'beam_cannon_attack_1',

                    designation: 'L1',

                    sourceActorId: 'ship_enemy_00',
                },
            ],
        ]);
    });

    it('removes the threat, emits a hit beam and damages hull', () => {
        const { handler, runtime, emit } = createHandler();

        handler.handle([
            {
                type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,

                attack: createAttack(),

                outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
                appliedDamage: 1,
                remainingHull: 2,
                destroyed: false,
            },
        ]);

        expect(runtime.getCurrentRun().player.ship.hull).toBe(2);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.BEAM_CANNON_THREAT_REMOVED,

                {
                    attackId: 'beam_cannon_attack_1',
                },
            ],

            [
                BRIDGE_EVENT.BEAM_CANNON_BEAM_FIRED,

                {
                    sourceActorId: 'ship_enemy_00',

                    outcome:
                        BEAM_CANNON_SHOT_OUTCOME.HIT,
                },
            ],

        ]);

    });

    it('removes the threat and emits a miss beam without changing persistent hull', () => {
        const {
            handler,
            runtime,
            emit,
        } = createHandler();

        const hullBefore =
            runtime
                .getCurrentRun()
                .player
                .ship
                .hull;

        handler.handle([
            {
                type:
                    ENCOUNTER_EVENT
                        .BEAM_CANNON_FIRED,

                attack:
                    createAttack(),

                outcome:
                    BEAM_CANNON_SHOT_OUTCOME
                        .MISS,
            },
        ]);

        expect(
            runtime
                .getCurrentRun()
                .player
                .ship
                .hull,
        ).toBe(
            hullBefore,
        );

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT
                    .BEAM_CANNON_THREAT_REMOVED,

                {
                    attackId:
                        'beam_cannon_attack_1',
                },
            ],

            [
                BRIDGE_EVENT
                    .BEAM_CANNON_BEAM_FIRED,

                {
                    sourceActorId:
                        'ship_enemy_00',

                    outcome:
                        BEAM_CANNON_SHOT_OUTCOME
                            .MISS,
                },
            ],
        ]);

    });
});

function createHandler() {
    const runtime = new GameRuntime();

    const emit = vi.fn();

    const eventBus = {
        emit,
    } as unknown as BridgeEventBus;

    const eventHandler =
        new BridgeEncounterEngineEventHandler(
            eventBus,
        );

    const persistenceSynchronizer =
        new BridgeEncounterPersistenceSynchronizer(
            runtime,
        );

    return {
        runtime,
        emit,

        handler: {
            handle(events: EncounterEvent[]): void {
                for (const event of events) {
                    persistenceSynchronizer.syncEvent(event);
                    eventHandler.handle([event]);
                }
            },
        },
    };
}

function createAttack(): BeamCannonAttackSnapshot {
    return {
        id: 'beam_cannon_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'beam_cannon_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

    };
}
