import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    ASSET_BUCKET_ID,
} from './asset_registry';

export type AssetUsage = {
    collection: string;
    recordId: string;
    label: string;
};

export async function findAssetUsages(
    repoRoot: string,
    bucketId: string,
    assetId: string,
): Promise<AssetUsage[]> {
    switch (bucketId) {
        case ASSET_BUCKET_ID
            .SHIP_CHASSIS:
            return findShipChassisUsages(
                repoRoot,
                assetId,
            );

        default:
            return [];
    }
}

async function findShipChassisUsages(
    repoRoot: string,
    assetId: string,
): Promise<AssetUsage[]> {
    const dataPath =
        path.join(
            repoRoot,
            'src',
            'engine',
            'content',
            'data',
            'ship_chassis.json',
        );

    const parsed =
        JSON.parse(
            await fs.readFile(
                dataPath,
                'utf8',
            ),
        ) as unknown;

    if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        throw new Error(
            'ship_chassis.json must contain an object.',
        );
    }

    const usages:
        AssetUsage[] = [];

    for (
        const [
            recordId,
            value,
        ] of Object.entries(
            parsed,
        )
    ) {
        if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value)
        ) {
            throw new Error(
                (
                    'Invalid ship chassis record: ' +
                    recordId
                ),
            );
        }

        const record =
            value as {
                name?: unknown;
                spriteId?: unknown;
            };

        if (
            record.spriteId !==
            assetId
        ) {
            continue;
        }

        usages.push({
            collection:
                'Ship Chassis',

            recordId,

            label:
                typeof record.name ===
                    'string' &&
                record.name.length > 0
                    ? record.name
                    : recordId,
        });
    }

    return usages;
}
