// tests/engine/encounter/enemy_task_scheduler.test.ts

import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_BEHAVIOR_PRESETS,
    SHIP_BEHAVIOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_behaviors';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/defs/officer_task';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import EnemyTaskScheduler from '../../../src/engine/encounter/combat/enemy/EnemyTaskScheduler';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../../src/engine/encounter/model/event';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

const OFFENSIVE_TASK_DELAY_MS =
    SHIP_BEHAVIOR_PRESETS[
        SHIP_BEHAVIOR_PRESET_ID
            .STANDARD_COMBAT_00
    ].offensiveTaskDelayMs;

const SCIENCE_IDENTIFY_THREAT_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .SCIENCE_IDENTIFY_THREAT,
    );

describe('Enemy task scheduler', () => {
    it('starts one Weapons task and one Science task in parallel', () => {
        const {
            engine,
            actor,
        } = createEnemyCombatEngine();

        engine.step(0);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId:
                    'missile_launcher_00',
            },
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId:
                    'spam_projector_00',
            },
        ]);

        expect(actor.crewTasks).toEqual({
            [OFFICER_ROLE.WEAPONS]: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .OPERATE_WEAPON,

                role: OFFICER_ROLE.WEAPONS,

                weaponId:
                    'missile_launcher_00',
            },

            [OFFICER_ROLE.SCIENCE]: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .OPERATE_WEAPON,

                role: OFFICER_ROLE.SCIENCE,

                weaponId:
                    'spam_projector_00',
            },
        });

        expect(
            actor.weapons.map((weapon) => {
                return weapon.phase;
            }),
        ).toEqual([
            SHIP_WEAPON_PHASE.TARGETING,
            SHIP_WEAPON_PHASE.READY,
            SHIP_WEAPON_PHASE.READY,
            SHIP_WEAPON_PHASE.TARGETING,
        ]);
    });

    it('executes Science identification intent before Science weapon work', () => {
        const {
            state,
            actor,
        } = createEnemyCombatEngine();

        const events:
            EncounterEvent[] = [];

        const scheduler =
            new EnemyTaskScheduler({
                state,

                emit: (event) => {
                    events.push(event);
                },

                clearPlayerStickyMine:
                    () => false,

                purgePlayerSpamChannel:
                    () => false,
            });

        actor.threatObservations.push({
            id:
                'missile:projectile_00',

            kind:
                ENEMY_THREAT_KIND.MISSILE,

            source: {
                kind:
                    ENEMY_THREAT_SOURCE_KIND
                        .COMBAT_PROJECTILE,

                projectileId:
                    'projectile_00',
            },
        });

        scheduler.schedule(0);

        expect(events).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId:
                    'missile_launcher_00',
            },
        ]);

        expect(actor.crewTasks).toEqual({
            [OFFICER_ROLE.WEAPONS]: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .OPERATE_WEAPON,

                role: OFFICER_ROLE.WEAPONS,

                weaponId:
                    'missile_launcher_00',
            },

            [OFFICER_ROLE.SCIENCE]: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .IDENTIFY_THREAT,

                role:
                    OFFICER_ROLE.SCIENCE,

                observationId:
                    'missile:projectile_00',

                elapsedMs: 0,

                durationMs:
                    SCIENCE_IDENTIFY_THREAT_DURATION_MS,
            },
        });

        expect(
            actor.weapons[3]?.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });

    it('waits after a completed offensive task before scheduling the next weapon', () => {
        const {
            engine,
            actor,
        } = createEnemyCombatEngine();

        engine.step(0);
        engine.drainEvents();

        engine.step(
            SHIP_WEAPON_TARGETING_DURATION_MS,
        );

        expect(
            engine
                .drainEvents()
                .map((event) => {
                    return event.type;
                }),
        ).toEqual([
            ENCOUNTER_EVENT.MISSILE_LAUNCHED,
            ENCOUNTER_EVENT.SPAM_CHANNEL_STARTED,
        ]);

        expect(
            actor.crewTasks[
                OFFICER_ROLE.WEAPONS
            ],
        ).toBeUndefined();

        expect(
            actor.decision
                .offensiveTaskDelayRemainingMsByRole[
                    OFFICER_ROLE.WEAPONS
                ],
        ).toBe(OFFENSIVE_TASK_DELAY_MS);

        expect(
            actor.crewTasks[
                OFFICER_ROLE.SCIENCE
            ],
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role: OFFICER_ROLE.SCIENCE,

            weaponId: 'spam_projector_00',
        });

        engine.step(
            OFFENSIVE_TASK_DELAY_MS - 1,
        );

        expect(engine.drainEvents()).toEqual([]);

        expect(
            actor.crewTasks[
                OFFICER_ROLE.WEAPONS
            ],
        ).toBeUndefined();

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId: 'beam_cannon_00',
            },
        ]);

        expect(
            actor.crewTasks[
                OFFICER_ROLE.WEAPONS
            ],
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role: OFFICER_ROLE.WEAPONS,

            weaponId: 'beam_cannon_00',
        });

        expect(
            actor.weapons[1]?.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.TARGETING,
        );

        expect(
            actor.weapons[2]?.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });

    it('does not schedule work for a missing crew role', () => {
        const {
            engine,
            actor,
        } = createEnemyCombatEngine([
            OFFICER_ROLE.WEAPONS,
        ]);

        engine.step(0);

        expect(engine.drainEvents()).toEqual([
            {
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId:
                    'missile_launcher_00',
            },
        ]);

        expect(
            actor.crewTasks[
                OFFICER_ROLE.WEAPONS
            ],
        ).toBeDefined();

        expect(
            actor.crewTasks[
                OFFICER_ROLE.SCIENCE
            ],
        ).toBeUndefined();

        expect(
            actor.weapons[3]?.phase,
        ).toBe(
            SHIP_WEAPON_PHASE.READY,
        );
    });
});

function createEnemyCombatEngine(
    crewRoles?: OfficerRole[],
) {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    const nodeActor =
        ShipNodeActorFactory.create({
            id: 'ship_enemy_combat_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_COMBAT_00,

            anchorId: stationId,
        });

    if (crewRoles) {
        nodeActor.crewRoles = [
            ...crewRoles,
        ];
    }

    node.actors.push(nodeActor);

    const engine = new EncounterEngine({
        playerHull:
            createPlayerHullFixture(),

        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId: stationId,
        },

        drive: createShipDriveFixture(),
        random: () => 0,
    });

    const [loadedEvent] =
        engine.drainEvents();

    if (
        loadedEvent.type !==
        ENCOUNTER_EVENT.ENCOUNTER_LOADED
    ) {
        throw new Error(
            'Expected encounter loaded event',
        );
    }

    const state =
        getMutableEncounterStateForTest(engine);

    const actor =
        state.actors[0];

    if (!actor) {
        throw new Error(
            'Expected enemy combat actor',
        );
    }

    return {
        engine,
        state,

        actor,
    };
}
