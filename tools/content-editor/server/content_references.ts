import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    DEBUG_START_SCHEMA,
    type DebugStartData,
} from '../../../src/engine/content/schemas/debug_start';
import {
    SHIP_PRESETS,
} from '../../../src/engine/content/presets/ships';
import {
    CONTENT_COLLECTION_ID,
    type ContentCollectionId,
} from './content_registry';

type ShipChassisDraft = {
    name: string;
    spriteId: string;
    maxHull: number;
};

type ContentDraftCollection =
    Record<string, unknown>;

export type ContentUsage = {
    collection: string;
    recordId: string;
    label: string;
};

export type ContentRecordDeleteInfo = {
    usages: ContentUsage[];
};

type ContentReference = {
    recordId: string;
    usage: ContentUsage;
    usageSubject: string;
};

type ContentReferenceRule = {
    recordLabel: string;

    collectReferences:
        (
            repoRoot: string,
        ) =>
            ContentReference[] |
            Promise<ContentReference[]>;

    validateDraft?: (
        repoRoot: string,
        data: ContentDraftCollection,
    ) => Promise<void>;
};

const CONTENT_REFERENCE_RULES:
    Partial<
        Record<
            ContentCollectionId,
            ContentReferenceRule
        >
    > = {
        [CONTENT_COLLECTION_ID
            .DEBUG_START]: {
            recordLabel:
                'debug start record',

            collectReferences:
                () => {
                    return [];
                },

            validateDraft:
                validateDebugStartDraft,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_CHASSIS]: {
            recordLabel:
                'ship chassis',

            collectReferences:
                collectShipChassisReferences,

            validateDraft:
                validateShipChassisDraft,
        },

        [CONTENT_COLLECTION_ID
            .SHIP_DRIVES]: {
            recordLabel:
                'ship drive',

            collectReferences:
                collectShipDriveReferences,
        },

        [CONTENT_COLLECTION_ID
            .POWER_CORES]: {
            recordLabel:
                'power core',

            collectReferences:
                collectPowerCoreReferences,
        },

        [CONTENT_COLLECTION_ID
            .SHIELD_GENERATORS]: {
            recordLabel:
                'shield generator',

            collectReferences:
                collectShieldGeneratorReferences,
        },

        [CONTENT_COLLECTION_ID
            .DEFENSE_TURRETS]: {
            recordLabel:
                'defense turret',

            collectReferences:
                collectDefenseTurretReferences,
        },

        [CONTENT_COLLECTION_ID
            .MISSILE_LAUNCHERS]: {
            recordLabel:
                'missile launcher',

            collectReferences:
                (repoRoot) => {
                    return collectShipWeaponReferences(
                        repoRoot,
                        'missile_launchers.json',
                    );
                },

            validateDraft:
                (repoRoot, data) => {
                    return validateShipWeaponDraft(
                        repoRoot,
                        'missile_launchers.json',
                        data,
                    );
                },
        },

        [CONTENT_COLLECTION_ID
            .BEAM_CANNONS]: {
            recordLabel:
                'beam cannon',

            collectReferences:
                (repoRoot) => {
                    return collectShipWeaponReferences(
                        repoRoot,
                        'beam_cannons.json',
                    );
                },

            validateDraft:
                (repoRoot, data) => {
                    return validateShipWeaponDraft(
                        repoRoot,
                        'beam_cannons.json',
                        data,
                    );
                },
        },

        [CONTENT_COLLECTION_ID
            .SPAM_PROJECTORS]: {
            recordLabel:
                'spam projector',

            collectReferences:
                (repoRoot) => {
                    return collectShipWeaponReferences(
                        repoRoot,
                        'spam_projectors.json',
                    );
                },

            validateDraft:
                (repoRoot, data) => {
                    return validateShipWeaponDraft(
                        repoRoot,
                        'spam_projectors.json',
                        data,
                    );
                },
        },

        [CONTENT_COLLECTION_ID
            .STICKY_MINE_DISPENSERS]: {
            recordLabel:
                'sticky mine dispenser',

            collectReferences:
                (repoRoot) => {
                    return collectShipWeaponReferences(
                        repoRoot,
                        'sticky_mine_dispensers.json',
                    );
                },

            validateDraft:
                (repoRoot, data) => {
                    return validateShipWeaponDraft(
                        repoRoot,
                        'sticky_mine_dispensers.json',
                        data,
                    );
                },
        },
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

export async function getContentRecordDeleteInfo(
    repoRoot: string,
    collectionId: string,
    recordId: string,
): Promise<ContentRecordDeleteInfo> {
    const rule =
        getContentReferenceRule(
            collectionId,
        );

    if (!rule) {
        return {
            usages: [],
        };
    }

    const references =
        await rule
            .collectReferences(
                repoRoot,
            );

    return {
        usages:
            references
                .filter((reference) => {
                    return (
                        reference.recordId ===
                        recordId
                    );
                })
                .map((reference) => {
                    return reference.usage;
                }),
    };
}

export async function validateContentCollectionReferences(
    repoRoot: string,
    collectionId: string,
    data: unknown,
): Promise<void> {
    const rule =
        getContentReferenceRule(
            collectionId,
        );

    if (!rule) {
        return;
    }

    const draft =
        data as ContentDraftCollection;

    if (rule.validateDraft) {
        await rule.validateDraft(
            repoRoot,
            draft,
        );
    }

    const references =
        await rule
            .collectReferences(
                repoRoot,
            );

    for (
        const reference of
        references
    ) {
        if (
            Object.prototype
                .hasOwnProperty.call(
                    draft,
                    reference.recordId,
                )
        ) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove ' +
                rule.recordLabel +
                ' "' +
                reference.recordId +
                '": it is used by ' +
                reference.usageSubject +
                ' "' +
                reference.usage.recordId +
                '".'
            ),
            409,
        );
    }
}

