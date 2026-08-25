import path from 'node:path';

export const ASSET_BUCKET_ID = {
    SHIP_CHASSIS:
        'ship_chassis',
} as const;

export type AssetBucketId =
    (typeof ASSET_BUCKET_ID)[
        keyof typeof ASSET_BUCKET_ID
    ];

export type AssetBucketDefinition = {
    id: AssetBucketId;
    label: string;

    rawDirectory: string;
    atlasPrefix: string;
    manifestPath: string;

    protectedAssetIds:
        readonly string[];
};

const ASSET_BUCKETS:
    Record<
        AssetBucketId,
        AssetBucketDefinition
    > = {
        [ASSET_BUCKET_ID
            .SHIP_CHASSIS]: {
            id:
                ASSET_BUCKET_ID
                    .SHIP_CHASSIS,

            label:
                'Ship Chassis',

            rawDirectory:
                'assets/raw/images/' +
                'world/ships/chassis',

            atlasPrefix:
                'world/ships/chassis',

            manifestPath:
                'src/app/manifests/' +
                'world/ships/ship_sprites.json',

            // Transitional protection while these ids
            // are still part of compile-time SHIP_SPRITE_ID.
            protectedAssetIds: [
                'generic_00',
                'unknown_00',
            ],
        },
    };

export type AssetBucketSummary = {
    id: AssetBucketId;
    label: string;
};

export function getAssetBucketSummaries():
    AssetBucketSummary[] {
    return Object.values(
        ASSET_BUCKETS,
    ).map((bucket) => {
        return {
            id: bucket.id,
            label: bucket.label,
        };
    });
}

export function getAssetBucketDefinition(
    id: string,
): Readonly<AssetBucketDefinition> | undefined {
    if (
        !Object.prototype
            .hasOwnProperty.call(
                ASSET_BUCKETS,
                id,
            )
    ) {
        return undefined;
    }

    return ASSET_BUCKETS[
        id as AssetBucketId
    ];
}

export function resolveAssetBucketPath(
    repoRoot: string,
    relativePath: string,
): string {
    return path.join(
        repoRoot,
        ...relativePath.split('/'),
    );
}
