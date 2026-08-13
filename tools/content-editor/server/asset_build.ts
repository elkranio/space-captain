import {
    spawn,
} from 'node:child_process';

const MAX_CAPTURED_OUTPUT_CHARS =
    64000;

export type AtlasBuildCommandResult = {
    exitCode: number;
    output: string;
};

export type AtlasBuildCommandRunner =
    (
        repoRoot: string,
    ) => Promise<AtlasBuildCommandResult>;

let atlasBuildInProgress =
    false;

export async function rebuildTextureAtlas(
    repoRoot: string,
    runner:
        AtlasBuildCommandRunner =
        runTexturePackCommand,
): Promise<string> {
    if (atlasBuildInProgress) {
        throw new Error(
            'Texture atlas rebuild is already in progress.',
        );
    }

    atlasBuildInProgress =
        true;

    try {
        const result =
            await runner(
                repoRoot,
            );

        if (
            result.exitCode !== 0
        ) {
            const output =
                result.output
                    .trim()
                    .slice(-4000);

            throw new Error(
                (
                    'Texture atlas rebuild failed with exit code ' +
                    result.exitCode +
                    (
                        output
                            ? ':\n' +
                              output
                            : '.'
                    )
                ),
            );
        }

        return result.output.trim();
    } finally {
        atlasBuildInProgress =
            false;
    }
}

function runTexturePackCommand(
    repoRoot: string,
): Promise<AtlasBuildCommandResult> {
    const isWindows =
        process.platform ===
        'win32';

    const command =
        isWindows
            ? (
                process.env
                    .ComSpec ||
                'C:\\Windows\\System32\\cmd.exe'
            )
            : 'npm';

    const args =
        isWindows
            ? [
                '/d',
                '/s',
                '/c',
                'npm.cmd run pack:tex',
            ]
            : [
                'run',
                'pack:tex',
            ];

    return new Promise(
        (
            resolve,
            reject,
        ) => {
            const child =
                spawn(
                    command,
                    args,
                    {
                        cwd: repoRoot,
                        env:
                            process.env,
                        windowsHide:
                            true,
                    },
                );

            let output = '';
            let settled = false;

            const appendOutput =
                (
                    chunk:
                        Buffer |
                        string,
                ): void => {
                    output +=
                        chunk.toString();

                    if (
                        output.length >
                        MAX_CAPTURED_OUTPUT_CHARS
                    ) {
                        output =
                            output.slice(
                                -MAX_CAPTURED_OUTPUT_CHARS,
                            );
                    }
                };

            child.stdout.on(
                'data',
                appendOutput,
            );

            child.stderr.on(
                'data',
                appendOutput,
            );

            child.on(
                'error',
                (error) => {
                    if (settled) {
                        return;
                    }

                    settled = true;
                    reject(error);
                },
            );

            child.on(
                'close',
                (exitCode) => {
                    if (settled) {
                        return;
                    }

                    settled = true;

                    resolve({
                        exitCode:
                            exitCode ??
                            1,

                        output,
                    });
                },
            );
        },
    );
}
