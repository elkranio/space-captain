// src/app/scenes/game/overlay/events/GameOverlayEventBus.ts

import type { GameOverlayEventPayloadMap } from './game_overlay_event';

type GameOverlayEventKey = keyof GameOverlayEventPayloadMap;

type GameOverlayEmitArgs<TEvent extends GameOverlayEventKey> = GameOverlayEventPayloadMap[TEvent] extends undefined
    ? [event: TEvent]
    : [event: TEvent, payload: GameOverlayEventPayloadMap[TEvent]];

type GameOverlayEventCallback<TEvent extends GameOverlayEventKey> = (
    payload: GameOverlayEventPayloadMap[TEvent],
) => void;

// Scene-local typed event bus для постоянного game overlay.
export default class GameOverlayEventBus {
    private readonly emitter = new Phaser.Events.EventEmitter();

    public emit<TEvent extends GameOverlayEventKey>(...args: GameOverlayEmitArgs<TEvent>): void {
        const [event, payload] = args;

        this.emitter.emit(event as string, payload);
    }

    public on<TEvent extends GameOverlayEventKey>(
        event: TEvent,
        callback: GameOverlayEventCallback<TEvent>,
        context?: unknown,
    ): void {
        this.emitter.on(event as string, callback, context);
    }

    public off<TEvent extends GameOverlayEventKey>(
        event: TEvent,
        callback: GameOverlayEventCallback<TEvent>,
        context?: unknown,
    ): void {
        this.emitter.off(event as string, callback, context);
    }

    public destroy(): void {
        this.emitter.removeAllListeners();
    }
}
