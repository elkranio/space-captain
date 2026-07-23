// src/app/scenes/game/bridge/view/objects/animation/BridgeObjectsAnimationSequencer.ts

import {
    BRIDGE_EVENT,
    type BridgeDockingStartedPayload,
    type BridgeEncounterArrivalStartedPayload,
    type BridgeEncounterTravelStartedPayload,
} from '../../../events/bridge_event';
import { playObjectsArrivalSequence } from './arrival/play_objects_arrival_sequence';
import type { BridgeObjectsAnimationContext } from './bridge_objects_animation_context';
import { playObjectsDockingSequence } from './docking/play_objects_docking_sequence';
import { playObjectsTravelSequence } from './travel/play_objects_travel_sequence';

type SequencerContext = Omit<
    BridgeObjectsAnimationContext,
    'getCameraYawDegrees' | 'setCameraYawDegrees' | 'setActiveTimer' | 'clearActiveTimer'
>;

// View-level sequencer animations
// над encounter presentation на bridge viewscreen.
//
// Хранит:
// - active timer;
// - transient camera yaw на время жизни Bridge Scene;
// - routing bridge events к конкретным sequences.
export default class BridgeObjectsAnimationSequencer {
    private activeTimer?: Phaser.Time.TimerEvent;

    private cameraYawDegrees?: number;

    constructor(private readonly context: SequencerContext) {
        this.context.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.handleArrivalStarted, this);

        this.context.eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, this.handleTravelStarted, this);

        this.context.eventBus.on(BRIDGE_EVENT.DOCKING_STARTED, this.handleDockingStarted, this);
    }

    public stop(): void {
        this.activeTimer?.remove(false);
        this.activeTimer = undefined;
    }

    public destroy(): void {
        this.stop();

        this.context.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.handleArrivalStarted, this);

        this.context.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, this.handleTravelStarted, this);

        this.context.eventBus.off(BRIDGE_EVENT.DOCKING_STARTED, this.handleDockingStarted, this);
    }

    private handleArrivalStarted(payload: BridgeEncounterArrivalStartedPayload): void {
        this.stop();

        playObjectsArrivalSequence(payload.targetId, this.createSequenceContext());
    }

    private handleTravelStarted(payload: BridgeEncounterTravelStartedPayload): void {
        this.stop();

        playObjectsTravelSequence(payload, this.createSequenceContext());
    }

    private handleDockingStarted(payload: BridgeDockingStartedPayload): void {
        this.stop();

        playObjectsDockingSequence(payload, this.createSequenceContext());
    }

    private createSequenceContext(): BridgeObjectsAnimationContext {
        return {
            ...this.context,

            getCameraYawDegrees: () => {
                return this.cameraYawDegrees;
            },

            setCameraYawDegrees: (yawDegrees) => {
                this.cameraYawDegrees = yawDegrees;
            },

            setActiveTimer: (timer) => {
                this.activeTimer = timer;
            },

            clearActiveTimer: () => {
                this.activeTimer = undefined;
            },
        };
    }
}
