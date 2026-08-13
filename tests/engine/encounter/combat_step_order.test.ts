import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
// tests/engine/encounter/combat_step_order.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILES,
} from '../../../src/engine/content/catalogs/missiles';
import {
    MISSILE_ID,
} from '../../../src/engine/defs/missile';
import CombatRunner from '../../../src/engine/encounter/combat/CombatRunner';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
    type PlayerMissileResolvedEvent,
} from '../../../src/engine/encounter/model/event';
import EncounterStateStore from '../../../src/engine/encounter/state/EncounterStateStore';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe('Combat step order', () => {
    it('integrates a new missile before an older lethal impact without advancing the new missile', () => {
        const {
            state,
            targetActor,
        } =
            createAnchoredPlayerCombatTestSetup();

        const missileId =
            MISSILE_ID.BASIC_00;

        const missile =
            MISSILES[missileId];

        targetActor.hull =
            missile.damage;

        targetActor.maxHull =
            Math.max(
                targetActor.maxHull,
                missile.damage,
            );

        targetActor.crewRoles = [];
        targetActor.crewTasks = {};
        targetActor.weapons = [];

        state.combat.projectiles.push({
            id: 'projectile_existing',
            designation: 'M0',

            kind:
                COMBAT_PROJECTILE_KIND
                    .MISSILE,

            source: {
                kind:
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP,
            },

            sourceWeaponId:
                'player_launcher_existing',

            target: {
                kind:
                    COMBAT_TARGET_KIND.ACTOR,

                actorId:
                    targetActor.id,
            },

            signature:
                MISSILE_SIGNATURE.A,

            identification: {
                status:
                    THREAT_IDENTIFICATION_STATUS
                        .IDENTIFIED,

                signature:
                    'signature_a',
            },

            missileId,

            timeToImpactMs: 1,
            initialTimeToImpactMs: 1,
        });

        const stateStore =
            new EncounterStateStore(
                state,
            );

        const events:
            EncounterEvent[] = [];

        let runner:
            CombatRunner;

        runner =
            new CombatRunner({
                stateStore,

                emit: (event) => {
                    events.push(event);
                },

                random: () => 0,

                interruptRandomOfficerTask:
                    () => {},

                purgePlayerSpamChannel:
                    () => false,

                destroyEnemyActor:
                    (actorId) => {
                        runner
                            .removePlayerCombatObjectsTargetingActor(
                                actorId,
                            );

                        stateStore
                            .removeActor(
                                actorId,
                            );
                    },
            });

        runner.queuePlayerMissileLaunch({
            sourceWeaponId:
                'player_launcher_new',

            missileId,

            targetActorId:
                targetActor.id,
        });

        runner.step(1);

        const resolvedEvents =
            events.filter(
                (
                    event,
                ): event is
                    PlayerMissileResolvedEvent => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT
                            .PLAYER_MISSILE_RESOLVED
                    );
                },
            );

        expect(
            resolvedEvents.map((event) => {
                return {
                    projectileId:
                        event.projectile.id,

                    outcome:
                        event.outcome,

                    timeToImpactMs:
                        event.projectile
                            .timeToImpactMs,
                };
            }),
        ).toEqual([
            {
                projectileId:
                    'projectile_existing',

                outcome:
                    PLAYER_MISSILE_OUTCOME
                        .HIT,

                timeToImpactMs: 0,
            },
            {
                projectileId:
                    'projectile_1',

                outcome:
                    PLAYER_MISSILE_OUTCOME
                        .TARGET_LOST,

                timeToImpactMs:
                    missile.flightDurationMs,
            },
        ]);

        expect(
            state.combat.projectiles,
        ).toEqual([]);

        expect(
            state.actors.some((actor) => {
                return (
                    actor.id ===
                    targetActor.id
                );
            }),
        ).toBe(false);
    });
});
