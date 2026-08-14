// tests/app/scenes/game/bridge/player_weapon_status_mapper.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type SpamProjectorState,
} from '../../../../../src/engine/defs/ship_weapon';
import {
    createPlayerWeaponPresentationSnapshot,
} from '../../../../../src/engine/encounter/snapshots/combat_presentation_snapshot';
import {
    mapPlayerWeaponsToBridgeStatusPayload,
} from '../../../../../src/app/scenes/game/bridge/controller/player_weapon_status/BridgePlayerWeaponStatusMapper';

describe(
    'Bridge player weapon status mapper',
    () => {
        it(
            'maps active spam projector channel time',
            () => {
                const definition =
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .SPAM_PROJECTOR_00
                    ];

                if (
                    definition.kind !==
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR
                ) {
                    throw new Error(
                        'Expected spam projector definition',
                    );
                }

                const elapsedMs = 1250;

                const projector:
                    SpamProjectorState = {
                        id:
                            'player_spam_status_test',

                        weaponId:
                            SHIP_WEAPON_ID
                                .SPAM_PROJECTOR_00,

                        kind:
                            SHIP_WEAPON_KIND
                                .SPAM_PROJECTOR,

                        phase:
                            SHIP_WEAPON_PHASE
                                .CHANNELING,

                        phaseElapsedMs:
                            elapsedMs,

                        activeChannelId:
                            'player_spam:test',
                    };

                expect(
                    mapPlayerWeaponsToBridgeStatusPayload(
                        [
                            createPlayerWeaponPresentationSnapshot(
                                projector,
                            ),
                        ],
                    ),
                ).toEqual([
                    {
                        id:
                            'player_spam_status_test',

                        weaponId:
                            SHIP_WEAPON_ID
                                .SPAM_PROJECTOR_00,

                        kind:
                            SHIP_WEAPON_KIND
                                .SPAM_PROJECTOR,

                        phase:
                            SHIP_WEAPON_PHASE
                                .CHANNELING,

                        initialPhaseMs:
                            definition
                                .channelDurationMs,

                        remainingPhaseMs:
                            definition
                                .channelDurationMs -
                            elapsedMs,
                    },
                ]);
            },
        );
    },
);
