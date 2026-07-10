// src\app\scenes\game\bridge\events\BridgeEventBus.ts

import type { BridgeEventPayloadMap } from './bridge_event';

export default class BridgeEventBus {
    private readonly emitter = new Phaser.Events.EventEmitter();

    public emit<TEvent extends keyof BridgeEventPayloadMap>(
        event: TEvent,
        payload: BridgeEventPayloadMap[TEvent],
    ): void {
        this.emitter.emit(event as string, payload);
    }

    public on<TEvent extends keyof BridgeEventPayloadMap>(
        event: TEvent,
        callback: (payload: BridgeEventPayloadMap[TEvent]) => void,
        context?: unknown,
    ): void {
        this.emitter.on(event as string, callback, context);
    }

    public off<TEvent extends keyof BridgeEventPayloadMap>(
        event: TEvent,
        callback: (payload: BridgeEventPayloadMap[TEvent]) => void,
        context?: unknown,
    ): void {
        this.emitter.off(event as string, callback, context);
    }

    public destroy(): void {
        this.emitter.removeAllListeners();
    }
}
