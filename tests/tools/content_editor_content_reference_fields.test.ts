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

    const?: string;

    items?: {
        oneOf?: RecordSchema[];
    };
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
            'exposes Debug Start chassis and equipment references through schema metadata',
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
                        ?.equipment
                        ?.type,
                ).toBe('array');
            },
        );

        it(
            'exposes Power Core equipment references through the discriminated equipment schema',
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

                const equipmentVariants =
                    schema.properties
                        ?.player
                        ?.properties
                        ?.equipment
                        ?.items
                        ?.oneOf;

                const powerCoreVariant =
                    equipmentVariants
                        ?.find((variant) => {
                            return (
                                variant
                                    .properties
                                    ?.type
                                    ?.const ===
                                'power_core'
                            );
                        });

                expect(
                    powerCoreVariant
                        ?.properties
                        ?.equipmentId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .POWER_CORES,
                ]);
            },
        );
    },
);
