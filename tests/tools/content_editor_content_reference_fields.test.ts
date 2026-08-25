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
            'exposes scalar Debug Start references through generic schema metadata',
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
                        ?.chassisId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_CHASSIS,
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
                        ?.equipment
                        ?.type,
                ).toBe('array');

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
                        ?.powerCoreId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .POWER_CORES,
                ]);

                expect(
                    enemy
                        ?.equipment
                        ?.type,
                ).toBe('array');
            },
        );

        it(
            'keeps optional enemy Power Core nullable for the None option',
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
                        ?.powerCoreId;

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
