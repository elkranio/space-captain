import {
    access,
    mkdtemp,
    mkdir,
    readFile,
    rm,
    writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest';
import {
    rebuildTextureAtlas,
} from '../../tools/content-editor/server/asset_build';
import {
    ASSET_BUCKET_ID,
} from '../../tools/content-editor/server/asset_registry';
import {
    createAsset,
    deleteAsset,
    getAssetDeleteInfo,
} from '../../tools/content-editor/server/asset_service';

const tempRoots:
    string[] = [];

afterEach(
    async () => {
        await Promise.all(
            tempRoots.splice(0)
                .map(
                    async (root) => {
                        await rm(
                            root,
                            {
                                recursive: true,
                                force: true,
                            },
                        );
                    },
                ),
        );
    },
);

describe(
    'Asset delete, usage and atlas rebuild',
    () => {
        it(
            'reports chassis usage and blocks deletion',
            async () => {
                const root =
                    await createTempRepo();

                await createAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'used_ship_00',
                    createPngBytes(),
                );

                await writeChassisData(
                    root,
                    {
                        chassis_test_00: {
                            name:
                                'Test Chassis',
                            spriteId:
                                'used_ship_00',
                            maxHull: 3,
                        },
                    },
                );

                await expect(
                    getAssetDeleteInfo(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                        'used_ship_00',
                    ),
                ).resolves.toEqual({
                    isProtected:
                        false,

                    usages: [
                        {
                            collection:
                                'Ship Chassis',

                            recordId:
                                'chassis_test_00',

                            label:
                                'Test Chassis',
                        },
                    ],
                });

                await expect(
                    deleteAsset(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                        'used_ship_00',
                    ),
                ).rejects.toMatchObject({
                    statusCode: 409,
                });
            },
        );

        it(
            'deletes an unused asset from PNG storage and manifest',
            async () => {
                const root =
                    await createTempRepo();

                await createAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'unused_ship_00',
                    createPngBytes(),
                );

                await deleteAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'unused_ship_00',
                );

                await expect(
                    access(
                        path.join(
                            root,
                            'assets/raw/images/world/ships/chassis/unused_ship_00.png',
                        ),
                    ),
                ).rejects.toBeDefined();

                expect(
                    JSON.parse(
                        await readFile(
                            path.join(
                                root,
                                'src/app/manifests/world/ships/ship_sprites.json',
                            ),
                            'utf8',
                        ),
                    ),
                ).toEqual({});
            },
        );

        it(
            'protects built-in sprite ids during the static-id transition',
            async () => {
                const root =
                    await createTempRepo();

                await createAsset(
                    root,
                    ASSET_BUCKET_ID
                        .SHIP_CHASSIS,
                    'generic_00',
                    createPngBytes(),
                );

                await expect(
                    getAssetDeleteInfo(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                        'generic_00',
                    ),
                ).resolves.toMatchObject({
                    isProtected:
                        true,
                });

                await expect(
                    deleteAsset(
                        root,
                        ASSET_BUCKET_ID
                            .SHIP_CHASSIS,
                        'generic_00',
                    ),
                ).rejects.toMatchObject({
                    statusCode: 409,
                });
            },
        );

        it(
            'reports atlas rebuild success and failure',
            async () => {
                await expect(
                    rebuildTextureAtlas(
                        'test-root',
                        async (
                            repoRoot,
                        ) => {
                            expect(
                                repoRoot,
                            ).toBe(
                                'test-root',
                            );

                            return {
                                exitCode: 0,
                                output:
                                    'packed',
                            };
                        },
                    ),
                ).resolves.toBe(
                    'packed',
                );

                await expect(
                    rebuildTextureAtlas(
                        'test-root',
                        async () => {
                            return {
                                exitCode: 2,
                                output:
                                    'texture packer boom',
                            };
                        },
                    ),
                ).rejects.toThrow(
                    'texture packer boom',
                );
            },
        );
    },
);

async function createTempRepo():
    Promise<string> {
    const root =
        await mkdtemp(
            path.join(
                os.tmpdir(),
                'space-captain-delete-',
            ),
        );

    tempRoots.push(root);

    await mkdir(
        path.join(
            root,
            'src/app/manifests/world/ships',
        ),
        {
            recursive: true,
        },
    );

    await mkdir(
        path.join(
            root,
            'src/engine/content/data',
        ),
        {
            recursive: true,
        },
    );

    await mkdir(
        path.join(
            root,
            'assets/raw/images/world/ships/chassis',
        ),
        {
            recursive: true,
        },
    );

    await writeFile(
        path.join(
            root,
            'src/app/manifests/world/ships/ship_sprites.json',
        ),
        '{}\n',
        'utf8',
    );

    await writeChassisData(
        root,
        {},
    );

    return root;
}

async function writeChassisData(
    root: string,
    data: unknown,
): Promise<void> {
    await writeFile(
        path.join(
            root,
            'src/engine/content/data/ship_chassis.json',
        ),
        (
            JSON.stringify(
                data,
                null,
                4,
            ) +
            '\n'
        ),
        'utf8',
    );
}

function createPngBytes():
    Buffer {
    return Buffer.from([
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        1,
    ]);
}
