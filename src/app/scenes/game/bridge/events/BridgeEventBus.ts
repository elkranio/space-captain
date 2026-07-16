// src/app/scenes/game/bridge/events/BridgeEventBus.ts

import type { BridgeEventPayloadMap } from './bridge_event';

type BridgeEventKey = keyof BridgeEventPayloadMap;

type BridgeEmitArgs<TEvent extends BridgeEventKey> = BridgeEventPayloadMap[TEvent] extends undefined
    ? [event: TEvent]
    : [event: TEvent, payload: BridgeEventPayloadMap[TEvent]];

type BridgeEventCallback<TEvent extends BridgeEventKey> = (payload: BridgeEventPayloadMap[TEvent]) => void;

// Scene-local typed event bus для BridgeScene.
// Это тонкая обёртка над Phaser EventEmitter: типизирует bridge events и чистит listeners на destroy.
export default class BridgeEventBus {
    private readonly emitter = new Phaser.Events.EventEmitter();

    public emit<TEvent extends BridgeEventKey>(...args: BridgeEmitArgs<TEvent>): void {
        const [event, payload] = args;

        this.emitter.emit(event as string, payload);
    }

    public on<TEvent extends BridgeEventKey>(
        event: TEvent,
        callback: BridgeEventCallback<TEvent>,
        context?: unknown,
    ): void {
        this.emitter.on(event as string, callback, context);
    }

    public off<TEvent extends BridgeEventKey>(
        event: TEvent,
        callback: BridgeEventCallback<TEvent>,
        context?: unknown,
    ): void {
        this.emitter.off(event as string, callback, context);
    }

    public destroy(): void {
        this.emitter.removeAllListeners();
    }
}
