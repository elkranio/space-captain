import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    DEBUG_START_EQUIPMENT_TYPE,
    DEBUG_START_SCHEMA,
    type DebugStartData,
    type DebugStartEquipmentType,
} from '../../../src/engine/content/schemas/debug_start';
import {
    SHIP_CHASSIS_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_chassis';
import {
    SHIP_PRESETS,
    type ShipPreset,
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

export type ShipChassisDependentCleanup = {
    debugStart: DebugStartData;
    removedEquipmentMounts: number;
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

export async function createShipChassisDependentCleanup(
    repoRoot: string,
    currentData: unknown,
    nextData: unknown,
): Promise<ShipChassisDependentCleanup | undefined> {
    const currentChassis =
        SHIP_CHASSIS_TUNING_SCHEMA.parse(
            currentData,
        );

    const nextChassis =
        SHIP_CHASSIS_TUNING_SCHEMA.parse(
            nextData,
        );

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    let removedEquipmentMounts = 0;

    const cleanShip = (
        side:
            'player' |
            'enemy',
    ) => {
        const ship =
            debugStart[side];

        const currentDefinition =
            currentChassis[
                ship.chassisId
            ];

        const nextDefinition =
            nextChassis[
                ship.chassisId
            ];

        if (
            !currentDefinition ||
            !nextDefinition
        ) {
            return ship;
        }

        const currentSlotKinds =
            new Map(
                currentDefinition.slots
                    .map((slot) => {
                        return [
                            slot.id,
                            slot.kind,
                        ] as const;
                    }),
            );

        const nextSlotKinds =
            new Map(
                nextDefinition.slots
                    .map((slot) => {
                        return [
                            slot.id,
                            slot.kind,
                        ] as const;
                    }),
            );

        const equipment =
            ship.equipment.filter(
                (mount) => {
                    const currentKind =
                        currentSlotKinds.get(
                            mount.slotId,
                        );

                    const nextKind =
                        nextSlotKinds.get(
                            mount.slotId,
                        );

                    const keep =
                        currentKind !== undefined &&
                        nextKind !== undefined &&
                        currentKind === nextKind;

                    if (!keep) {
                        removedEquipmentMounts += 1;
                    }

                    return keep;
                },
            );

        return {
            ...ship,
            equipment,
        };
    };

    const cleaned =
        DEBUG_START_SCHEMA.parse({
            player:
                cleanShip('player'),
            enemy:
                cleanShip('enemy'),
        });

    if (removedEquipmentMounts === 0) {
        return undefined;
    }

    return {
        debugStart:
            cleaned,
        removedEquipmentMounts,
    };
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
            debugStart.player.chassisId,
            'player',
        ),
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
        ...collectDebugStartEquipmentReferences(
            debugStart,
            DEBUG_START_EQUIPMENT_TYPE.DRIVE,
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
        const powerCore =
            (preset as ShipPreset)
                .powerCore;

        if (!powerCore) {
            continue;
        }

        references.push(
            createShipPresetReference(
                powerCore.powerCoreId,
                preset.id,
            ),
        );
    }

    const debugStart =
        await readDebugStartData(
            repoRoot,
        );

    references.push(
        ...collectDebugStartEquipmentReferences(
            debugStart,
            DEBUG_START_EQUIPMENT_TYPE
                .POWER_CORE,
        ),
    );

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
        const shieldGenerator =
            (preset as ShipPreset)
                .shieldGenerator;

        if (!shieldGenerator) {
            continue;
        }

        references.push(
            createShipPresetReference(
                shieldGenerator
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
        ...collectDebugStartEquipmentReferences(
            debugStart,
            DEBUG_START_EQUIPMENT_TYPE
                .SHIELD_GENERATOR,
        ),
    );

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
        const defenseTurret =
            (preset as ShipPreset)
                .defenseTurret;

        if (!defenseTurret) {
            continue;
        }

        references.push(
            createShipPresetReference(
                defenseTurret
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
        ...collectDebugStartEquipmentReferences(
            debugStart,
            DEBUG_START_EQUIPMENT_TYPE
                .DEFENSE_TURRET,
        ),
    );

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

    for (
        const reference of
        collectDebugStartEquipmentReferences(
            debugStart,
            DEBUG_START_EQUIPMENT_TYPE.WEAPON,
        )
    ) {
        if (
            !currentIds.has(
                reference.recordId,
            )
        ) {
            continue;
        }

        references.push(
            reference,
        );
    }

    return references;
}

function collectDebugStartEquipmentReferences(
    debugStart: DebugStartData,
    type: DebugStartEquipmentType,
): ContentReference[] {
    const references:
        ContentReference[] = [];

    for (
        const side of
        ['player', 'enemy'] as const
    ) {
        for (
            const equipment of
            debugStart[side].equipment
        ) {
            if (
                equipment.type !==
                type
            ) {
                continue;
            }

            references.push(
                createDebugStartReference(
                    equipment.equipmentId,
                    side,
                ),
            );
        }
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

    for (
        const side of
        ['player', 'enemy'] as const
    ) {
        const ship =
            debugStart[side];

        assertDebugStartReferenceExists(
            side + '.chassisId',
            ship.chassisId,
            chassisIds,
            'ship chassis',
        );

        for (
            const [
                index,
                equipment,
            ] of ship.equipment.entries()
        ) {
            const field =
                side +
                '.equipment[' +
                String(index) +
                '].equipmentId';

            switch (equipment.type) {
                case DEBUG_START_EQUIPMENT_TYPE
                    .DRIVE:
                    assertDebugStartReferenceExists(
                        field,
                        equipment.equipmentId,
                        driveIds,
                        'ship drive',
                    );
                    break;

                case DEBUG_START_EQUIPMENT_TYPE
                    .POWER_CORE:
                    assertDebugStartReferenceExists(
                        field,
                        equipment.equipmentId,
                        powerCoreIds,
                        'power core',
                    );
                    break;

                case DEBUG_START_EQUIPMENT_TYPE
                    .DEFENSE_TURRET:
                    assertDebugStartReferenceExists(
                        field,
                        equipment.equipmentId,
                        defenseTurretIds,
                        'defense turret',
                    );
                    break;

                case DEBUG_START_EQUIPMENT_TYPE
                    .SHIELD_GENERATOR:
                    assertDebugStartReferenceExists(
                        field,
                        equipment.equipmentId,
                        shieldGeneratorIds,
                        'shield generator',
                    );
                    break;

                case DEBUG_START_EQUIPMENT_TYPE
                    .WEAPON:
                    assertDebugStartReferenceExists(
                        field,
                        equipment.equipmentId,
                        shipWeaponIds,
                        'ship weapon',
                    );
                    break;
            }
        }
    }
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
