// src/engine/encounter/contact/ContactSequenceRunner.ts

import { CONTACT_SEQUENCE_STEP_KIND, type ActiveContactSequence, type ContactSequenceStep } from './contact_sequence';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';
import { grantDockingClearance } from '../state/grant_docking_clearance';

export type ContactSequenceRunnerContext = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
};

// Runtime-runner для активной contact sequence.
// Хранит текущий шаг, задержку между шагами и применяет эффекты contact step-ов.
export default class ContactSequenceRunner {
    private activeSequence?: ActiveContactSequence;

    constructor(private readonly context: ContactSequenceRunnerContext) {}

    public start = (steps: ContactSequenceStep[]): void => {
        this.activeSequence = {
            steps,
            currentStepIndex: 0,
            waitRemainingMs: 0,
        };
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

    private processCurrentStep(): void {
        if (!this.activeSequence) {
            return;
        }

        const step = this.activeSequence.steps[this.activeSequence.currentStepIndex];

        if (!step) {
            this.activeSequence = undefined;
            return;
        }

        this.executeStep(step);

        this.activeSequence.currentStepIndex += 1;

        if (this.activeSequence.currentStepIndex >= this.activeSequence.steps.length) {
            this.activeSequence = undefined;
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
                return;

            case CONTACT_SEQUENCE_STEP_KIND.GRANT_DOCKING_CLEARANCE:
                grantDockingClearance(this.context.state, step.targetId);
                return;
        }

        throw new Error(`Unhandled contact sequence step: ${String(step)}`);
    }
}
