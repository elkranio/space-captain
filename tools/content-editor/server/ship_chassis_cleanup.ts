import {
    promises as fs,
} from 'node:fs';
import path from 'node:path';
import {
    DEBUG_START_SCHEMA,
    type DebugStartData,
} from '../../../src/engine/content/schemas/debug_start';
import {
    SHIP_CHASSIS_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_chassis';

export type ShipChassisDependentCleanup = {
    debugStart: DebugStartData;
    removedEquipmentMounts: number;
};

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
