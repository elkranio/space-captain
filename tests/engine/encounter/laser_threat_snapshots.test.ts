// tests/engine/encounter/laser_threat_snapshots.test.ts

import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { LASER_TARGET_ZONE } from '../../../src/engine/defs/laser';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
} from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('EncounterEngine laser threat snapshots', () => {
    it('derives countdown from the charging weapon and exposes identification updates', () => {
        const { engine, chargeDurationMs } = createLaserEngine();

        engine.step(SHIP_WEAPON_TARGETING_DURATION_MS);
        engine.drainEvents();

        expect(engine.getLaserThreatSnapshots()).toEqual([
            {
                attack: createExpectedAttack({
                    status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
                }),

                timeToFireMs: chargeDurationMs,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);

        engine.step(1234);
        engine.drainEvents();

        expect(engine.getLaserThreatSnapshots()).toEqual([
            {
                attack: createExpectedAttack({
                    status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
                }),

                timeToFireMs: chargeDurationMs - 1234,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.SCIENCE,

                commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                    threatId: 'laser_attack_1',
                },
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getLaserThreatSnapshots()).toEqual([
            {
                attack: createExpectedAttack({
                    status: THREAT_IDENTIFICATION_STATUS.IDENTIFIED,

                    targetZone: LASER_TARGET_ZONE.CENTER,
                }),

                timeToFireMs: chargeDurationMs - 1234,
                initialTimeToFireMs: chargeDurationMs,
            },
        ]);
    });
});

function createLaserEngine() {
    const { node, stationId } = createSingleStationNodeFixture();

    const enemy = ShipNodeActorFactory.create({
        id: 'ship_enemy_00',

        presetId: SHIP_NODE_ACTOR_PRESET_ID.ENEMY_GENERIC_LASER_00,

        anchorId: stationId,
    });

    node.actors.push(enemy);

    const engine = new EncounterEngine({
        drive: createShipDriveFixture(),
        node,

        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: stationId,
        },

        pointDefense: createPointDefenseFixture(),

        completeTimedTasksImmediately: true,

        random: () => {
            return 0.5;
        },
    });

    const [loadedEvent] = engine.drainEvents();

    if (loadedEvent.type !== ENCOUNTER_EVENT.ENCOUNTER_LOADED) {
        throw new Error(
            `Expected encounter loaded event, received: ${loadedEvent.type}`,
        );
    }

    const laser = loadedEvent.state.actors[0].weapons[0];

    if (laser.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected loaded enemy laser');
    }

    const definition = SHIP_WEAPONS[laser.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error('Expected laser definition');
    }

    return {
        engine,

        chargeDurationMs: definition.chargeDurationMs,
    };
}

function createExpectedAttack(
    identification:
        | {
              status: typeof THREAT_IDENTIFICATION_STATUS.UNKNOWN;
          }
        | {
              status: typeof THREAT_IDENTIFICATION_STATUS.IDENTIFIED;

              targetZone: typeof LASER_TARGET_ZONE.CENTER;
          },
) {
    return {
        id: 'laser_attack_1',
        designation: 'L1',

        sourceActorId: 'ship_enemy_00',
        sourceWeaponId: 'laser_00',

        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },

        targetZone: LASER_TARGET_ZONE.CENTER,

        identification,
    };
}
