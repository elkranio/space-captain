import {
    promises as fs,
} from 'node:fs';
import type {
    IncomingMessage,
    ServerResponse,
} from 'node:http';
import {
    getAssetBucketDefinition,
    getAssetBucketSummaries,
} from './asset_registry';
import {
    AssetOperationError,
    createAsset,
    getAssetPreviewPath,
    listAssetRecords,
    replaceAsset,
} from './asset_service';

const MAX_REQUEST_BYTES =
    16 * 1024 * 1024;

export async function handleAssetRequest(
    repoRoot: string,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<void> {
    try {
        await handleAssetRequestUnsafe(
            repoRoot,
            request,
            response,
        );
    } catch (error) {
        if (
            error instanceof
            AssetOperationError
        ) {
            sendJson(
                response,
                error.statusCode,
                {
                    error:
                        error.message,
                },
            );

            return;
        }

        throw error;
    }
}

async function handleAssetRequestUnsafe(
    repoRoot: string,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<void> {
    const url =
        new URL(
            request.url ?? '/',
            'http://content-editor.local',
        );

    if (
        request.method === 'GET' &&
        url.pathname ===
            '/__assets/buckets'
    ) {
        sendJson(
            response,
            200,
            {
                buckets:
                    getAssetBucketSummaries(),
            },
        );

        return;
    }

    const previewMatch =
        /^\/__assets\/([^/]+)\/([^/]+)\/preview$/
            .exec(
                url.pathname,
            );

    if (
        request.method === 'GET' &&
        previewMatch
    ) {
        const bucketId =
            decodePart(
                previewMatch[1],
            );

        const assetId =
            decodePart(
                previewMatch[2],
            );

        const filePath =
            await getAssetPreviewPath(
                repoRoot,
                bucketId,
                assetId,
            );

        const png =
            await fs.readFile(
                filePath,
            );

        response.statusCode = 200;

        response.setHeader(
            'Content-Type',
            'image/png',
        );

        response.setHeader(
            'Cache-Control',
            'no-store',
        );

        response.end(png);

        return;
    }

    const assetMatch =
        /^\/__assets\/([^/]+)\/([^/]+)$/
            .exec(
                url.pathname,
            );

    if (
        assetMatch &&
        (
            request.method === 'POST' ||
            request.method === 'PUT'
        )
    ) {
        const bucketId =
            decodePart(
                assetMatch[1],
            );

        const assetId =
            decodePart(
                assetMatch[2],
            );

        requireAssetBucket(
            bucketId,
        );

        const contentType =
            request.headers[
                'content-type'
            ];

        if (
            contentType !==
            'image/png'
        ) {
            throw new AssetOperationError(
                (
                    'Asset upload requires Content-Type image/png.'
                ),
                415,
            );
        }

        const pngData =
            await readBinaryBody(
                request,
            );

        if (
            request.method ===
            'POST'
        ) {
            await createAsset(
                repoRoot,
                bucketId,
                assetId,
                pngData,
            );
        } else {
            await replaceAsset(
                repoRoot,
                bucketId,
                assetId,
                pngData,
            );
        }

        sendJson(
            response,
            200,
            {
                assets:
                    await listAssetRecords(
                        repoRoot,
                        bucketId,
                    ),
            },
        );

        return;
    }

    const bucketMatch =
        /^\/__assets\/([^/]+)$/
            .exec(
                url.pathname,
            );

    if (
        request.method === 'GET' &&
        bucketMatch
    ) {
        const bucketId =
            decodePart(
                bucketMatch[1],
            );

        const bucket =
            requireAssetBucket(
                bucketId,
            );

        sendJson(
            response,
            200,
            {
                id: bucket.id,
                label:
                    bucket.label,

                assets:
                    await listAssetRecords(
                        repoRoot,
                        bucket.id,
                    ),
            },
        );

        return;
    }

    sendJson(
        response,
        404,
        {
            error:
                'Unknown asset endpoint',
        },
    );
}

function requireAssetBucket(
    bucketId: string,
) {
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

async function readBinaryBody(
    request: IncomingMessage,
): Promise<Buffer> {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    for await (
        const chunk of request
    ) {
        const buffer =
            Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk);

        totalBytes +=
            buffer.length;

        if (
            totalBytes >
            MAX_REQUEST_BYTES
        ) {
            throw new AssetOperationError(
                'Asset upload is too large.',
                413,
            );
        }

        chunks.push(buffer);
    }

    return Buffer.concat(
        chunks,
    );
}

function decodePart(
    value: string | undefined,
): string {
    if (!value) {
        throw new AssetOperationError(
            'Missing asset path segment.',
            400,
        );
    }

    try {
        return decodeURIComponent(
            value,
        );
    } catch {
        throw new AssetOperationError(
            'Invalid encoded asset path.',
            400,
        );
    }
}

function sendJson(
    response: ServerResponse,
    statusCode: number,
    payload: unknown,
): void {
    response.statusCode =
        statusCode;

    response.setHeader(
        'Content-Type',
        'application/json; charset=utf-8',
    );

    response.end(
        JSON.stringify(
            payload,
        ),
    );
}
