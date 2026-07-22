// src/engine/encounter/contact/ContactSequenceRunner.ts

import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import { CONTACT_SEQUENCE_STEP_KIND, type ActiveContactSequence, type ContactSequenceStep } from './contact_sequence';

export type ContactSequenceRunnerContext = {
    emit: (event: EncounterEvent) => void;
};

export default class ContactSequenceRunner {
    private activeSequence?: ActiveContactSequence;

    private onContactEnded?: () => void;

    constructor(private readonly context: ContactSequenceRunnerContext) {}

    // #region Public API

    public start = (steps: ContactSequenceStep[], onContactEnded?: () => void): void => {
        this.activeSequence = {
            steps,
            currentStepIndex: 0,
            waitRemainingMs: 0,
        };

        this.onContactEnded = onContactEnded;
    };

    public step(deltaMs: number): void {
        if (!this.activeSequence) {
            return;
        }

        this.activeSequence.waitRemainingMs -= deltaMs;

        if (this.activeSequence.waitRemainingMs > 0) {
            return;
        }

        this.processCurrentStep();
    }

    // #endregion

    // #region Sequence processing

    private processCurrentStep(): void {
        if (!this.activeSequence) {
            return;
        }

        const step = this.activeSequence.steps[this.activeSequence.currentStepIndex];

        if (!step) {
            this.clearSequence();
            return;
        }

        this.executeStep(step);

        this.activeSequence.currentStepIndex += 1;

        if (this.activeSequence.currentStepIndex >= this.activeSequence.steps.length) {
            this.clearSequence();
            return;
        }

        this.activeSequence.waitRemainingMs += step.waitAfterMs;
    }

    private executeStep(step: ContactSequenceStep): void {
        switch (step.kind) {
            case CONTACT_SEQUENCE_STEP_KIND.START_CONTACT:
                this.context.emit({
                    type: ENCOUNTER_EVENT.CONTACT_STARTED,
                    contactName: step.contactName,
                    contactPortraitId: step.contactPortraitId,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.MESSAGE:
                this.context.emit({
                    type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
                    speakerName: step.speakerName,
                    text: step.text,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.END_CONTACT:
                this.context.emit({
                    type: ENCOUNTER_EVENT.CONTACT_ENDED,
                });

                this.onContactEnded?.();
                this.onContactEnded = undefined;
                return;

            default:
                throw new Error(`Unhandled contact sequence step: ${String(step)}`);
        }
    }

    private clearSequence(): void {
        this.activeSequence = undefined;
        this.onContactEnded = undefined;
    }

    // #endregion
}
