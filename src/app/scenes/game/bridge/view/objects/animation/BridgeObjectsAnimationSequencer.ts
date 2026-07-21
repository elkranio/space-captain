// src/app/scenes/game/bridge/view/objects/animation/BridgeObjectsAnimationSequencer.ts

import {
    BRIDGE_EVENT,
    type BridgeDockingStartedPayload,
    type BridgeEncounterArrivalStartedPayload,
} from '../../../events/bridge_event';
import { playObjectsArrivalSequence } from './arrival/play_objects_arrival_sequence';
import type { BridgeObjectsAnimationContext } from './bridge_objects_animation_context';
import { playObjectsDockingSequence } from './docking/play_objects_docking_sequence';

// View-level sequencer для animations над encounter objects на bridge viewscreen.
// Хранит active timer и routing bridge events к конкретным sequence-файлам.
export default class BridgeObjectsAnimationSequencer {
    private activeTimer?: Phaser.Time.TimerEvent;

    constructor(private readonly context: Omit<BridgeObjectsAnimationContext, 'setActiveTimer' | 'clearActiveTimer'>) {
        this.context.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.handleArrivalStarted, this);

        this.context.eventBus.on(BRIDGE_EVENT.DOCKING_STARTED, this.handleDockingStarted, this);
    }

    public stop(): void {
        this.activeTimer?.remove(false);
        this.activeTimer = undefined;
    }

    public destroy(): void {
        this.stop();

        this.context.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.handleArrivalStarted, this);

        this.context.eventBus.off(BRIDGE_EVENT.DOCKING_STARTED, this.handleDockingStarted, this);
    }

    private handleArrivalStarted(payload: BridgeEncounterArrivalStartedPayload): void {
        this.stop();

        playObjectsArrivalSequence(payload.targetId, this.createSequenceContext());
    }

    private handleDockingStarted(payload: BridgeDockingStartedPayload): void {
        this.stop();

        playObjectsDockingSequence(payload, this.createSequenceContext());
    }

    private createSequenceContext(): BridgeObjectsAnimationContext {
        return {
            ...this.context,

            setActiveTimer: (timer) => {
                this.activeTimer = timer;
            },

            clearActiveTimer: () => {
                this.activeTimer = undefined;
            },
        };
    }
}