function getContentReferenceRule(
    collectionId: string,
): ContentReferenceRule | undefined {
    return CONTENT_REFERENCE_RULES[
        collectionId as
            ContentCollectionId
    ];
}

async function collectShipChassisReferences(
    repoRoot: string,
): Promise<ContentReference[]> {
    const references =
        Object.values(
            SHIP_PRESETS,
        ).map((preset) => {
            return createShipPresetReference(
                preset.chassisId,
                preset.id,
            );
        });

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    references.push(
        createDebugStartReference(
            debugStart.enemy.chassisId,
            'enemy',
        ),
    );

    return references;
}

async function collectShipDriveReferences(
    repoRoot: string,
): Promise<ContentReference[]> {
    const references:
        ContentReference[] = [];

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        references.push(
            createShipPresetReference(
                preset.drive.driveId,
                preset.id,
            ),
        );
    }

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    references.push(
        createDebugStartReference(
            debugStart.player.driveId,
            'player',
        ),
        createDebugStartReference(
            debugStart.enemy.driveId,
            'enemy',
        ),
    );

    return references;
}

async function collectPowerCoreReferences(
    repoRoot: string,
): Promise<ContentReference[]> {
    const references:
        ContentReference[] = [];

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        if (
            !(
                'powerCore' in
                preset
            )
        ) {
            continue;
        }

        references.push(
            createShipPresetReference(
                preset
                    .powerCore
                    .powerCoreId,
                preset.id,
            ),
        );
    }

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    references.push(
        createDebugStartReference(
            debugStart.player
                .powerCoreId,
            'player',
        ),
    );

    if (
        debugStart.enemy
            .powerCoreId !== null
    ) {
        references.push(
            createDebugStartReference(
                debugStart.enemy
                    .powerCoreId,
                'enemy',
            ),
        );
    }

    return references;
}

async function collectShieldGeneratorReferences(
    repoRoot: string,
): Promise<ContentReference[]> {
    const references:
        ContentReference[] = [];

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        if (
            !(
                'shieldGenerator' in
                preset
            )
        ) {
            continue;
        }

        references.push(
            createShipPresetReference(
                preset
                    .shieldGenerator
                    .shieldGeneratorId,
                preset.id,
            ),
        );
    }

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    references.push(
        createDebugStartReference(
            debugStart.player
                .shieldGeneratorId,
            'player',
        ),
    );

    if (
        debugStart.enemy
            .shieldGeneratorId !==
        null
    ) {
        references.push(
            createDebugStartReference(
                debugStart.enemy
                    .shieldGeneratorId,
                'enemy',
            ),
        );
    }

    return references;
}

async function collectDefenseTurretReferences(
    repoRoot: string,
): Promise<ContentReference[]> {
    const references:
        ContentReference[] = [];

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        if (
            !(
                'defenseTurret' in
                preset
            )
        ) {
            continue;
        }

        references.push(
            createShipPresetReference(
                preset
                    .defenseTurret
                    .defenseTurretId,
                preset.id,
            ),
        );
    }

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    references.push(
        createDebugStartReference(
            debugStart.player
                .defenseTurretId,
            'player',
        ),
    );

    if (
        debugStart.enemy
            .defenseTurretId !==
        null
    ) {
        references.push(
            createDebugStartReference(
                debugStart.enemy
                    .defenseTurretId,
                'enemy',
            ),
        );
    }

    return references;
}

