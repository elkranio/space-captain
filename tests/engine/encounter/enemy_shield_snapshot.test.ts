// tests/engine/encounter/enemy_shield_snapshot.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_SHIELD_DURATION_MS,
} from '../../../src/engine/content/rules/shields';
import {
    LASER_TARGET_ZONE,
} from '../../../src/engine/defs/laser';
import {
    createAnchoredPlayerCombatTestSetup,
} from './combat_test_support';

describe(
    'Enemy shield snapshot',
    () => {
        it(
            'exposes only the active field at the current anchor',
            () => {
                const {
                    engine,
                    targetActor,
                } =
                    createAnchoredPlayerCombatTestSetup();

                expect(
                    engine
                        .getEnemyShieldSnapshots(),
                ).toEqual([]);

                targetActor.activeShield = {
                    zone:
                        LASER_TARGET_ZONE.RIGHT,

                    elapsedMs: 1250,

                    durationMs:
                        SHIP_SHIELD_DURATION_MS,
                };

                expect(
                    engine
                        .getEnemyShieldSnapshots(),
                ).toEqual([
                    {
                        actorId:
                            targetActor.id,

                        zone:
                            LASER_TARGET_ZONE.RIGHT,

                        elapsedMs: 1250,

                        durationMs:
                            SHIP_SHIELD_DURATION_MS,
                    },
                ]);

                delete targetActor
                    .activeShield;

                expect(
                    engine
                        .getEnemyShieldSnapshots(),
                ).toEqual([]);
            },
        );
    },
);
