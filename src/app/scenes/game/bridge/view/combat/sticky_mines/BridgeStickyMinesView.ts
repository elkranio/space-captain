// src/app/scenes/game/bridge/view/combat/sticky_mines/BridgeStickyMinesView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeStickyMineAddedPayload,
    type BridgeStickyMineRemovedPayload,
    type BridgeStickyMinesUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    BRIDGE_VIEWSCREEN_RECT,
} from '../../bridge_viewscreen_layout';
import {
    removeMissingCombatSnapshotEntries,
} from '../remove_missing_combat_snapshot_entries';
import BridgeStickyMineView from './mine/BridgeStickyMineView';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

type StickyMineEntry = {
    slotIndex: number;
    view: BridgeStickyMineView;
};

// Стабильные physical slots.
// Мины не сортируются по fuse и не прыгают
// между местами после удаления соседей.
const STICKY_MINE_SLOT_OFFSETS = [
    {
        x: 130,
        y: 65,
    },
    {
        x: 420,
        y: 65,
    },
    {
        x: 710,
        y: 65,
    },
    {
        x: 130,
        y: 235,
    },
    {
        x: 420,
        y: 235,
    },
    {
        x: 710,
        y: 235,
    },
] as const;

// Manager-view прикреплённых sticky mines.
//
// Отвечает только за:
// - bridge events;
// - поиск source position;
// - стабильные display slots;
// - lifecycle дочерних views.
export default class BridgeStickyMinesView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly mines =
        new Map<string, StickyMineEntry>();

    private readonly occupiedSlotIndexes =
        new Set<number>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly getObjectPosition:
            GetObjectPosition,
    ) {
        this.root =
            this.scene.add.container(0, 0);

        // Поверх encounter objects,
        // но под bridge interior и UI.
        this.scene.layers
            .get('vfx')
            .add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT.STICKY_MINE_ADDED,
            this.addMine,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.STICKY_MINES_UPDATED,
            this.updateMines,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT.STICKY_MINE_REMOVED,
            this.removeMine,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.STICKY_MINE_ADDED,
            this.addMine,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.STICKY_MINES_UPDATED,
            this.updateMines,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT.STICKY_MINE_REMOVED,
            this.removeMine,
            this,
        );

        for (
            const entry of this.mines.values()
        ) {
            entry.view.destroy();
        }

        this.mines.clear();
        this.occupiedSlotIndexes.clear();

        this.root.destroy(false);
    }

    private addMine(
        payload: BridgeStickyMineAddedPayload,
    ): void {
        if (
            this.mines.has(payload.mineId)
        ) {
            throw new Error(
                `Sticky mine already exists: ` +
                    payload.mineId,
            );
        }

        const slotIndex =
            this.findFreeSlotIndex();

        if (slotIndex < 0) {
            throw new Error(
                `No free sticky-mine display slot: ` +
                    payload.mineId,
            );
        }

        const sourcePosition =
            this.getObjectPosition(
                payload.sourceActorId,
            );

        if (!sourcePosition) {
            throw new Error(
                `Sticky-mine source object not found: ` +
                    payload.sourceActorId,
            );
        }

        const slot =
            STICKY_MINE_SLOT_OFFSETS[
                slotIndex
            ];

        const targetPosition =
            new Phaser.Math.Vector2(
                BRIDGE_VIEWSCREEN_RECT.x +
                    slot.x,

                BRIDGE_VIEWSCREEN_RECT.y +
                    slot.y,
            );

        const view =
            new BridgeStickyMineView({
                scene: this.scene,
                parent: this.root,

                startPosition:
                    sourcePosition,

                targetPosition,

                initialTimeToDetonationMs:
                    payload
                        .initialTimeToDetonationMs,
            });

        this.mines.set(
            payload.mineId,
            {
                slotIndex,
                view,
            },
        );

        this.occupiedSlotIndexes.add(
            slotIndex,
        );
    }

    private updateMines(
        updates:
            BridgeStickyMinesUpdatedPayload,
    ): void {
        removeMissingCombatSnapshotEntries(
            this.mines,
            updates.map((update) => {
                return update.mineId;
            }),
            (mineId, entry) => {
                this.destroyEntry(
                    mineId,
                    entry,
                );
            },
        );

        for (const update of updates) {
            const entry =
                this.mines.get(
                    update.mineId,
                );

            if (!entry) {
                throw new Error(
                    `Sticky mine not found during update: ` +
                        update.mineId,
                );
            }

            entry.view.update({
                timeToDetonationMs:
                    update
                        .remainingTimeToDetonationMs,

                isBeingCleared:
                    update.isBeingCleared,

                isNextClearTarget:
                    update.isNextClearTarget,
            });
        }
    }

    private removeMine(
        payload:
            BridgeStickyMineRemovedPayload,
    ): void {
        const entry =
            this.mines.get(
                payload.mineId,
            );

        if (!entry) {
            throw new Error(
                `Sticky mine not found: ` +
                    payload.mineId,
            );
        }

        entry.view.playRemovalEffect(
            payload.outcome,
        );

        this.destroyEntry(
            payload.mineId,
            entry,
        );
    }

    private destroyEntry(
        mineId: string,
        entry: StickyMineEntry,
    ): void {
        entry.view.destroy();

        this.mines.delete(
            mineId,
        );

        this.occupiedSlotIndexes.delete(
            entry.slotIndex,
        );
    }

    private findFreeSlotIndex(): number {
        for (
            let slotIndex = 0;
            slotIndex <
            STICKY_MINE_SLOT_OFFSETS.length;
            slotIndex += 1
        ) {
            if (
                !this.occupiedSlotIndexes.has(
                    slotIndex,
                )
            ) {
                return slotIndex;
            }
        }

        return -1;
    }
}
