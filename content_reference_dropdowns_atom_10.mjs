import {
    existsSync,
    readFileSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import path from 'node:path';
import {
    fileURLToPath,
} from 'node:url';
import {
    spawnSync,
} from 'node:child_process';
import ts from 'typescript';

const EXPECTED_HEAD =
    '1fe5ad339397f4f00f6f340b29f8d8e4d54db896';

const FILES = {
    debugStartSchema:
        'src/engine/content/schemas/debug_start.ts',

    editorMain:
        'tools/content-editor/src/main.ts',

    referenceTest:
        'tests/tools/content_editor_content_reference_fields.test.ts',
};

const EXPECTED_BLOBS = {
    [FILES.debugStartSchema]:
        '8367ec79e4955c7eab4ad7343a6414f0e00cea78',

    [FILES.editorMain]:
        'b523728596adec9476ee5c4302342c51209d7d73',
};

const repoRoot =
    process.cwd();

const selfPath =
    fileURLToPath(import.meta.url);

function fail(message) {
    throw new Error(message);
}

function absolute(relativePath) {
    return path.join(
        repoRoot,
        relativePath,
    );
}

function run(
    command,
    args,
) {
    const result =
        spawnSync(
            command,
            args,
            {
                cwd: repoRoot,
                encoding: 'utf8',
                shell: false,
            },
        );

    if (result.status !== 0) {
        fail(
            [
                `Command failed: ${command} ${args.join(' ')}`,
                result.stdout,
                result.stderr,
            ]
                .filter(Boolean)
                .join('\n'),
        );
    }

    return result.stdout;
}

function toLf(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function getEol(text) {
    return text.includes('\r\n')
        ? '\r\n'
        : '\n';
}

function normalizeForWrite(
    text,
    eol,
) {
    return (
        toLf(text)
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n*$/, '') +
        '\n'
    ).replace(
        /\n/g,
        eol,
    );
}

function parseTs(
    fileName,
    text,
) {
    const source =
        ts.createSourceFile(
            fileName,
            text,
            ts.ScriptTarget.Latest,
            true,
            ts.ScriptKind.TS,
        );

    if (
        source.parseDiagnostics.length >
        0
    ) {
        fail(
            [
                `TypeScript parse failed: ${fileName}`,
                ...source
                    .parseDiagnostics
                    .map((diagnostic) => {
                        return ts
                            .flattenDiagnosticMessageText(
                                diagnostic.messageText,
                                '\n',
                            );
                    }),
            ].join('\n'),
        );
    }
}

function replaceOnce(
    text,
    oldText,
    newText,
    label,
) {
    const count =
        text.split(oldText)
            .length - 1;

    if (count !== 1) {
        fail(
            `${label}: expected 1 match, found ${count}.`,
        );
    }

    return text.replace(
        oldText,
        newText,
    );
}

const head =
    run(
        'git',
        [
            'rev-parse',
            'HEAD',
        ],
    ).trim();

if (head !== EXPECTED_HEAD) {
    fail(
        `HEAD mismatch. Expected ${EXPECTED_HEAD}, got ${head}.`,
    );
}

const status =
    run(
        'git',
        [
            'status',
            '--porcelain',
            '--untracked-files=no',
        ],
    );

if (status.trim()) {
    fail(
        [
            'Tracked worktree is not clean.',
            status,
        ].join('\n'),
    );
}

for (
    const [
        relativePath,
        expectedBlob,
    ] of Object.entries(
        EXPECTED_BLOBS,
    )
) {
    const actualBlob =
        run(
            'git',
            [
                'rev-parse',
                `HEAD:${relativePath}`,
            ],
        ).trim();

    if (
        actualBlob !==
        expectedBlob
    ) {
        fail(
            `Blob mismatch for ${relativePath}. ` +
                `Expected ${expectedBlob}, got ${actualBlob}.`,
        );
    }
}

if (
    existsSync(
        absolute(
            FILES.referenceTest,
        ),
    )
) {
    fail(
        `New test already exists: ${FILES.referenceTest}`,
    );
}

const staged =
    new Map();

const eols =
    new Map();

function stageExisting(
    relativePath,
    content,
) {
    const original =
        readFileSync(
            absolute(
                relativePath,
            ),
            'utf8',
        );

    eols.set(
        relativePath,
        getEol(
            original,
        ),
    );

    const normalized =
        toLf(
            content,
        );

    parseTs(
        relativePath,
        normalized,
    );

    staged.set(
        relativePath,
        normalized,
    );
}

function stageNew(
    relativePath,
    content,
) {
    const normalized =
        toLf(
            content,
        );

    parseTs(
        relativePath,
        normalized,
    );

    eols.set(
        relativePath,
        '\n',
    );

    staged.set(
        relativePath,
        normalized,
    );
}

const debugStartSchemaSource =
`// src/engine/content/schemas/debug_start.ts

import * as z from 'zod';

const CONTENT_ID_SCHEMA =
    z.string()
        .min(1);

// Editor-only hints live as schema metadata.
// Runtime validation remains normal content-id validation.
const EDITOR_CONTENT_REFERENCE = {
    CHASSIS: [
        'ship_chassis',
    ],

    DRIVE: [
        'ship_drives',
    ],

    POWER_CORE: [
        'power_cores',
    ],

    SHIELD_GENERATOR: [
        'shield_generators',
    ],

    DEFENSE_TURRET: [
        'defense_turrets',
    ],

    WEAPON: [
        'missile_launchers',
        'beam_cannons',
        'spam_projectors',
        'sticky_mine_dispensers',
    ],
} as const;

const WEAPON_SLOT_META = {
    description:
        'Installed weapon. Runtime installation ids are generated automatically.',

    'x-editor-content-reference':
        EDITOR_CONTENT_REFERENCE
            .WEAPON,
} as const;

export const DEBUG_START_SCHEMA =
    z.strictObject({
        player:
            z.strictObject({
                maxHull:
                    z.number()
                        .int()
                        .positive()
                        .meta({
                            title:
                                'Max Hull',
                        }),

                driveId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Drive',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .DRIVE,
                        }),

                powerCoreId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Power Core',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .POWER_CORE,
                        }),

                shieldGeneratorId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Shield Generator',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .SHIELD_GENERATOR,
                        }),

                defenseTurretId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Defense Turret',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .DEFENSE_TURRET,
                        }),

                weaponSlot1Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 1',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot2Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 2',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot3Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 3',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot4Id:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Weapon Slot 4',

                            ...WEAPON_SLOT_META,
                        }),
            }).meta({
                title:
                    'Player Ship',
            }),

        enemy:
            z.strictObject({
                chassisId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Chassis',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .CHASSIS,
                        }),

                driveId:
                    CONTENT_ID_SCHEMA
                        .meta({
                            title:
                                'Drive',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .DRIVE,
                        }),

                powerCoreId:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Power Core',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .POWER_CORE,
                        }),

                shieldGeneratorId:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Shield Generator',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .SHIELD_GENERATOR,
                        }),

                defenseTurretId:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Defense Turret',

                            'x-editor-content-reference':
                                EDITOR_CONTENT_REFERENCE
                                    .DEFENSE_TURRET,
                        }),

                weaponSlot1Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 1',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot2Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 2',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot3Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 3',

                            ...WEAPON_SLOT_META,
                        }),

                weaponSlot4Id:
                    CONTENT_ID_SCHEMA
                        .nullable()
                        .meta({
                            title:
                                'Weapon Slot 4',

                            ...WEAPON_SLOT_META,
                        }),
            }).meta({
                title:
                    'Enemy Ship',
            }),
    });

export type DebugStartData =
    z.infer<
        typeof DEBUG_START_SCHEMA
    >;
`;

stageExisting(
    FILES.debugStartSchema,
    debugStartSchemaSource,
);

{
    const file =
        FILES.editorMain;

    let text =
        toLf(
            readFileSync(
                absolute(file),
                'utf8',
            ),
        );

    text =
        replaceOnce(
            text,
`    'x-editor-asset-bucket'?:
        string;
};`,
`    'x-editor-asset-bucket'?:
        string;

    'x-editor-content-reference'?:
        string[];
};`,
            'JsonSchema content reference metadata',
        );

    text =
        replaceOnce(
            text,
`let persistedRecordIds =
    new Set<string>();

let dirty = false;`,
`let persistedRecordIds =
    new Set<string>();

const contentReferenceCollectionCache =
    new Map<
        string,
        Promise<ContentCollectionPayload>
    >();

let dirty = false;`,
            'content reference cache',
        );

    text =
        replaceOnce(
            text,
`        dirty = false;

        render();
        setStatus('Saved');`,
`        dirty = false;

        // Another content collection may have gained,
        // lost or renamed a referenced record.
        contentReferenceCollectionCache
            .clear();

        render();
        setStatus('Saved');`,
            'clear reference cache after save',
        );

    text =
        replaceOnce(
            text,
`): HTMLElement {
    if (
        schema[
            'x-editor-asset-bucket'
        ]
    ) {`,
`): HTMLElement {
    const contentReferences =
        schema[
            'x-editor-content-reference'
        ];

    if (
        contentReferences &&
        contentReferences.length > 0
    ) {
        return createContentReferenceField(
            recordId,
            fieldName,
            schema,
            value,
            contentReferences,
        );
    }

    if (
        schema[
            'x-editor-asset-bucket'
        ]
    ) {`,
            'content reference field dispatch',
        );

    const contentReferenceFunctions =
`function createContentReferenceField(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
    sourceCollectionIds: string[],
): HTMLElement {
    const wrapper =
        document.createElement(
            'label',
        );

    wrapper.className =
        'field-row';

    const label =
        document.createElement(
            'span',
        );

    label.className =
        'field-label';

    const labelTitle =
        document.createElement(
            'span',
        );

    labelTitle.className =
        'field-label-title';

    labelTitle.textContent =
        schema.title ??
        fieldName;

    label.appendChild(
        labelTitle,
    );

    if (schema.description) {
        const description =
            document.createElement(
                'span',
            );

        description.className =
            'field-description';

        description.textContent =
            schema.description;

        label.appendChild(
            description,
        );
    }

    const control =
        document.createElement(
            'div',
        );

    control.className =
        'field-control';

    const select =
        document.createElement(
            'select',
        );

    const loadingOption =
        document.createElement(
            'option',
        );

    loadingOption.textContent =
        'Loading content…';

    select.appendChild(
        loadingOption,
    );

    select.disabled = true;

    control.appendChild(
        select,
    );

    wrapper.append(
        label,
        control,
    );

    const nullable =
        isNullableStringSchema(
            schema,
        );

    const currentValue =
        typeof value === 'string'
            ? value
            : null;

    void populateContentReferenceField(
        select,
        sourceCollectionIds,
        currentValue,
        nullable,
        (nextValue) => {
            updateField(
                recordId,
                fieldName,
                nextValue,
            );
        },
    );

    return wrapper;
}

async function populateContentReferenceField(
    select: HTMLSelectElement,
    sourceCollectionIds: string[],
    currentValue: string | null,
    nullable: boolean,
    onChange:
        (
            value:
                string | null,
        ) => void,
): Promise<void> {
    try {
        const sources =
            await Promise.all(
                sourceCollectionIds
                    .map(
                        loadContentReferenceCollection,
                    ),
            );

        select.replaceChildren();

        if (nullable) {
            const none =
                document.createElement(
                    'option',
                );

            none.value = '';
            none.textContent =
                '— None —';

            select.appendChild(
                none,
            );
        }

        let optionCount = 0;
        let currentFound =
            currentValue === null;

        for (
            const source of
            sources
        ) {
            const entries =
                Object.entries(
                    source.data,
                );

            if (entries.length === 0) {
                continue;
            }

            const parent:
                HTMLSelectElement |
                HTMLOptGroupElement =
                sources.length > 1
                    ? document.createElement(
                        'optgroup',
                    )
                    : select;

            if (
                parent instanceof
                HTMLOptGroupElement
            ) {
                parent.label =
                    source.label;
            }

            for (
                const [
                    referenceId,
                    record,
                ] of entries
            ) {
                const option =
                    document.createElement(
                        'option',
                    );

                option.value =
                    referenceId;

                option.textContent =
                    getContentReferenceOptionLabel(
                        referenceId,
                        record,
                    );

                parent.appendChild(
                    option,
                );

                optionCount += 1;

                if (
                    referenceId ===
                    currentValue
                ) {
                    currentFound =
                        true;
                }
            }

            if (
                parent instanceof
                HTMLOptGroupElement
            ) {
                select.appendChild(
                    parent,
                );
            }
        }

        if (
            currentValue !== null &&
            !currentFound
        ) {
            const missing =
                document.createElement(
                    'option',
                );

            missing.value =
                currentValue;

            missing.textContent =
                (
                    currentValue +
                    ' (missing)'
                );

            select.prepend(
                missing,
            );
        }

        if (
            optionCount === 0 &&
            !nullable &&
            currentValue === null
        ) {
            const empty =
                document.createElement(
                    'option',
                );

            empty.textContent =
                'No records available';

            select.appendChild(
                empty,
            );

            select.disabled = true;

            return;
        }

        select.value =
            currentValue ?? '';

        select.disabled = false;

        select.addEventListener(
            'change',
            () => {
                onChange(
                    (
                        nullable &&
                        select.value === ''
                    )
                        ? null
                        : select.value,
                );
            },
        );
    } catch (error) {
        select.replaceChildren();

        const failed =
            document.createElement(
                'option',
            );

        failed.textContent =
            'Failed to load: ' +
            getErrorMessage(error);

        select.appendChild(
            failed,
        );

        select.disabled = true;
    }
}

function loadContentReferenceCollection(
    collectionId: string,
): Promise<ContentCollectionPayload> {
    if (
        collection?.id ===
        collectionId
    ) {
        return Promise.resolve(
            collection,
        );
    }

    const cached =
        contentReferenceCollectionCache
            .get(
                collectionId,
            );

    if (cached) {
        return cached;
    }

    const request =
        fetch(
            getCollectionUrl(
                collectionId,
            ),
        )
            .then(
                async (response) => {
                    if (!response.ok) {
                        throw new Error(
                            await readErrorMessage(
                                response,
                            ),
                        );
                    }

                    return (
                        await response.json() as
                            ContentCollectionPayload
                    );
                },
            )
            .catch((error) => {
                contentReferenceCollectionCache
                    .delete(
                        collectionId,
                    );

                throw error;
            });

    contentReferenceCollectionCache
        .set(
            collectionId,
            request,
        );

    return request;
}

function getContentReferenceOptionLabel(
    referenceId: string,
    record: ContentRecord,
): string {
    const label =
        typeof record.name ===
            'string'
            ? record.name
            : (
                typeof record.label ===
                    'string'
                    ? record.label
                    : undefined
            );

    if (
        !label ||
        label === referenceId
    ) {
        return referenceId;
    }

    return (
        label +
        ' [' +
        referenceId +
        ']'
    );
}

`;

    text =
        replaceOnce(
            text,
`function createAssetReferenceField(
`,
`${contentReferenceFunctions}function createAssetReferenceField(
`,
            'content reference field functions',
        );

    text =
        replaceOnce(
            text,
`async function createDefaultFieldValue(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
): Promise<unknown> {
    const assetBucket =`,
`async function createDefaultFieldValue(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
): Promise<unknown> {
    const contentReferences =
        schema[
            'x-editor-content-reference'
        ];

    if (
        contentReferences &&
        contentReferences.length > 0
    ) {
        if (
            isNullableStringSchema(
                schema,
            )
        ) {
            return null;
        }

        const sources =
            await Promise.all(
                contentReferences
                    .map(
                        loadContentReferenceCollection,
                    ),
            );

        for (
            const source of
            sources
        ) {
            const firstId =
                Object.keys(
                    source.data,
                )[0];

            if (firstId) {
                return firstId;
            }
        }

        throw new Error(
            (
                'Cannot create record: content reference for field "' +
                fieldName +
                '" has no available records.'
            ),
        );
    }

    const assetBucket =`,
            'default content reference value',
        );

    stageExisting(
        file,
        text,
    );
}

const referenceTestSource =
`import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    CONTENT_COLLECTION_ID,
    getContentCollectionJsonSchema,
} from '../../tools/content-editor/server/content_registry';

type ReferenceFieldSchema = {
    type?:
        string |
        string[];

    anyOf?: Array<{
        type?: string;
    }>;

    'x-editor-content-reference'?:
        string[];
};

type RecordSchema = {
    properties?: Record<
        string,
        ReferenceFieldSchema
    >;
};

describe(
    'Content editor content-reference fields',
    () => {
        it(
            'exposes Debug Start hardware references through generic schema metadata',
            () => {
                const schema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                    ) as {
                        properties?: Record<
                            string,
                            RecordSchema
                        >;
                    };

                const player =
                    schema.properties
                        ?.player
                        ?.properties;

                const enemy =
                    schema.properties
                        ?.enemy
                        ?.properties;

                expect(
                    player
                        ?.driveId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_DRIVES,
                ]);

                expect(
                    player
                        ?.powerCoreId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .POWER_CORES,
                ]);

                expect(
                    player
                        ?.shieldGeneratorId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIELD_GENERATORS,
                ]);

                expect(
                    player
                        ?.defenseTurretId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .DEFENSE_TURRETS,
                ]);

                expect(
                    enemy
                        ?.chassisId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_CHASSIS,
                ]);

                expect(
                    enemy
                        ?.driveId
                        ?.[
                            'x-editor-content-reference'
                        ],
                ).toEqual([
                    CONTENT_COLLECTION_ID
                        .SHIP_DRIVES,
                ]);

                const weaponSources = [
                    CONTENT_COLLECTION_ID
                        .MISSILE_LAUNCHERS,
                    CONTENT_COLLECTION_ID
                        .BEAM_CANNONS,
                    CONTENT_COLLECTION_ID
                        .SPAM_PROJECTORS,
                    CONTENT_COLLECTION_ID
                        .STICKY_MINE_DISPENSERS,
                ];

                for (
                    const fieldName of [
                        'weaponSlot1Id',
                        'weaponSlot2Id',
                        'weaponSlot3Id',
                        'weaponSlot4Id',
                    ]
                ) {
                    expect(
                        player
                            ?.[fieldName]
                            ?.[
                                'x-editor-content-reference'
                            ],
                    ).toEqual(
                        weaponSources,
                    );

                    expect(
                        enemy
                            ?.[fieldName]
                            ?.[
                                'x-editor-content-reference'
                            ],
                    ).toEqual(
                        weaponSources,
                    );
                }
            },
        );

        it(
            'keeps optional enemy references nullable for the None option',
            () => {
                const schema =
                    getContentCollectionJsonSchema(
                        CONTENT_COLLECTION_ID
                            .DEBUG_START,
                    ) as {
                        properties?: Record<
                            string,
                            RecordSchema
                        >;
                    };

                const optional =
                    schema.properties
                        ?.enemy
                        ?.properties
                        ?.weaponSlot2Id;

                const types =
                    Array.isArray(
                        optional?.type,
                    )
                        ? optional.type
                        : optional
                            ?.anyOf
                            ?.map(
                                (variant) =>
                                    variant.type,
                            );

                expect(types).toEqual(
                    expect.arrayContaining([
                        'string',
                        'null',
                    ]),
                );
            },
        );
    },
);
`;

stageNew(
    FILES.referenceTest,
    referenceTestSource,
);

// Structural guards before touching tracked files.
{
    const schema =
        staged.get(
            FILES.debugStartSchema,
        );

    const main =
        staged.get(
            FILES.editorMain,
        );

    if (
        !schema ||
        !schema.includes(
            "'x-editor-content-reference'",
        ) ||
        !schema.includes(
            "'missile_launchers'",
        ) ||
        !schema.includes(
            "'sticky_mine_dispensers'",
        )
    ) {
        fail(
            'Debug Start schema is missing content-reference metadata.',
        );
    }

    if (
        !main ||
        !main.includes(
            'createContentReferenceField',
        ) ||
        !main.includes(
            'loadContentReferenceCollection',
        ) ||
        !main.includes(
            '— None —',
        ) ||
        !main.includes(
            'contentReferenceCollectionCache',
        )
    ) {
        fail(
            'Editor main is missing generic content-reference behavior.',
        );
    }
}

// All transforms and TypeScript parse checks passed.
// Write only now.
for (
    const [
        relativePath,
        content,
    ] of staged
) {
    writeFileSync(
        absolute(
            relativePath,
        ),
        normalizeForWrite(
            content,
            eols.get(
                relativePath,
            ) ?? '\n',
        ),
        'utf8',
    );
}

const diffCheck =
    spawnSync(
        'git',
        [
            '-c',
            'core.safecrlf=false',
            'diff',
            '--check',
        ],
        {
            cwd: repoRoot,
            encoding: 'utf8',
            shell: false,
        },
    );

if (
    diffCheck.status !== 0
) {
    fail(
        [
            'git diff --check failed.',
            diffCheck.stdout,
            diffCheck.stderr,
        ]
            .filter(Boolean)
            .join('\n'),
    );
}

console.log(
    [
        'Generic content-reference dropdowns added.',
        '',
        '- Debug Start module/chassis ids use collection-backed selects',
        '- weapon slots merge all four weapon-family collections',
        '- options show Name [id] when a name exists',
        '- nullable references expose — None — and write null',
        '- missing current ids remain visible as (missing)',
        '- reference collections are cached and refreshed after Save',
        '- generic add-record defaults also understand reference metadata',
        '',
        'Run:',
        '  npm run typecheck',
        '  npm test',
        '  npm run editor',
        '',
        'Editor smoke:',
        '  Debug Start -> Ships -> Player Ship / Enemy Ship',
        '  verify dropdowns, weapon groups and — None —',
        '  create/save a new weapon record, then return to Debug Start and verify it appears.',
    ].join('\n'),
);

unlinkSync(
    selfPath,
);
