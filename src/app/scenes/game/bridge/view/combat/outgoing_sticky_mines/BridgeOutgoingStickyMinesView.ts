// src/app/scenes/game/bridge/view/combat/outgoing_sticky_mines/BridgeOutgoingStickyMinesView.ts

import {
    PLAYER_STICKY_MINE_OUTCOME,
} from '../../../../../../../engine/encounter/model/combat';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeOutgoingStickyMineAddedPayload,
    type BridgeOutgoingStickyMineRemovedPayload,
    type BridgeOutgoingStickyMinesUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    getBridgePlayerWeaponSourcePosition,
} from '../bridge_player_weapon_layout';
import {
    removeMissingCombatSnapshotEntries,
} from '../remove_missing_combat_snapshot_entries';
import BridgeOutgoingStickyMineView from './mine/BridgeOutgoingStickyMineView';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

type OutgoingStickyMineEntry = {
    targetActorId: string;
    slotIndex: number;

    view:
        BridgeOutgoingStickyMineView;
};

// Stable local slots around one enemy actor.
// Existing mines never reshuffle when another mine disappears.
const OUTGOING_STICKY_MINE_SLOT_OFFSETS = [
    {
        x: -42,
        y: -28,
    },
    {
        x: 0,
        y: -36,
    },
    {
        x: 42,
        y: -28,
    },
    {
        x: -48,
        y: 20,
    },
    {
        x: 0,
        y: 34,
    },
    {
        x: 48,
        y: 20,
    },
] as const;

// Manager-view for sticky mines attached to enemy actors.
//
// Engine owns fuse and lifecycle.
// View owns only:
// - fast visual flight from player weapon source;
// - stable local slots around the target actor;
// - fuse presentation;
// - short removal VFX.
export default class BridgeOutgoingStickyMinesView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly mines =
        new Map<
            string,
            OutgoingStickyMineEntry
        >();

    private readonly occupiedSlotIndexesByTarget =
        new Map<
            string,
            Set<number>
        >();

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,

        private readonly getObjectPosition:
            GetObjectPosition,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.scene.layers
            .get('vfx')
            .add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINE_ADDED,

            this.addMine,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINES_UPDATED,

            this.updateMines,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINE_REMOVED,

            this.removeMine,
            this,
        );

    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINE_ADDED,

            this.addMine,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINES_UPDATED,

            this.updateMines,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINE_REMOVED,

            this.removeMine,
            this,
        );

        for (
            const entry of
            this.mines.values()
        ) {
            entry.view.destroy();
        }

        this.mines.clear();

        this.occupiedSlotIndexesByTarget
            .clear();

        this.root.destroy(false);
    }

    private addMine(
        payload:
            BridgeOutgoingStickyMineAddedPayload,
    ): void {
        if (
            this.mines.has(
                payload.mineId,
            )
        ) {
            throw new Error(
                'Outgoing sticky mine already exists: ' +
                    payload.mineId,
            );
        }

        const targetBasePosition =
            this.getObjectPosition(
                payload.targetActorId,
            );

        if (!targetBasePosition) {
            throw new Error(
                'Outgoing sticky-mine target object not found: ' +
                    payload.targetActorId,
            );
        }

        const slotIndex =
            this.findFreeSlotIndex(
                payload.targetActorId,
            );

        if (slotIndex < 0) {
            throw new Error(
                'No free outgoing sticky-mine slot: ' +
                    payload.mineId +
                    '/' +
                    payload.targetActorId,
            );
        }

        const slot =
            OUTGOING_STICKY_MINE_SLOT_OFFSETS[
                slotIndex
            ];

        const targetPosition =
            targetBasePosition
                .clone()
                .add(
                    new Phaser.Math.Vector2(
                        slot.x,
                        slot.y,
                    ),
                );

        const view =
            new BridgeOutgoingStickyMineView({
                scene:
                    this.scene,

                parent:
                    this.root,

                startPosition:
                    getBridgePlayerWeaponSourcePosition(),

                targetPosition,

                initialTimeToDetonationMs:
                    payload
                        .initialTimeToDetonationMs,
            });

        this.mines.set(
            payload.mineId,
            {
                targetActorId:
                    payload.targetActorId,

                slotIndex,
                view,
            },
        );

        this.getOccupiedSlotIndexes(
            payload.targetActorId,
        ).add(
            slotIndex,
        );
    }

    private updateMines(
        updates:
            BridgeOutgoingStickyMinesUpdatedPayload,
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
                    'Outgoing sticky mine not found during update: ' +
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
            BridgeOutgoingStickyMineRemovedPayload,
    ): void {
        const entry =
            this.mines.get(
                payload.mineId,
            );

        if (!entry) {
            throw new Error(
                'Outgoing sticky mine not found: ' +
                    payload.mineId,
            );
        }

        if (
            payload.outcome ===
            PLAYER_STICKY_MINE_OUTCOME
                .DETONATED
        ) {
            entry.view
                .playDetonationEffect();
        }

        this.destroyEntry(
            payload.mineId,
            entry,
        );
    }

    private destroyEntry(
        mineId: string,
        entry:
            OutgoingStickyMineEntry,
    ): void {
        entry.view.destroy();

        this.mines.delete(
            mineId,
        );

        const occupiedSlotIndexes =
            this.occupiedSlotIndexesByTarget
                .get(
                    entry.targetActorId,
                );

        occupiedSlotIndexes?.delete(
            entry.slotIndex,
        );

        if (
            occupiedSlotIndexes?.size ===
            0
        ) {
            this.occupiedSlotIndexesByTarget
                .delete(
                    entry.targetActorId,
                );
        }
    }

    private findFreeSlotIndex(
        targetActorId: string,
    ): number {
        const occupiedSlotIndexes =
            this.getOccupiedSlotIndexes(
                targetActorId,
            );

        for (
            let slotIndex = 0;
            slotIndex <
            OUTGOING_STICKY_MINE_SLOT_OFFSETS
                .length;
            slotIndex += 1
        ) {
            if (
                !occupiedSlotIndexes.has(
                    slotIndex,
                )
            ) {
                return slotIndex;
            }
        }

        return -1;
    }

    private getOccupiedSlotIndexes(
        targetActorId: string,
    ): Set<number> {
        const existing =
            this.occupiedSlotIndexesByTarget
                .get(
                    targetActorId,
                );

        if (existing) {
            return existing;
        }

        const created =
            new Set<number>();

        this.occupiedSlotIndexesByTarget
            .set(
                targetActorId,
                created,
            );

        return created;
    }
}
