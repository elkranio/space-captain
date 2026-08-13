import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    POINT_DEFENSE_ID,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
import {
    SHIELD_EMITTER_ID,
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
} from '../../../src/engine/defs/shield_emitter';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('Enemy defense sandbox preset', () => {
    it(
        'creates a fully crewed defensive enemy with whole-ship shield support',
        () => {
            const actor =
                ShipNodeActorFactory.create({
                    id:
                        'ship_enemy_defense_sandbox_00',

                    presetId:
                        SHIP_NODE_ACTOR_PRESET_ID
                            .ENEMY_DEFENSE_SANDBOX_00,

                    anchorId:
                        'anchor_00',
                });

            expect(actor.weapons)
                .toEqual([]);

            expect(actor.pointDefense)
                .toEqual({
                    id:
                        'point_defense_00',

                    pointDefenseId:
                        POINT_DEFENSE_ID
                            .BASIC_00,

                    phase:
                        POINT_DEFENSE_PHASE
                            .READY,
                    phaseElapsedMs: 0,

                    loadedBand: null,
                    targetProjectileId:
                        null,
                });

            expect(
                actor.powerCore,
            ).toEqual({
                id:
                    'power_core_00',

                powerCoreId:
                    POWER_CORE_ID
                        .BASIC_00,

                charges: 4,
                rechargeElapsedMs: 0,
            });

            expect(
                actor.shieldEmitter,
            ).toEqual({
                id:
                    'shield_emitter_00',

                shieldEmitterId:
                    SHIELD_EMITTER_ID
                        .BASIC_00,

                status:
                    SHIELD_EMITTER_STATUS
                        .ONLINE,

                phase:
                    SHIELD_EMITTER_PHASE
                        .READY,

                phaseElapsedMs: 0,
            });

            expect(actor.crewRoles)
                .toEqual([
                    OFFICER_ROLE.SCIENCE,
                    OFFICER_ROLE.HELM,
                    OFFICER_ROLE.WEAPONS,
                    OFFICER_ROLE.ENGINEER,
                ]);
        },
    );
});
