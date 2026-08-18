// src/app/scenes/game/bridge/view/combat/spam/bridge_spam_layout.ts

import { BRIDGE_VIEWSCREEN_RECT } from "../../bridge_viewscreen_layout";

export type BridgeSpamLayoutSlot = {
    x: number;
    y: number;
};

export const BRIDGE_SPAM_PRESENTATION = {
    maxVisible: 6,

    spawnDelayMinMs: 650,
    spawnDelayMaxMs: 850,

    appearDurationMs: 170,
    hideDurationMs: 120,

    purgeCloseStaggerMs: 65,
    expiredCloseStaggerMs: 240,

    baseAlpha: 0.9,

    flickerAmplitude: 0.05,
    flickerFrameMs: 110,

    positionJitterX: 28,
    positionJitterY: 16,
} as const;

// Не сетка, а заранее подобранный набор областей.
// Bag не повторяет slot, пока не переберёт весь набор.
// Небольшой jitter не даёт композиции выглядеть зафиксированной.
export const BRIDGE_SPAM_LAYOUT_SLOTS: readonly BridgeSpamLayoutSlot[] = [
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 170,
        y: BRIDGE_VIEWSCREEN_RECT.y + 80,
    },
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 420,
        y: BRIDGE_VIEWSCREEN_RECT.y + 70,
    },
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 670,
        y: BRIDGE_VIEWSCREEN_RECT.y + 90,
    },
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 150,
        y: BRIDGE_VIEWSCREEN_RECT.y + 175,
    },
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 390,
        y: BRIDGE_VIEWSCREEN_RECT.y + 165,
    },
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 650,
        y: BRIDGE_VIEWSCREEN_RECT.y + 170,
    },
    {
        x: BRIDGE_VIEWSCREEN_RECT.x + 510,
        y: BRIDGE_VIEWSCREEN_RECT.y + 145,
    },
];

export function takeRandomBagItem<T>(source: readonly T[], bag: T[]): T {
    if (source.length === 0) {
        throw new Error("Random bag source must not be empty");
    }

    if (bag.length === 0) {
        bag.push(...source);
    }

    const index = Phaser.Math.Between(0, bag.length - 1);

    const item = bag.splice(index, 1)[0];

    if (item === undefined) {
        throw new Error("Random bag item was not found");
    }

    return item;
}

export function createSpamPopupPosition(slot: BridgeSpamLayoutSlot): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        slot.x +
            Phaser.Math.Between(-BRIDGE_SPAM_PRESENTATION.positionJitterX, BRIDGE_SPAM_PRESENTATION.positionJitterX),

        slot.y +
            Phaser.Math.Between(-BRIDGE_SPAM_PRESENTATION.positionJitterY, BRIDGE_SPAM_PRESENTATION.positionJitterY),
    );
}
