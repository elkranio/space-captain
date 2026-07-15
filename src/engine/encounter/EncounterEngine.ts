// src/engine/encounter/EncounterEngine.ts

import type { OfficerRole } from '../defs/officer';
import { resolveOfficerCommands } from './commands/resolve_officer_commands';
import {
    CONTACT_SEQUENCE_STEP_KIND,
    type ActiveContactSequence,
    type ContactSequenceStep,
} from './contact/contact_sequence';
import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from './encounter_command';
import { ENCOUNTER_EVENT, type EncounterEvent } from './encounter_event';
import type { EncounterState } from './encounter_state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from './objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from './objects/station/station_encounter_object';
import { createInitialEncounterState } from './state/create_initial_encounter_state';

export default class EncounterEngine {
    // #region Fields
    private readonly state: EncounterState;
    private readonly outbox: EncounterEvent[] = [];

    private activeContactSequence?: ActiveContactSequence;
    // #endregion

    // #region Lifecycle
    constructor() {
        this.state = createInitialEncounterState();

        this.outbox.push({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,
            state: this.state,
        });
    }
    // #endregion

    // #region Public API
    public step(deltaMs: number): void {
        this.stepContactSequence(deltaMs);
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.outbox];

        this.outbox.length = 0;

        return events;
    }

    public requestOfficerCommands(role: OfficerRole): void {
        this.outbox.push({
            type: ENCOUNTER_EVENT.OFFICER_COMMANDS_READY,
            role,
            commands: resolveOfficerCommands(this.state, role),
        });
    }

    public executeOfficerCommand(input: ExecuteOfficerCommandInput): void {
        if (!this.canExecuteOfficerCommand(input)) {
            console.warn('Cannot execute officer command:', input);
            return;
        }

        switch (input.commandId) {
            case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
                this.executeHailCommand(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
                this.executeRequestDockingCommand(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
                this.executeDockCommand(input);
                return;
        }

        console.warn('Unhandled officer command:', input);
    }
    // #endregion

    // #region Officer command execution
    private canExecuteOfficerCommand(input: ExecuteOfficerCommandInput): boolean {
        const commands = resolveOfficerCommands(this.state, input.role);

        return commands.some((command) => {
            if (command.commandId !== input.commandId) {
                return false;
            }

            return command.targetId === input.targetId;
        });
    }

    private executeHailCommand(input: ExecuteOfficerCommandInput): void {
        console.log('Execute HAIL command:', input);
    }

    private executeRequestDockingCommand(input: ExecuteOfficerCommandInput): void {
        const target = this.getTargetObject(input.targetId);

        if (!target) {
            console.warn('Cannot request docking. Target not found:', input);
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.startDockingRequestContactSequence(target);
                return;
        }

        console.warn('Cannot request docking. Invalid target:', {
            command: input,
            target,
        });
    }

    private executeDockCommand(input: ExecuteOfficerCommandInput): void {
        const target = this.getTargetObject(input.targetId);

        if (!target) {
            console.warn('Cannot dock. Target not found:', input);
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.outbox.push({
                    type: ENCOUNTER_EVENT.DOCKING_STARTED,
                    targetId: target.id,
                });
                return;
        }

        console.warn('Cannot dock. Invalid target:', {
            command: input,
            target,
        });
    }
    // #endregion

    // #region Contact sequence
    private stepContactSequence(deltaMs: number): void {
        if (!this.activeContactSequence) {
            return;
        }

        this.activeContactSequence.waitRemainingMs -= deltaMs;

        while (this.activeContactSequence && this.activeContactSequence.waitRemainingMs <= 0) {
            this.processCurrentContactStep();
        }
    }

    private processCurrentContactStep(): void {
        if (!this.activeContactSequence) {
            return;
        }

        const step = this.activeContactSequence.steps[this.activeContactSequence.currentStepIndex];

        if (!step) {
            this.activeContactSequence = undefined;
            return;
        }

        this.executeContactStep(step);
        this.activeContactSequence.currentStepIndex += 1;

        if (this.isContactSequenceFinished()) {
            this.activeContactSequence = undefined;
            return;
        }

        this.activeContactSequence.waitRemainingMs += step.waitAfterMs;
    }

    private executeContactStep(step: ContactSequenceStep): void {
        switch (step.kind) {
            case CONTACT_SEQUENCE_STEP_KIND.START_CONTACT:
                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_STARTED,
                    contactName: step.contactName,
                    contactPortraitId: step.contactPortraitId,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.MESSAGE:
                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
                    speakerName: step.speakerName,
                    text: step.text,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.GRANT_DOCKING_CLEARANCE:
                this.grantDockingClearance(step.targetId);
                return;

            case CONTACT_SEQUENCE_STEP_KIND.END_CONTACT:
                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_ENDED,
                });
                return;
        }

        throw new Error(`Unhandled contact sequence step: ${String(step)}`);
    }

    private startDockingRequestContactSequence(target: EncounterObjectState): void {
        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                target.docking.clearance = DOCKING_CLEARANCE_STATE.REQUESTED;

                this.activeContactSequence = {
                    currentStepIndex: 0,
                    waitRemainingMs: 0,
                    steps: [
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.START_CONTACT,
                            waitAfterMs: 1000,
                            contactName: target.station.contactName,
                            contactPortraitId: target.station.contactPortraitId,
                        },
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                            waitAfterMs: 2000,
                            speakerName: 'COMMS',
                            text: 'This is SS Anonymous. Requesting docking clearance.',
                        },
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                            waitAfterMs: 2000,
                            speakerName: target.station.contactName,
                            text: 'Hold on.',
                        },
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.GRANT_DOCKING_CLEARANCE,
                            waitAfterMs: 2000,
                            targetId: target.id,
                        },
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                            waitAfterMs: 2000,
                            speakerName: target.station.contactName,
                            text: 'You are cleared to dock.',
                        },
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                            waitAfterMs: 2000,
                            speakerName: 'COMMS',
                            text: 'Thank you. Over and out.',
                        },
                        {
                            kind: CONTACT_SEQUENCE_STEP_KIND.END_CONTACT,
                            waitAfterMs: 100,
                        },
                    ],
                };

                return;
        }
    }
    // #endregion

    // #region Docking
    private grantDockingClearance(targetId: string): void {
        const target = this.getTargetObject(targetId);

        if (!target) {
            console.warn('Cannot grant docking clearance. Target not found:', {
                targetId,
            });
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;
                return;
        }

        console.warn('Cannot grant docking clearance. Invalid target:', target);
    }
    // #endregion

    // #region Queries
    private getTargetObject(targetId?: string): EncounterObjectState | undefined {
        if (!targetId) {
            return undefined;
        }

        return this.state.objects.find((object) => object.id === targetId);
    }
    // #endregion

    private isContactSequenceFinished(): boolean {
        if (!this.activeContactSequence) {
            return true;
        }

        return this.activeContactSequence.currentStepIndex >= this.activeContactSequence.steps.length;
    }
}
