import {
    describe,
    expect,
    it,
} from 'vitest';
import officerTaskData from '../../src/engine/content/data/officer_tasks.json';
import {
    CONTENT_COLLECTION_ID,
    getContentCollectionDefinition,
    getContentCollectionJsonSchema,
    getContentCollectionSummaries,
    validateContentCollection,
} from '../../tools/content-editor/server/content_registry';

describe(
    'Content editor registry',
    () => {
        it(
            'exposes only the fixed Officer Tasks collection',
            () => {
                expect(
                    getContentCollectionSummaries(),
                ).toEqual([
                    {
                        id:
                            CONTENT_COLLECTION_ID
                                .OFFICER_TASKS,

                        label:
                            'Officer Tasks',

                        canAdd: false,
                        canDelete: false,
                    },
                ]);

                expect(
                    getContentCollectionDefinition(
                        'not_a_collection',
                    ),
                ).toBeUndefined();
            },
        );

        it(
            'validates current officer-task data through the shared runtime schema',
            () => {
                expect(
                    validateContentCollection(
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS,

                        officerTaskData,
                    ),
                ).toEqual(
                    officerTaskData,
                );
            },
        );

        it(
            'generates editor fields from the same schema',
            () => {
                const schema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .OFFICER_TASKS,
                    ) as {
                        properties?: Record<
                            string,
                            {
                                properties?: Record<
                                    string,
                                    unknown
                                >;
                            }
                        >;
                    };

                const timed =
                    schema.properties
                        ?.science_identify_threat
                        ?.properties;

                const external =
                    schema.properties
                        ?.helm_fly_to
                        ?.properties;

                expect(
                    timed,
                ).toHaveProperty(
                    'durationMs',
                );

                expect(
                    external,
                ).not.toHaveProperty(
                    'durationMs',
                );
            },
        );
    },
);
