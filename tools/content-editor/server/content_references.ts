import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    PLAYER_SHIP_PRESETS,
} from '../../../src/engine/content/presets/player_ships';
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
            .LASER_EMITTERS]: {
            recordLabel:
                'laser emitter',

            collectReferences:
                (repoRoot) => {
                    return collectShipWeaponReferences(
                        repoRoot,
                        'laser_emitters.json',
                    );
                },

            validateDraft:
                (repoRoot, data) => {
                    return validateShipWeaponDraft(
                        repoRoot,
                        'laser_emitters.json',
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

function collectShipChassisReferences():
    ContentReference[] {
    return Object.values(
        SHIP_PRESETS,
    ).map((preset) => {
        return createShipPresetReference(
            preset.chassisId,
            preset.id,
        );
    });
}

function collectShipDriveReferences():
    ContentReference[] {
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

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        references.push(
            createPlayerShipPresetReference(
                preset.driveId,
                preset.id,
            ),
        );
    }

    return references;
}

function collectPowerCoreReferences():
    ContentReference[] {
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

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        references.push(
            createPlayerShipPresetReference(
                preset
                    .powerCore
                    .powerCoreId,
                preset.id,
            ),
        );
    }

    return references;
}

function collectShieldGeneratorReferences():
    ContentReference[] {
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

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        references.push(
            createPlayerShipPresetReference(
                preset
                    .shieldGenerator
                    .shieldGeneratorId,
                preset.id,
            ),
        );
    }

    return references;
}

function collectDefenseTurretReferences():
    ContentReference[] {
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

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        references.push(
            createPlayerShipPresetReference(
                preset
                    .defenseTurret
                    .defenseTurretId,
                preset.id,
            ),
        );
    }

    return references;
}

const SHIP_WEAPON_DATA_FILES = [
    'missile_launchers.json',
    'laser_emitters.json',
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

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
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
                createPlayerShipPresetReference(
                    weapon.weaponId,
                    preset.id,
                ),
            );
        }
    }

    return references;
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

function createPlayerShipPresetReference(
    recordId: string,
    presetId: string,
): ContentReference {
    return createPresetReference(
        recordId,
        presetId,
        'Player Ship Presets',
        'player ship preset',
    );
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
