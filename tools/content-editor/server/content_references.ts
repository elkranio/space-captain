import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import { DEBUG_START_SCHEMA } from '../../../src/engine/content/schemas/debug_start';
import { SHIPS_SCHEMA, type ShipsData, type ShipEquipmentType } from '../../../src/engine/content/schemas/ships';
import { SHIP_CHASSIS_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_chassis';
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
        [CONTENT_COLLECTION_ID.SHIPS]: {
            recordLabel: 'ship',
            collectReferences: collectStartingShipReferences,
            validateDraft: validateShipsDraft,
        },
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

async function collectStartingShipReferences(repoRoot: string): Promise<ContentReference[]> {
    const start = DEBUG_START_SCHEMA.parse(await readContentData(repoRoot, 'debug_start.json'));
    return [
        createDebugStartReference(start.playerShipId, 'player'),
        createDebugStartReference(start.enemyShipId, 'enemy'),
    ];
}

async function collectShipChassisReferences(repoRoot: string): Promise<ContentReference[]> {
    const ships = await readShipsData(repoRoot);
    return Object.entries(ships).map(([id, ship]) => createShipReference(ship.chassisId, id, ship.name));
}

async function collectShipDriveReferences(repoRoot: string): Promise<ContentReference[]> {
    return collectShipEquipmentReferences(await readShipsData(repoRoot), 'drive');
}

async function collectPowerCoreReferences(repoRoot: string): Promise<ContentReference[]> {
    return collectShipEquipmentReferences(await readShipsData(repoRoot), 'power_core');
}

async function collectShieldGeneratorReferences(repoRoot: string): Promise<ContentReference[]> {
    return collectShipEquipmentReferences(await readShipsData(repoRoot), 'shield_generator');
}

async function collectDefenseTurretReferences(repoRoot: string): Promise<ContentReference[]> {
    return collectShipEquipmentReferences(await readShipsData(repoRoot), 'defense_turret');
}

const SHIP_WEAPON_DATA_FILES = [
    'missile_launchers.json',
    'beam_cannons.json',
    'spam_projectors.json',
    'sticky_mine_dispensers.json',
] as const;

async function collectShipWeaponReferences(
    repoRoot: string,
    dataFileName: (typeof SHIP_WEAPON_DATA_FILES)[number],
): Promise<ContentReference[]> {
    const ids = await readContentRecordIds(repoRoot, dataFileName);
    return collectShipEquipmentReferences(await readShipsData(repoRoot), 'weapon')
        .filter(reference => ids.has(reference.recordId));
}

function collectShipEquipmentReferences(ships: ShipsData, type: ShipEquipmentType): ContentReference[] {
    const references: ContentReference[] = [];
    for (const [id, ship] of Object.entries(ships)) {
        for (const equipment of ship.equipment) {
            if (equipment.type === type) {
                references.push(createShipReference(equipment.equipmentId, id, ship.name));
            }
        }
    }
    return references;
}

function createShipReference(recordId: string, shipId: string, name: string): ContentReference {
    return {
        recordId,
        usage: { collection: 'Ships', recordId: shipId, label: name },
        usageSubject: 'ship',
    };
}

async function validateDebugStartDraft(repoRoot: string, data: ContentDraftCollection): Promise<void> {
    const start = DEBUG_START_SCHEMA.parse(data);
    const ids = await readContentRecordIds(repoRoot, 'ships.json');
    for (const [field, id] of Object.entries(start)) {
        assertReferenceExists('Debug Start ' + field, id, ids, 'ship');
    }
}

async function validateShipsDraft(repoRoot: string, data: ContentDraftCollection): Promise<void> {
    const ships = SHIPS_SCHEMA.parse(data);
    const chassis = SHIP_CHASSIS_TUNING_SCHEMA.parse(await readContentData(repoRoot, 'ship_chassis.json'));
    const sources = [
        { type: 'drive', file: 'ship_drives.json', kind: 'drive', label: 'ship drive' },
        { type: 'power_core', file: 'power_cores.json', kind: 'power_core', label: 'power core' },
        { type: 'defense_turret', file: 'defense_turrets.json', kind: 'defense', label: 'defense turret' },
        { type: 'shield_generator', file: 'shield_generators.json', kind: 'defense', label: 'shield generator' },
        ...SHIP_WEAPON_DATA_FILES.map(file => ({
            type: 'weapon', file, kind: file === 'spam_projectors.json' ? 'utility' : 'weapon', label: 'ship weapon',
        })),
    ];
    const catalogs = await Promise.all(sources.map(async source => ({
        ...source, ids: await readContentRecordIds(repoRoot, source.file),
    })));

    for (const [shipId, ship] of Object.entries(ships)) {
        assertReferenceExists('Ship ' + shipId + '.chassisId', ship.chassisId, new Set(Object.keys(chassis)), 'ship chassis');
        for (const [index, mount] of ship.equipment.entries()) {
            const field = 'Ship ' + shipId + '.equipment[' + index + ']';
            const family = catalogs.filter(source => source.type === mount.type);
            const source = family.find(source => source.ids.has(mount.equipmentId));
            if (!source) {
                assertReferenceExists(field + '.equipmentId', mount.equipmentId, new Set(), family[0].label);
                continue;
            }
            const slot = chassis[ship.chassisId].slots.find(slot => slot.id === mount.slotId);
            if (!slot || slot.kind !== source.kind) {
                throw new ContentReferenceError(field + ' needs a ' + source.kind +
                    ' slot; "' + mount.slotId + '" is ' + (slot?.kind ?? 'missing') + '.', 400);
            }
        }
    }
}

function assertReferenceExists(field: string, id: string, ids: Set<string>, label: string): void {
    if (!ids.has(id)) {
        throw new ContentReferenceError(field + ' references missing ' + label + ' "' + id + '".', 400);
    }
}

async function readShipsData(repoRoot: string): Promise<ShipsData> {
    return SHIPS_SCHEMA.parse(await readContentData(repoRoot, 'ships.json'));
}

async function readContentData(repoRoot: string, file: string): Promise<unknown> {
    return JSON.parse(await fs.readFile(path.join(repoRoot, 'src/engine/content/data', file), 'utf8'));
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