const SHIP_WEAPON_DATA_FILES = [
    'missile_launchers.json',
    'beam_cannons.json',
    'spam_projectors.json',
    'sticky_mine_dispensers.json',
] as const;

async function collectShipWeaponReferences(
    repoRoot: string,
    dataFileName:
        (typeof SHIP_WEAPON_DATA_FILES)[number],
): Promise<ContentReference[]> {
    const currentIds =
        await readContentRecordIds(
            repoRoot,
            dataFileName,
        );

    const references:
        ContentReference[] = [];

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        for (
            const weapon of
            preset.weapons
        ) {
            if (
                !currentIds.has(
                    weapon.weaponId,
                )
            ) {
                continue;
            }

            references.push(
                createShipPresetReference(
                    weapon.weaponId,
                    preset.id,
                ),
            );
        }
    }

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    const playerWeaponIds = [
        debugStart.player
            .weaponSlot1Id,
        debugStart.player
            .weaponSlot2Id,
        debugStart.player
            .weaponSlot3Id,
        debugStart.player
            .weaponSlot4Id,
    ];

    for (
        const weaponId of
        playerWeaponIds
    ) {
        if (
            !currentIds.has(
                weaponId,
            )
        ) {
            continue;
        }

        references.push(
            createDebugStartReference(
                weaponId,
                'player',
            ),
        );
    }

    const enemyWeaponIds = [
        debugStart.enemy
            .weaponSlot1Id,
        debugStart.enemy
            .weaponSlot2Id,
        debugStart.enemy
            .weaponSlot3Id,
        debugStart.enemy
            .weaponSlot4Id,
    ];

    for (
        const weaponId of
        enemyWeaponIds
    ) {
        if (
            weaponId === null ||
            !currentIds.has(
                weaponId,
            )
        ) {
            continue;
        }

        references.push(
            createDebugStartReference(
                weaponId,
                'enemy',
            ),
        );
    }

    return references;
}

async function validateDebugStartDraft(
    repoRoot: string,
    data: ContentDraftCollection,
): Promise<void> {
    const debugStart =
        DEBUG_START_SCHEMA.parse(
            data,
        );

    const chassisIds =
        await readContentRecordIds(
            repoRoot,
            'ship_chassis.json',
        );

    const driveIds =
        await readContentRecordIds(
            repoRoot,
            'ship_drives.json',
        );

    const powerCoreIds =
        await readContentRecordIds(
            repoRoot,
            'power_cores.json',
        );

    const shieldGeneratorIds =
        await readContentRecordIds(
            repoRoot,
            'shield_generators.json',
        );

    const defenseTurretIds =
        await readContentRecordIds(
            repoRoot,
            'defense_turrets.json',
        );

    const shipWeaponIds =
        new Set<string>();

    for (
        const dataFileName of
        SHIP_WEAPON_DATA_FILES
    ) {
        const familyIds =
            await readContentRecordIds(
                repoRoot,
                dataFileName,
            );

        for (
            const weaponId of
            familyIds
        ) {
            shipWeaponIds.add(
                weaponId,
            );
        }
    }

    assertDebugStartReferenceExists(
        'player.driveId',
        debugStart.player.driveId,
        driveIds,
        'ship drive',
    );

    assertDebugStartReferenceExists(
        'player.powerCoreId',
        debugStart.player
            .powerCoreId,
        powerCoreIds,
        'power core',
    );

    assertDebugStartReferenceExists(
        'player.shieldGeneratorId',
        debugStart.player
            .shieldGeneratorId,
        shieldGeneratorIds,
        'shield generator',
    );

    assertDebugStartReferenceExists(
        'player.defenseTurretId',
        debugStart.player
            .defenseTurretId,
        defenseTurretIds,
        'defense turret',
    );

    assertDebugStartReferenceExists(
        'player.weaponSlot1Id',
        debugStart.player
            .weaponSlot1Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'player.weaponSlot2Id',
        debugStart.player
            .weaponSlot2Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'player.weaponSlot3Id',
        debugStart.player
            .weaponSlot3Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'player.weaponSlot4Id',
        debugStart.player
            .weaponSlot4Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'enemy.chassisId',
        debugStart.enemy
            .chassisId,
        chassisIds,
        'ship chassis',
    );

    assertDebugStartReferenceExists(
        'enemy.driveId',
        debugStart.enemy
            .driveId,
        driveIds,
        'ship drive',
    );

    assertDebugStartReferenceExists(
        'enemy.powerCoreId',
        debugStart.enemy
            .powerCoreId,
        powerCoreIds,
        'power core',
    );

    assertDebugStartReferenceExists(
        'enemy.shieldGeneratorId',
        debugStart.enemy
            .shieldGeneratorId,
        shieldGeneratorIds,
        'shield generator',
    );

    assertDebugStartReferenceExists(
        'enemy.defenseTurretId',
        debugStart.enemy
            .defenseTurretId,
        defenseTurretIds,
        'defense turret',
    );

    assertDebugStartReferenceExists(
        'enemy.weaponSlot1Id',
        debugStart.enemy
            .weaponSlot1Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'enemy.weaponSlot2Id',
        debugStart.enemy
            .weaponSlot2Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'enemy.weaponSlot3Id',
        debugStart.enemy
            .weaponSlot3Id,
        shipWeaponIds,
        'ship weapon',
    );

    assertDebugStartReferenceExists(
        'enemy.weaponSlot4Id',
        debugStart.enemy
            .weaponSlot4Id,
        shipWeaponIds,
        'ship weapon',
    );
}

