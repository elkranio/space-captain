import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    SHIP_PRESETS,
} from '../../../src/engine/content/presets/ships';
import {
    CONTENT_COLLECTION_ID,
} from './content_registry';

type ShipChassisDraft = {
    name: string;
    spriteId: string;
    maxHull: number;
};

type ShipChassisDraftCollection =
    Record<
        string,
        ShipChassisDraft
    >;

export type ContentUsage = {
    collection: string;
    recordId: string;
    label: string;
};

export type ContentRecordDeleteInfo = {
    usages: ContentUsage[];
};

export class ContentReferenceError
    extends Error {
    public constructor(
        message: string,
        public readonly statusCode:
            number,
    ) {
        super(message);

        this.name =
            'ContentReferenceError';
    }
}

export function getContentRecordDeleteInfo(
    collectionId: string,
    recordId: string,
): ContentRecordDeleteInfo {
    switch (collectionId) {
        case CONTENT_COLLECTION_ID
            .SHIP_CHASSIS:
            return {
                usages:
                    findShipChassisUsages(
                        recordId,
                    ),
            };

        default:
            return {
                usages: [],
            };
    }
}

export async function validateContentCollectionReferences(
    repoRoot: string,
    collectionId: string,
    data: unknown,
): Promise<void> {
    switch (collectionId) {
        case CONTENT_COLLECTION_ID
            .SHIP_CHASSIS:
            await validateShipChassisReferences(
                repoRoot,
                data as
                    ShipChassisDraftCollection,
            );

            return;

        default:
            return;
    }
}

function findShipChassisUsages(
    chassisId: string,
): ContentUsage[] {
    return Object.values(
        SHIP_PRESETS,
    )
        .filter((preset) => {
            return (
                preset.chassisId ===
                chassisId
            );
        })
        .map((preset) => {
            return {
                collection:
                    'Ship Presets',

                recordId:
                    preset.id,

                label:
                    preset.id,
            };
        });
}

async function validateShipChassisReferences(
    repoRoot: string,
    data: ShipChassisDraftCollection,
): Promise<void> {
    const spriteIds =
        await readShipChassisSpriteIds(
            repoRoot,
        );

    for (
        const [
            chassisId,
            chassis,
        ] of Object.entries(
            data,
        )
    ) {
        if (
            !spriteIds.has(
                chassis.spriteId,
            )
        ) {
            throw new ContentReferenceError(
                (
                    'Ship chassis "' +
                    chassisId +
                    '" references missing sprite "' +
                    chassis.spriteId +
                    '".'
                ),
                400,
            );
        }
    }

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        if (
            data[
                preset.chassisId
            ]
        ) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove ship chassis "' +
                preset.chassisId +
                '": it is used by ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }
}

async function readShipChassisSpriteIds(
    repoRoot: string,
): Promise<Set<string>> {
    const manifestPath =
        path.join(
            repoRoot,
            'src',
            'app',
            'manifests',
            'ships',
            'ship_sprites.json',
        );

    const parsed =
        JSON.parse(
            await fs.readFile(
                manifestPath,
                'utf8',
            ),
        ) as unknown;

    if (
        typeof parsed !==
            'object' ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        throw new ContentReferenceError(
            (
                'Ship sprite manifest must contain an object.'
            ),
            500,
        );
    }

    return new Set(
        Object.keys(
            parsed,
        ),
    );
}
