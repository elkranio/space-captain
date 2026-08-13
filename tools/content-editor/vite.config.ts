import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import type {
    IncomingMessage,
    ServerResponse,
} from 'node:http';
import {
    defineConfig,
    type Plugin,
} from 'vite';
import {
    getContentCollectionDefinition,
    getContentCollectionJsonSchema,
    getContentCollectionSummaries,
    validateContentCollection,
} from './server/content_registry';

const MAX_BODY_BYTES =
    1024 * 1024;

export default defineConfig(() => {
    const repoRoot =
        process.cwd();

    const editorRoot =
        path.join(
            repoRoot,
            'tools',
            'content-editor',
        );

    return {
        root: editorRoot,

        plugins: [
            createContentApiPlugin(
                repoRoot,
            ),
        ],
    };
});

function createContentApiPlugin(
    repoRoot: string,
): Plugin {
    return {
        name:
            'space-captain-content-api',

        configureServer(server) {
            server.middlewares.use(
                (
                    request,
                    response,
                    next,
                ) => {
                    if (
                        !request.url
                            ?.startsWith(
                                '/__content/',
                            )
                    ) {
                        next();

                        return;
                    }

                    void handleContentRequest(
                        repoRoot,
                        request,
                        response,
                    ).catch((error) => {
                        sendJson(
                            response,
                            500,
                            {
                                error:
                                    getErrorMessage(
                                        error,
                                    ),
                            },
                        );
                    });
                },
            );
        },
    };
}

async function handleContentRequest(
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
            '/__content/collections'
    ) {
        sendJson(
            response,
            200,
            {
                collections:
                    getContentCollectionSummaries(),
            },
        );

        return;
    }

    const collectionId =
        getCollectionId(
            url.pathname,
        );

    if (!collectionId) {
        sendJson(
            response,
            404,
            {
                error:
                    'Unknown content endpoint',
            },
        );

        return;
    }

    const definition =
        getContentCollectionDefinition(
            collectionId,
        );

    if (!definition) {
        sendJson(
            response,
            404,
            {
                error:
                    'Unknown content collection: ' +
                    collectionId,
            },
        );

        return;
    }

    const dataPath =
        path.join(
            repoRoot,
            ...definition
                .dataPath
                .split('/'),
        );

    if (request.method === 'GET') {
        const raw =
            await fs.readFile(
                dataPath,
                'utf8',
            );

        const data =
            validateContentCollection(
                collectionId,
                JSON.parse(raw),
            );

        sendJson(
            response,
            200,
            {
                id: definition.id,
                label:
                    definition.label,
                data,
                schema:
                    getContentCollectionJsonSchema(
                        collectionId,
                    ),
            },
        );

        return;
    }

    if (request.method === 'POST') {
        let body: unknown;

        try {
            body =
                await readJsonBody(
                    request,
                );
        } catch (error) {
            sendJson(
                response,
                400,
                {
                    error:
                        getErrorMessage(
                            error,
                        ),
                },
            );

            return;
        }

        let data: unknown;

        try {
            data =
                validateContentCollection(
                    collectionId,
                    body,
                );
        } catch (error) {
            if (
                isZodError(error)
            ) {
                sendJson(
                    response,
                    400,
                    {
                        error:
                            'Content validation failed',
                        issues:
                            error.issues,
                    },
                );

                return;
            }

            throw error;
        }

        await writeJsonAtomically(
            dataPath,
            data,
        );

        sendJson(
            response,
            200,
            {
                data,
            },
        );

        return;
    }

    response.setHeader(
        'Allow',
        'GET, POST',
    );

    sendJson(
        response,
        405,
        {
            error:
                'Method not allowed',
        },
    );
}

function getCollectionId(
    pathname: string,
): string | undefined {
    const match =
        /^\/__content\/([^/]+)$/
            .exec(pathname);

    return match?.[1];
}

async function readJsonBody(
    request: IncomingMessage,
): Promise<unknown> {
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
            MAX_BODY_BYTES
        ) {
            throw new Error(
                'Content request is too large',
            );
        }

        chunks.push(buffer);
    }

    const text =
        Buffer.concat(
            chunks,
        ).toString('utf8');

    return JSON.parse(text);
}

async function writeJsonAtomically(
    dataPath: string,
    data: unknown,
): Promise<void> {
    const tempPath =
        dataPath +
        '.' +
        process.pid +
        '.tmp';

    const serialized =
        JSON.stringify(
            data,
            null,
            4,
        ) + '\n';

    await fs.writeFile(
        tempPath,
        serialized,
        'utf8',
    );

    try {
        await fs.rename(
            tempPath,
            dataPath,
        );
    } catch (error) {
        await fs
            .unlink(tempPath)
            .catch(() => undefined);

        throw error;
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

function isZodError(
    value: unknown,
): value is {
    issues: unknown[];
} {
    return (
        typeof value === 'object' &&
        value !== null &&
        Array.isArray(
            (
                value as {
                    issues?: unknown;
                }
            ).issues,
        )
    );
}

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : String(error);
}
