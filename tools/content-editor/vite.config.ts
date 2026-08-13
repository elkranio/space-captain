import path from 'node:path';
import {
    defineConfig,
    type Plugin,
} from 'vite';
import {
    handleAssetRequest,
} from './server/asset_api';
import {
    handleContentRequest,
} from './server/content_api';

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

        build: {
            rollupOptions: {
                input: {
                    content:
                        path.join(
                            editorRoot,
                            'index.html',
                        ),

                    assets:
                        path.join(
                            editorRoot,
                            'assets.html',
                        ),
                },
            },
        },

        plugins: [
            createEditorApiPlugin(
                repoRoot,
            ),
        ],
    };
});

function createEditorApiPlugin(
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
                        request.url
                            ?.startsWith(
                                '/__assets/',
                            )
                    ) {
                        void handleAssetRequest(
                            repoRoot,
                            request,
                            response,
                        ).catch((error) => {
                            sendServerError(
                                response,
                                error,
                            );
                        });

                        return;
                    }

                    if (
                        request.url
                            ?.startsWith(
                                '/__content/',
                            )
                    ) {
                        void handleContentRequest(
                            repoRoot,
                            request,
                            response,
                        ).catch((error) => {
                            sendServerError(
                                response,
                                error,
                            );
                        });

                        return;
                    }

                    next();
                },
            );
        },
    };
}

function sendServerError(
    response: import('node:http')
        .ServerResponse,
    error: unknown,
): void {
    response.statusCode = 500;

    response.setHeader(
        'Content-Type',
        'application/json; charset=utf-8',
    );

    response.end(
        JSON.stringify({
            error:
                error instanceof Error
                    ? error.message
                    : String(error),
        }),
    );
}
