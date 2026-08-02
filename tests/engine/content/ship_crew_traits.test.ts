// tests/engine/content/ship_crew_traits.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    CREW_TRAIT_ID,
    CREW_TRAIT_POLARITY,
    CREW_TRAITS,
} from '../../../src/engine/defs/crew_trait';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    SHIP_CREW_PRESET_ID,
    SHIP_CREW_PRESETS,
} from '../../../src/engine/content/presets/ship_crews';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe(
    'ship crew traits',
    () => {
        it(
            'keeps trait polarity in the shared catalog',
            () => {
                expect(
                    CREW_TRAITS[
                        CREW_TRAIT_ID
                            .VETERAN
                    ].polarity,
                ).toBe(
                    CREW_TRAIT_POLARITY
                        .POSITIVE,
                );

                expect(
                    CREW_TRAITS[
                        CREW_TRAIT_ID
                            .HUNGOVER
                    ].polarity,
                ).toBe(
                    CREW_TRAIT_POLARITY
                        .NEGATIVE,
                );
            },
        );

        it(
            'creates independent trait arrays for every crew role',
            () => {
                const actor =
                    ShipNodeActorFactory
                        .create({
                            id:
                                'enemy_crew_traits_00',

                            presetId:
                                SHIP_NODE_ACTOR_PRESET_ID
                                    .ENEMY_COMBAT_00,

                            anchorId:
                                'anchor_00',
                        });

                expect(
                    actor.crewTraitsByRole,
                ).toEqual({
                    [OFFICER_ROLE.COMMS]:
                        [],
                    [OFFICER_ROLE.SCIENCE]:
                        [],
                    [OFFICER_ROLE.HELM]:
                        [],
                    [OFFICER_ROLE.WEAPONS]:
                        [],
                    [OFFICER_ROLE.ENGINEER]:
                        [],
                });

                const scienceTraits =
                    actor
                        .crewTraitsByRole[
                            OFFICER_ROLE
                                .SCIENCE
                        ];

                if (!scienceTraits) {
                    throw new Error(
                        'Science traits are missing',
                    );
                }

                scienceTraits.push(
                    CREW_TRAIT_ID.HUNGOVER,
                );

                expect(
                    SHIP_CREW_PRESETS[
                        SHIP_CREW_PRESET_ID
                            .STANDARD_00
                    ].traitsByRole,
                ).toEqual({});
            },
        );
    },
);
