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
} from './content_registry';

type ShipChassisDraft = {
    name: string;
    spriteId: string;
    maxHull: number;
};

type ShipChassisDraftCollection =
    Record<
        string,
        ShipChassisDraft
    >;

type ShipDriveDraft = {
    name: string;
};

type ShipDriveDraftCollection =
    Record<
        string,
        ShipDriveDraft
    >;

type PowerCoreDraft = {
    name: string;
    capacity: number;
    rechargeDurationMs: number;
};

type PowerCoreDraftCollection =
    Record<
        string,
        PowerCoreDraft
    >;

type ShieldGeneratorDraft = {
    name: string;
    shieldDurationMs: number;
    cooldownDurationMs: number;
};

type ShieldGeneratorDraftCollection =
    Record<
        string,
        ShieldGeneratorDraft
    >;

type DefenseTurretDraft = {
    name: string;
    loadDurationMs: number;
    cooldownDurationMs: number;
};

type DefenseTurretDraftCollection =
    Record<
        string,
        DefenseTurretDraft
    >;

export type ContentUsage = {
    collection: string;
    recordId: string;
    label: string;
};

export type ContentRecordDeleteInfo = {
    usages: ContentUsage[];
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

export function getContentRecordDeleteInfo(
    collectionId: string,
    recordId: string,
): ContentRecordDeleteInfo {
    switch (collectionId) {
        case CONTENT_COLLECTION_ID
            .SHIP_CHASSIS:
            return {
                usages:
                    findShipChassisUsages(
                        recordId,
                    ),
            };

        case CONTENT_COLLECTION_ID
            .SHIP_DRIVES:
            return {
                usages:
                    findShipDriveUsages(
                        recordId,
                    ),
            };

        case CONTENT_COLLECTION_ID
            .POWER_CORES:
            return {
                usages:
                    findPowerCoreUsages(
                        recordId,
                    ),
            };

        case CONTENT_COLLECTION_ID
            .SHIELD_GENERATORS:
            return {
                usages:
                    findShieldGeneratorUsages(
                        recordId,
                    ),
            };

        case CONTENT_COLLECTION_ID
            .DEFENSE_TURRETS:
            return {
                usages:
                    findDefenseTurretUsages(
                        recordId,
                    ),
            };

        default:
            return {
                usages: [],
            };
    }
}

export async function validateContentCollectionReferences(
    repoRoot: string,
    collectionId: string,
    data: unknown,
): Promise<void> {
    switch (collectionId) {
        case CONTENT_COLLECTION_ID
            .SHIP_CHASSIS:
            await validateShipChassisReferences(
                repoRoot,
                data as
                    ShipChassisDraftCollection,
            );

            return;

        case CONTENT_COLLECTION_ID
            .SHIP_DRIVES:
            validateShipDriveReferences(
                data as
                    ShipDriveDraftCollection,
            );

            return;

        case CONTENT_COLLECTION_ID
            .POWER_CORES:
            validatePowerCoreReferences(
                data as
                    PowerCoreDraftCollection,
            );

            return;

        case CONTENT_COLLECTION_ID
            .SHIELD_GENERATORS:
            validateShieldGeneratorReferences(
                data as
                    ShieldGeneratorDraftCollection,
            );

            return;

        case CONTENT_COLLECTION_ID
            .DEFENSE_TURRETS:
            validateDefenseTurretReferences(
                data as
                    DefenseTurretDraftCollection,
            );

            return;

        default:
            return;
    }
}

function findShipChassisUsages(
    chassisId: string,
): ContentUsage[] {
    return Object.values(
        SHIP_PRESETS,
    )
        .filter((preset) => {
            return (
                preset.chassisId ===
                chassisId
            );
        })
        .map((preset) => {
            return {
                collection:
                    'Ship Presets',

                recordId:
                    preset.id,

                label:
                    preset.id,
            };
        });
}

function findShipDriveUsages(
    driveId: string,
): ContentUsage[] {
    const shipPresetUsages =
        Object.values(
            SHIP_PRESETS,
        )
            .filter((preset) => {
                return (
                    preset
                        .drive
                        .driveId ===
                    driveId
                );
            })
            .map((preset) => {
                return {
                    collection:
                        'Ship Presets',

                    recordId:
                        preset.id,

                    label:
                        preset.id,
                };
            });

    const playerPresetUsages =
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
            .filter((preset) => {
                return (
                    preset.driveId ===
                    driveId
                );
            })
            .map((preset) => {
                return {
                    collection:
                        'Player Ship Presets',

                    recordId:
                        preset.id,

                    label:
                        preset.id,
                };
            });

    return [
        ...shipPresetUsages,
        ...playerPresetUsages,
    ];
}

function findPowerCoreUsages(
    powerCoreId: string,
): ContentUsage[] {
    const shipPresetUsages =
        Object.values(
            SHIP_PRESETS,
        )
            .filter((preset) => {
                if (
                    !(
                        'powerCore' in
                        preset
                    )
                ) {
                    return false;
                }

                return (
                    preset
                        .powerCore
                        .powerCoreId ===
                    powerCoreId
                );
            })
            .map((preset) => {
                return {
                    collection:
                        'Ship Presets',

                    recordId:
                        preset.id,

                    label:
                        preset.id,
                };
            });

    const playerPresetUsages =
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
            .filter((preset) => {
                return (
                    preset
                        .powerCore
                        .powerCoreId ===
                    powerCoreId
                );
            })
            .map((preset) => {
                return {
                    collection:
                        'Player Ship Presets',

                    recordId:
                        preset.id,

                    label:
                        preset.id,
                };
            });

    return [
        ...shipPresetUsages,
        ...playerPresetUsages,
    ];
}

function findShieldGeneratorUsages(
    shieldGeneratorId: string,
): ContentUsage[] {
    const shipPresetUsages =
        Object.values(
            SHIP_PRESETS,
        )
            .filter((preset) => {
                if (
                    !(
                        'shieldGenerator' in
                        preset
                    )
                ) {
                    return false;
                }

                return (
                    preset
                        .shieldGenerator
                        .shieldGeneratorId ===
                    shieldGeneratorId
                );
            })
            .map((preset) => {
                return {
                    collection:
                        'Ship Presets',

                    recordId:
                        preset.id,

                    label:
                        preset.id,
                };
            });

    const playerPresetUsages =
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
            .filter((preset) => {
                return (
                    preset
                        .shieldGenerator
                        .shieldGeneratorId ===
                    shieldGeneratorId
                );
            })
            .map((preset) => {
                return {
                    collection:
                        'Player Ship Presets',

                    recordId:
                        preset.id,

                    label:
                        preset.id,
                };
            });

    return [
        ...shipPresetUsages,
        ...playerPresetUsages,
    ];
}

function findDefenseTurretUsages(
    defenseTurretId: string,
): ContentUsage[] {
    return Object.values(
        SHIP_PRESETS,
    )
        .filter((preset) => {
            if (
                !(
                    'defenseTurret' in
                    preset
                )
            ) {
                return false;
            }

            return (
                preset
                    .defenseTurret
                    .defenseTurretId ===
                defenseTurretId
            );
        })
        .map((preset) => {
            return {
                collection:
                    'Ship Presets',

                recordId:
                    preset.id,

                label:
                    preset.id,
            };
        });
}

async function validateShipChassisReferences(
    repoRoot: string,
    data: ShipChassisDraftCollection,
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
            data,
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

    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        if (
            data[
                preset.chassisId
            ]
        ) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove ship chassis "' +
                preset.chassisId +
                '": it is used by ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }
}

function validateShipDriveReferences(
    data: ShipDriveDraftCollection,
): void {
    for (
        const preset of
        Object.values(
            SHIP_PRESETS,
        )
    ) {
        const driveId =
            preset
                .drive
                .driveId;

        if (data[driveId]) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove ship drive "' +
                driveId +
                '": it is used by ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        if (
            data[
                preset.driveId
            ]
        ) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove ship drive "' +
                preset.driveId +
                '": it is used by player ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }
}

function validatePowerCoreReferences(
    data: PowerCoreDraftCollection,
): void {
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

        const powerCoreId =
            preset
                .powerCore
                .powerCoreId;

        if (data[powerCoreId]) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove power core "' +
                powerCoreId +
                '": it is used by ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        const powerCoreId =
            preset
                .powerCore
                .powerCoreId;

        if (data[powerCoreId]) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove power core "' +
                powerCoreId +
                '": it is used by player ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }
}

function validateShieldGeneratorReferences(
    data: ShieldGeneratorDraftCollection,
): void {
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

        const shieldGeneratorId =
            preset
                .shieldGenerator
                .shieldGeneratorId;

        if (data[shieldGeneratorId]) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove shield generator "' +
                shieldGeneratorId +
                '": it is used by ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }

    for (
        const preset of
        Object.values(
            PLAYER_SHIP_PRESETS,
        )
    ) {
        const shieldGeneratorId =
            preset
                .shieldGenerator
                .shieldGeneratorId;

        if (data[shieldGeneratorId]) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove shield generator "' +
                shieldGeneratorId +
                '": it is used by player ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
    }
}

function validateDefenseTurretReferences(
    data: DefenseTurretDraftCollection,
): void {
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

        const defenseTurretId =
            preset
                .defenseTurret
                .defenseTurretId;

        if (data[defenseTurretId]) {
            continue;
        }

        throw new ContentReferenceError(
            (
                'Cannot remove defense turret "' +
                defenseTurretId +
                '": it is used by ship preset "' +
                preset.id +
                '".'
            ),
            409,
        );
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
