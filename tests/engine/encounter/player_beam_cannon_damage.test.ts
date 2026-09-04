// tests/engine/encounter/player_beam_cannon_damage.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_ID,
} from '../../../src/engine/defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    BEAM_CANNON_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe('Player beamCannon damage', () => {
    it(
        'resolves the baseline beamCannon shot directly against enemy hull',
        () => {
            const {
                engine,
                targetActor,
            } =
                createAnchoredPlayerCombatTestSetup();

            // Изолируем player shot от enemy offense.
            targetActor.crewRoles = [];
            targetActor.weapons = [];

            const initialHull =
                targetActor.hull;

            expect(
                engine.executeCommand({
                    role:
                        OFFICER_ROLE.GUNNER,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .GUNNER_FIRE_BEAM_CANNON,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON_NODE,
                        node: { kind: 'hull' },

                        weaponId:
                            'beam_cannon_player_00',

                        actorId:
                            targetActor.id,
                    },
                }),
            ).toMatchObject({
                status: 'executed',
            });

            engine.drainEvents();

            engine.step(
                0,
            );

            engine.drainEvents();

            engine.step(
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.BEAM_CANNON_00
                ].chargeDurationMs,
            );

            expect(
                engine.drainEvents(),
            ).toContainEqual(
                expect.objectContaining({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_BEAM_CANNON_FIRED,

                    weaponId:
                        'beam_cannon_player_00',

                    targetActorId:
                        targetActor.id,

                    outcome:
                        BEAM_CANNON_SHOT_OUTCOME.HIT,

                    damage: 1,

                    remainingHull:
                        initialHull - 1,
                }),
            );

            expect(
                targetActor.hull,
            ).toBe(
                initialHull - 1,
            );

        },
    );
});
