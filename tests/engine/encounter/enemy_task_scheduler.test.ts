// tests/engine/encounter/enemy_task_scheduler.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
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
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
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

describe('Enemy task scheduler', () => {
    it('starts one weapons task and one science task in parallel', () => {
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
                sourceWeaponId: 'laser_00',
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

            weaponId: 'laser_00',
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

    it('does not schedule a weapon task for a missing crew role', () => {
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
        playerHull: createPlayerHullFixture(),

        node,

        navigation: {
            kind:
                PLAYER_SPACE_NAVIGATION_KIND
                    .ANCHORED,

            anchorId: stationId,
        },

        drive: createShipDriveFixture(),

        pointDefense:
            createPointDefenseFixture(),

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

    const actor =
        loadedEvent.state.actors[0];

    if (!actor) {
        throw new Error(
            'Expected enemy combat actor',
        );
    }

    return {
        engine,
        actor,
    };
}
