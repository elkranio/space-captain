import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    getAssetBucketDefinition,
    resolveAssetBucketPath,
    type AssetBucketDefinition,
} from './asset_registry';

const MAX_PNG_BYTES =
    16 * 1024 * 1024;

const PNG_SIGNATURE =
    Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
    ]);

const ASSET_ID_PATTERN =
    /^[a-z][a-z0-9_]*$/;

type AssetManifestEntry = {
    frameKey: string;
};

type AssetManifest =
    Record<
        string,
        AssetManifestEntry
    >;

export type AssetRecord = {
    id: string;
    frameKey: string;
    rawPath: string;
    previewUrl: string;
};

export class AssetOperationError
    extends Error {
    public constructor(
        message: string,
        public readonly statusCode:
            number,
    ) {
        super(message);
        this.name =
            'AssetOperationError';
    }
}

export async function listAssetRecords(
    repoRoot: string,
    bucketId: string,
): Promise<AssetRecord[]> {
    const bucket =
        requireAssetBucket(
            bucketId,
        );

    const manifest =
        await readAssetManifest(
            repoRoot,
            bucket,
        );

    const records:
        AssetRecord[] = [];

    for (
        const [
            assetId,
            entry,
        ] of Object.entries(
            manifest,
        )
    ) {
        assertAssetId(assetId);

        const expectedFrameKey =
            getFrameKey(
                bucket,
                assetId,
            );

        if (
            entry.frameKey !==
            expectedFrameKey
        ) {
            throw new AssetOperationError(
                (
                    'Asset manifest frameKey mismatch for ' +
                    assetId
                ),
                500,
            );
        }

        const rawPath =
            getRawRelativePath(
                bucket,
                assetId,
            );

        const absolutePath =
            resolveAssetBucketPath(
                repoRoot,
                rawPath,
            );

        try {
            await fs.access(
                absolutePath,
            );
        } catch {
            throw new AssetOperationError(
                (
                    'Asset manifest references a missing PNG: ' +
                    rawPath
                ),
                500,
            );
        }

        records.push({
            id: assetId,
            frameKey:
                entry.frameKey,

            rawPath,

            previewUrl:
                '/__assets/' +
                encodeURIComponent(
                    bucket.id,
                ) +
                '/' +
                encodeURIComponent(
                    assetId,
                ) +
                '/preview',
        });
    }

    records.sort(
        (
            left,
            right,
        ) => {
            return left.id.localeCompare(
                right.id,
            );
        },
    );

    return records;
}

export async function getAssetPreviewPath(
    repoRoot: string,
    bucketId: string,
    assetId: string,
): Promise<string> {
    const bucket =
        requireAssetBucket(
            bucketId,
        );

    assertAssetId(assetId);

    const manifest =
        await readAssetManifest(
            repoRoot,
            bucket,
        );

    if (!manifest[assetId]) {
        throw new AssetOperationError(
            (
                'Unknown asset: ' +
                assetId
            ),
            404,
        );
    }

    const absolutePath =
        getRawAbsolutePath(
            repoRoot,
            bucket,
            assetId,
        );

    try {
        await fs.access(
            absolutePath,
        );
    } catch {
        throw new AssetOperationError(
            (
                'Asset PNG is missing: ' +
                assetId
            ),
            500,
        );
    }

    return absolutePath;
}

