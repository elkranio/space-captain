// tests/engine/encounter/enemy_decision_policy.test.ts

import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import EnemyDecisionPolicy from '../../../src/engine/encounter/combat/enemy/EnemyDecisionPolicy';
import {
    ENCOUNTER_EVENT,
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
    createPointDefenseFixture,
} from '../../fixtures/engine/point_defense_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';

describe('Enemy decision policy', () => {
    it('rotates weapon work in loadout order and skips unavailable weapons', () => {
        const actor = createEnemyCombatActor();
        const policy =
            new EnemyDecisionPolicy();

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.WEAPONS,

            weaponId:
                'missile_launcher_00',
        });

        getWeapon(
            actor,
            'missile_launcher_00',
        ).phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.WEAPONS,

            weaponId: 'laser_00',
        });

        getWeapon(
            actor,
            'laser_00',
        ).phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.WEAPONS,

            weaponId:
                'sticky_mine_dispenser_00',
        });

        getWeapon(
            actor,
            'sticky_mine_dispenser_00',
        ).phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        getWeapon(
            actor,
            'missile_launcher_00',
        ).phase =
            SHIP_WEAPON_PHASE.READY;

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.WEAPONS,

            weaponId:
                'missile_launcher_00',
        });

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.WEAPONS
                ],
        ).toBe(1);
    });

    it('does not select work for an empty sticky-mine dispenser', () => {
        const actor = createEnemyCombatActor();
        const policy =
            new EnemyDecisionPolicy();

        const missile = actor.weapons[0];
        const laser = actor.weapons[1];
        const mines = actor.weapons[2];

        if (
            !missile ||
            !laser ||
            !mines ||
            mines.kind !==
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Expected combat weapon loadout',
            );
        }

        missile.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        laser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        mines.ammoCount = 0;

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.WEAPONS,
            ),
        ).toBeUndefined();
    });

    it('keeps Science weapon rotation independent from Weapons', () => {
        const actor = createEnemyCombatActor();
        const policy =
            new EnemyDecisionPolicy();

        policy.selectWork(
            actor,
            OFFICER_ROLE.WEAPONS,
        );

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.SCIENCE,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.SCIENCE,

            weaponId:
                'spam_projector_00',
        });

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.WEAPONS
                ],
        ).toBe(1);

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.SCIENCE
                ],
        ).toBe(0);
    });

    it('prioritizes unresolved threat identification over Science weapon work', () => {
        const actor = createEnemyCombatActor();
        const policy =
            new EnemyDecisionPolicy();

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

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.SCIENCE,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .IDENTIFY_THREAT,

            role:
                OFFICER_ROLE.SCIENCE,

            observationId:
                'missile:projectile_00',
        });

        expect(
            actor.decision
                .nextWeaponIndexByRole[
                    OFFICER_ROLE.SCIENCE
                ],
        ).toBeUndefined();

        actor.threatObservations.length = 0;

        expect(
            policy.selectWork(
                actor,
                OFFICER_ROLE.SCIENCE,
            ),
        ).toEqual({
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role:
                OFFICER_ROLE.SCIENCE,

            weaponId:
                'spam_projector_00',
        });
    });
});

function getWeapon(
    actor:
        ReturnType<
            typeof createEnemyCombatActor
        >,
    weaponId: string,
) {
    const weapon =
        actor.weapons.find((candidate) => {
            return candidate.id === weaponId;
        });

    if (!weapon) {
        throw new Error(
            'Expected enemy weapon: ' +
                weaponId,
        );
    }

    return weapon;
}

function createEnemyCombatActor() {
    const {
        node,
        stationId,
    } = createSingleStationNodeFixture();

    node.actors.push(
        ShipNodeActorFactory.create({
            id: 'ship_enemy_combat_00',

            presetId:
                SHIP_NODE_ACTOR_PRESET_ID
                    .ENEMY_COMBAT_00,

            anchorId: stationId,
        }),
    );

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

        pointDefense:
            createPointDefenseFixture(),
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
        getMutableEncounterStateForTest(engine).actors[0];

    if (!actor) {
        throw new Error(
            'Expected enemy combat actor',
        );
    }

    return actor;
}