function assertDebugStartReferenceExists(
    field: string,
    recordId: string | null,
    ids: Set<string>,
    recordLabel: string,
): void {
    if (
        recordId === null ||
        ids.has(
            recordId,
        )
    ) {
        return;
    }

    throw new ContentReferenceError(
        (
            'Debug Start ' +
            field +
            ' references missing ' +
            recordLabel +
            ' "' +
            recordId +
            '".'
        ),
        400,
    );
}

async function readDebugStartData(
    repoRoot: string,
): Promise<DebugStartData> {
    const dataPath =
        path.join(
            repoRoot,
            'src',
            'engine',
            'content',
            'data',
            'debug_start.json',
        );

    return DEBUG_START_SCHEMA.parse(
        JSON.parse(
            await fs.readFile(
                dataPath,
                'utf8',
            ),
        ),
    );
}

async function validateShipWeaponDraft(
    repoRoot: string,
    currentDataFileName:
        (typeof SHIP_WEAPON_DATA_FILES)[number],
    data: ContentDraftCollection,
): Promise<void> {
    const draftIds =
        new Set(
            Object.keys(
                data,
            ),
        );

    for (
        const dataFileName of
        SHIP_WEAPON_DATA_FILES
    ) {
        if (
            dataFileName ===
            currentDataFileName
        ) {
            continue;
        }

        const otherIds =
            await readContentRecordIds(
                repoRoot,
                dataFileName,
            );

        for (
            const recordId of
            draftIds
        ) {
            if (
                !otherIds.has(
                    recordId,
                )
            ) {
                continue;
            }

            throw new ContentReferenceError(
                (
                    'Ship weapon id "' +
                    recordId +
                    '" is already defined in another weapon family.'
                ),
                400,
            );
        }
    }
}

async function readContentRecordIds(
    repoRoot: string,
    dataFileName: string,
): Promise<Set<string>> {
    const dataPath =
        path.join(
            repoRoot,
            'src',
            'engine',
            'content',
            'data',
            dataFileName,
        );

    const parsed =
        JSON.parse(
            await fs.readFile(
                dataPath,
                'utf8',
            ),
        ) as unknown;

    if (
        typeof parsed !==
            'object' ||
        parsed === null ||
        Array.isArray(
            parsed,
        )
    ) {
        throw new ContentReferenceError(
            (
                'Content data file "' +
                dataFileName +
                '" must contain an object.'
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

function createShipPresetReference(
    recordId: string,
    presetId: string,
): ContentReference {
    return createPresetReference(
        recordId,
        presetId,
        'Ship Presets',
        'ship preset',
    );
}

function createDebugStartReference(
    recordId: string,
    side:
        'player' |
        'enemy',
): ContentReference {
    const player =
        side === 'player';

    return {
        recordId,

        usage: {
            collection:
                'Debug Start',

            recordId:
                side,

            label:
                player
                    ? 'Player Ship'
                    : 'Enemy Ship',
        },

        usageSubject:
            player
                ? 'debug start player ship'
                : 'debug start enemy ship',
    };
}

function createPresetReference(
    recordId: string,
    presetId: string,
    collection: string,
    usageSubject: string,
): ContentReference {
    return {
        recordId,

        usage: {
            collection,

            recordId:
                presetId,

            label:
                presetId,
        },

        usageSubject,
    };
}

async function validateShipChassisDraft(
    repoRoot: string,
    data: ContentDraftCollection,
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
            data as Record<
                string,
                ShipChassisDraft
            >,
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
            'world',
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
