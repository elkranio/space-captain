import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    CONTENT_COLLECTION_ID,
    getContentCollectionJsonSchema,
} from '../../tools/content-editor/server/content_registry';

type ReferenceFieldSchema = {
    type?:
        string |
        string[];

    anyOf?: Array<{
        type?: string;
    }>;

    'x-editor-content-reference'?:
        string[];
};

type RecordSchema = {
    properties?: Record<
        string,
        ReferenceFieldSchema
    >;
};

describe(
    'Content editor content-reference fields',
    () => {
        it(
            'exposes Debug Start hardware references through generic schema metadata',
            () => {
                const schema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                    ) as {
                        properties?: Record<
                            string,
                            RecordSchema
                        >;
                    };

                const player =
                    schema.properties
                        ?.player
                        ?.properties;

                const enemy =
                    schema.properties
                        ?.enemy
                        ?.properties;

                expect(
                    player
                        ?.driveId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_DRIVES,
                ]);

                expect(
                    player
                        ?.powerCoreId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .POWER_CORES,
                ]);

                expect(
                    player
                        ?.shieldGeneratorId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIELD_GENERATORS,
                ]);

                expect(
                    player
                        ?.defenseTurretId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .DEFENSE_TURRETS,
                ]);

                expect(
                    enemy
                        ?.chassisId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_CHASSIS,
                ]);

                expect(
                    enemy
                        ?.driveId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_DRIVES,
                ]);

                const weaponSources = [
                    CONTENT_COLLECTION_ID
                        .MISSILE_LAUNCHERS,
                    CONTENT_COLLECTION_ID
                        .BEAM_CANNONS,
                    CONTENT_COLLECTION_ID
                        .SPAM_PROJECTORS,
                    CONTENT_COLLECTION_ID
                        .STICKY_MINE_DISPENSERS,
                ];

                for (
                    const fieldName of [
                        'weaponSlot1Id',
                        'weaponSlot2Id',
                        'weaponSlot3Id',
                        'weaponSlot4Id',
                    ]
                ) {
                    expect(
                        player
                            ?.[fieldName]
                            ?.[
                                'x-editor-content-reference'
                            ],
                    ).toEqual(
                        weaponSources,
                    );

                    expect(
                        enemy
                            ?.[fieldName]
                            ?.[
                                'x-editor-content-reference'
                            ],
                    ).toEqual(
                        weaponSources,
                    );
                }
            },
        );

        it(
            'keeps optional enemy references nullable for the None option',
            () => {
                const schema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                    ) as {
                        properties?: Record<
                            string,
                            RecordSchema
                        >;
                    };

                const optional =
                    schema.properties
                        ?.enemy
                        ?.properties
                        ?.weaponSlot2Id;

                const types =
                    Array.isArray(
                        optional?.type,
                    )
                        ? optional.type
                        : optional
                            ?.anyOf
                            ?.map(
                                (variant) =>
                                    variant.type,
                            );

                expect(types).toEqual(
                    expect.arrayContaining([
                        'string',
                        'null',
                    ]),
                );
            },
        );
    },
);