export async function createAsset(
    repoRoot: string,
    bucketId: string,
    assetId: string,
    pngData: Buffer,
): Promise<void> {
    const bucket =
        requireAssetBucket(
            bucketId,
        );

    assertAssetId(assetId);
    assertPngData(pngData);

    const manifest =
        await readAssetManifest(
            repoRoot,
            bucket,
        );

    if (manifest[assetId]) {
        throw new AssetOperationError(
            (
                'Asset already exists: ' +
                assetId
            ),
            409,
        );
    }

    const absolutePath =
        getRawAbsolutePath(
            repoRoot,
            bucket,
            assetId,
        );

    if (
        await fileExists(
            absolutePath,
        )
    ) {
        throw new AssetOperationError(
            (
                'Raw PNG already exists without a manifest entry: ' +
                assetId
            ),
            409,
        );
    }

    await fs.mkdir(
        path.dirname(
            absolutePath,
        ),
        {
            recursive: true,
        },
    );

    await writeNewFileAtomically(
        absolutePath,
        pngData,
    );

    const nextManifest = {
        ...manifest,

        [assetId]: {
            frameKey:
                getFrameKey(
                    bucket,
                    assetId,
                ),
        },
    };

    try {
        await writeAssetManifest(
            repoRoot,
            bucket,
            nextManifest,
        );
    } catch (error) {
        await fs
            .rm(
                absolutePath,
                {
                    force: true,
                },
            )
            .catch(
                () => undefined,
            );

        throw error;
    }
}

export async function replaceAsset(
    repoRoot: string,
    bucketId: string,
    assetId: string,
    pngData: Buffer,
): Promise<void> {
    const bucket =
        requireAssetBucket(
            bucketId,
        );

    assertAssetId(assetId);
    assertPngData(pngData);

    const manifest =
        await readAssetManifest(
            repoRoot,
            bucket,
        );

    if (!manifest[assetId]) {
        throw new AssetOperationError(
            (
                'Cannot replace unknown asset: ' +
                assetId
            ),
            404,
        );
    }

    const absolutePath =
        getRawAbsolutePath(
            repoRoot,
            bucket,
            assetId,
        );

    if (
        !(
            await fileExists(
                absolutePath,
            )
        )
    ) {
        throw new AssetOperationError(
            (
                'Cannot replace missing raw PNG: ' +
                assetId
            ),
            500,
        );
    }

    await replaceFileAtomically(
        absolutePath,
        pngData,
    );
}

function requireAssetBucket(
    bucketId: string,
): Readonly<AssetBucketDefinition> {
    const bucket =
        getAssetBucketDefinition(
            bucketId,
        );

    if (!bucket) {
        throw new AssetOperationError(
            (
                'Unknown asset bucket: ' +
                bucketId
            ),
            404,
        );
    }

    return bucket;
}

function assertAssetId(
    assetId: string,
): void {
    if (
        !ASSET_ID_PATTERN.test(
            assetId,
        )
    ) {
        throw new AssetOperationError(
            (
                'Asset id must match ' +
                ASSET_ID_PATTERN.source
            ),
            400,
        );
    }
}

function assertPngData(
    pngData: Buffer,
): void {
    if (
        pngData.length >
        MAX_PNG_BYTES
    ) {
        throw new AssetOperationError(
            'PNG is too large.',
            413,
        );
    }

    if (
        pngData.length <
            PNG_SIGNATURE.length ||
        !pngData
            .subarray(
                0,
                PNG_SIGNATURE.length,
            )
            .equals(
                PNG_SIGNATURE,
            )
    ) {
        throw new AssetOperationError(
            'Uploaded file is not a PNG.',
            400,
        );
    }
}

async function readAssetManifest(
    repoRoot: string,
    bucket: Readonly<AssetBucketDefinition>,
): Promise<AssetManifest> {
    const manifestPath =
        resolveAssetBucketPath(
            repoRoot,
            bucket.manifestPath,
        );

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(
                await fs.readFile(
                    manifestPath,
                    'utf8',
                ),
            ) as unknown;
    } catch (error) {
        throw new AssetOperationError(
            (
                'Failed to read asset manifest: ' +
                getErrorMessage(
                    error,
                )
            ),
            500,
        );
    }

    if (
        typeof parsed !==
            'object' ||
        parsed === null ||
        Array.isArray(parsed)
    ) {
        throw new AssetOperationError(
            'Asset manifest must be an object.',
            500,
        );
    }

    const manifest:
        AssetManifest = {};

    for (
        const [
            assetId,
            value,
        ] of Object.entries(
            parsed,
        )
    ) {
        if (
            typeof value !==
                'object' ||
            value === null ||
            Array.isArray(value)
        ) {
            throw new AssetOperationError(
                (
                    'Invalid asset manifest entry: ' +
                    assetId
                ),
                500,
            );
        }

        const frameKey =
            (
                value as {
                    frameKey?: unknown;
                }
            ).frameKey;

        if (
            typeof frameKey !==
            'string'
        ) {
            throw new AssetOperationError(
                (
                    'Asset manifest entry is missing frameKey: ' +
                    assetId
                ),
                500,
            );
        }

        manifest[assetId] = {
            frameKey,
        };
    }

    return manifest;
}

