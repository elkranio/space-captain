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
import BridgeStickyMineView from './mine/BridgeStickyMineView';

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

        const slot =
            STICKY_MINE_SLOT_OFFSETS[
                slotIndex
            ];

        const view =
            new BridgeStickyMineView({
                scene: this.scene,
                parent: this.root,

                x:
                    BRIDGE_VIEWSCREEN_RECT.x +
                    slot.x,

                y:
                    BRIDGE_VIEWSCREEN_RECT.y +
                    slot.y,

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

            entry.view.update(
                update
                    .remainingTimeToDetonationMs,
            );
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

        entry.view.destroy();

        this.mines.delete(
            payload.mineId,
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
