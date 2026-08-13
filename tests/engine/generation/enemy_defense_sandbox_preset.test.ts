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
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../src/engine/defs/shield_generator';
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

            expect(actor.defenseTurret)
                .toEqual({
                    id:
                        'defense_turret_00',

                    defenseTurretId:
                        DEFENSE_TURRET_ID
                            .BASIC_00,

                    phase:
                        DEFENSE_TURRET_PHASE
                            .READY,
                    phaseElapsedMs: 0,

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
                actor.shieldGenerator,
            ).toEqual({
                id:
                    'shield_generator_00',

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