async function writeAssetManifest(
    repoRoot: string,
    bucket: Readonly<AssetBucketDefinition>,
    manifest: AssetManifest,
): Promise<void> {
    const manifestPath =
        resolveAssetBucketPath(
            repoRoot,
            bucket.manifestPath,
        );

    const sortedManifest =
        Object.fromEntries(
            Object.entries(
                manifest,
            ).sort(
                (
                    [left],
                    [right],
                ) => {
                    return left.localeCompare(
                        right,
                    );
                },
            ),
        );

    const serialized =
        JSON.stringify(
            sortedManifest,
            null,
            4,
        ) + '\n';

    await replaceFileAtomically(
        manifestPath,
        Buffer.from(
            serialized,
            'utf8',
        ),
    );
}

function getFrameKey(
    bucket: Readonly<AssetBucketDefinition>,
    assetId: string,
): string {
    return (
        bucket.atlasPrefix +
        '/' +
        assetId
    );
}

function getRawRelativePath(
    bucket: Readonly<AssetBucketDefinition>,
    assetId: string,
): string {
    return (
        bucket.rawDirectory +
        '/' +
        assetId +
        '.png'
    );
}

function getRawAbsolutePath(
    repoRoot: string,
    bucket: Readonly<AssetBucketDefinition>,
    assetId: string,
): string {
    return resolveAssetBucketPath(
        repoRoot,
        getRawRelativePath(
            bucket,
            assetId,
        ),
    );
}

async function writeNewFileAtomically(
    targetPath: string,
    data: Buffer,
): Promise<void> {
    const tempPath =
        getSiblingTempPath(
            targetPath,
            'new',
        );

    await fs.writeFile(
        tempPath,
        data,
        {
            flag: 'wx',
        },
    );

    try {
        await fs.rename(
            tempPath,
            targetPath,
        );
    } catch (error) {
        await fs
            .rm(
                tempPath,
                {
                    force: true,
                },
            )
            .catch(
                () => undefined,
            );

        throw error;
    }
}

async function replaceFileAtomically(
    targetPath: string,
    data: Buffer,
): Promise<void> {
    const tempPath =
        getSiblingTempPath(
            targetPath,
            'replace',
        );

    const backupPath =
        getSiblingTempPath(
            targetPath,
            'backup',
        );

    await fs.writeFile(
        tempPath,
        data,
        {
            flag: 'wx',
        },
    );

    let backupCreated =
        false;

    try {
        await fs.rename(
            targetPath,
            backupPath,
        );

        backupCreated = true;

        await fs.rename(
            tempPath,
            targetPath,
        );

        await fs.rm(
            backupPath,
            {
                force: true,
            },
        );
    } catch (error) {
        await fs
            .rm(
                tempPath,
                {
                    force: true,
                },
            )
            .catch(
                () => undefined,
            );

        if (backupCreated) {
            await fs
                .rm(
                    targetPath,
                    {
                        force: true,
                    },
                )
                .catch(
                    () => undefined,
                );

            await fs
                .rename(
                    backupPath,
                    targetPath,
                )
                .catch(
                    () => undefined,
                );
        }

        throw error;
    }
}

function getSiblingTempPath(
    targetPath: string,
    suffix: string,
): string {
    return (
        targetPath +
        '.' +
        process.pid +
        '.' +
        Date.now() +
        '.' +
        suffix +
        '.tmp'
    );
}

async function fileExists(
    filePath: string,
): Promise<boolean> {
    try {
        await fs.access(
            filePath,
        );

        return true;
    } catch {
        return false;
    }
}

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : String(error);
}
