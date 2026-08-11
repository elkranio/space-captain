// tests/engine/encounter/player_laser_damage.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
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
    LASER_SHOT_OUTCOME,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe('Player laser damage', () => {
    it(
        'resolves the baseline laser shot directly against enemy hull',
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
                        OFFICER_ROLE.WEAPONS,

                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_LASER,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON,

                        weaponId:
                            'laser_player_00',

                        actorId:
                            targetActor.id,
                    },
                }),
            ).toMatchObject({
                status: 'executed',
            });

            engine.drainEvents();

            engine.step(
                SHIP_WEAPON_TARGETING_DURATION_MS,
            );

            engine.drainEvents();

            engine.step(
                SHIP_WEAPONS[
                    SHIP_WEAPON_ID.LASER_00
                ].chargeDurationMs,
            );

            expect(
                engine.drainEvents(),
            ).toContainEqual(
                expect.objectContaining({
                    type:
                        ENCOUNTER_EVENT
                            .PLAYER_LASER_FIRED,

                    weaponId:
                        'laser_player_00',

                    targetActorId:
                        targetActor.id,

                    outcome:
                        LASER_SHOT_OUTCOME.HIT,

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
