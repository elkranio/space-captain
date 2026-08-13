import * as z from 'zod';
import {
    OFFICER_TASK_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/officer_task_tuning';

export const CONTENT_COLLECTION_ID = {
    OFFICER_TASKS:
        'officer_tasks',
} as const;

export type ContentCollectionId =
    (typeof CONTENT_COLLECTION_ID)[
        keyof typeof CONTENT_COLLECTION_ID
    ];

type ContentCollectionDefinition = {
    id: ContentCollectionId;
    label: string;
    dataPath: string;
    schema: z.ZodType;
    canAdd: boolean;
    canDelete: boolean;
};

const CONTENT_COLLECTIONS:
    Record<
        ContentCollectionId,
        ContentCollectionDefinition
    > = {
        [CONTENT_COLLECTION_ID
            .OFFICER_TASKS]: {
            id:
                CONTENT_COLLECTION_ID
                    .OFFICER_TASKS,

            label: 'Officer Tasks',

            dataPath:
                'src/engine/content/data/' +
                'officer_tasks.json',

            schema:
                OFFICER_TASK_TUNING_SCHEMA,

            canAdd: false,
            canDelete: false,
        },
    };

export type ContentCollectionSummary = {
    id: ContentCollectionId;
    label: string;
    canAdd: boolean;
    canDelete: boolean;
};

export function getContentCollectionSummaries():
    ContentCollectionSummary[] {
    return Object.values(
        CONTENT_COLLECTIONS,
    ).map((collection) => {
        return {
            id: collection.id,
            label: collection.label,
            canAdd: collection.canAdd,
            canDelete:
                collection.canDelete,
        };
    });
}

export function getContentCollectionDefinition(
    id: string,
): Readonly<ContentCollectionDefinition> | undefined {
    if (
        !Object.prototype
            .hasOwnProperty.call(
                CONTENT_COLLECTIONS,
                id,
            )
    ) {
        return undefined;
    }

    return CONTENT_COLLECTIONS[
        id as ContentCollectionId
    ];
}

export function validateContentCollection(
    id: string,
    input: unknown,
): unknown {
    const definition =
        getContentCollectionDefinition(
            id,
        );

    if (!definition) {
        throw new Error(
            'Unknown content collection: ' +
            id,
        );
    }

    return definition.schema.parse(
        input,
    );
}

export function getContentCollectionJsonSchema(
    id: string,
): unknown {
    const definition =
        getContentCollectionDefinition(
            id,
        );

    if (!definition) {
        throw new Error(
            'Unknown content collection: ' +
            id,
        );
    }

    return z.toJSONSchema(
        definition.schema,
    );
}
