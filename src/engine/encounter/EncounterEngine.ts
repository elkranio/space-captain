// src/engine/encounter/EncounterEngine.ts

import { getAvailableOfficerCommands } from './commands/get_available_officer_commands';
import {
    CONTACT_SEQUENCE_STEP_KIND,
    type ActiveContactSequence,
    type ContactSequenceStep,
} from './contact/contact_sequence';
import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from './model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from './model/event';
import type { EncounterState } from './model/state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from './objects/encounter_object';
import { DOCKING_CLEARANCE_STATE, type StationEncounterObjectState } from './objects/station/station_encounter_object';
import { createInitialEncounterState } from './state/create_initial_encounter_state';

export default class EncounterEngine {
    private readonly state: EncounterState;
    private readonly events: EncounterEvent[] = [];

    private activeContactSequence?: ActiveContactSequence;

    constructor(state: EncounterState = createInitialEncounterState()) {
        this.state = state;

        this.emit({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,
            state: this.state,
        });
    }

    public step(deltaMs: number): void {
        this.stepContactSequence(deltaMs);
    }

    public executeOfficerCommand(input: ExecuteOfficerCommandInput): void {
        if (!this.canExecuteOfficerCommand(input)) {
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

        throw new Error(`Unhandled encounter officer command: ${String(input.commandId)}`);
    }

    public requestOfficerCommands(role: ExecuteOfficerCommandInput['role']): void {
        this.emit({
            type: ENCOUNTER_EVENT.AVAILABLE_OFFICER_COMMANDS_UPDATED,
            role,
            commands: getAvailableOfficerCommands(this.state, role),
        });
    }

    public drainEvents(): EncounterEvent[] {
        const events = [...this.events];
        this.events.length = 0;

        return events;
    }

    private canExecuteOfficerCommand(input: ExecuteOfficerCommandInput): boolean {
        const commands = getAvailableOfficerCommands(this.state, input.role);

        return commands.some((command) => {
            return command.commandId === input.commandId && command.targetId === input.targetId;
        });
    }

    private executeHailCommand(input: ExecuteOfficerCommandInput): void {
        const target = this.getTargetObject(input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.startStationHailContactSequence(target);
                return;
        }
    }

    private executeRequestDockingCommand(input: ExecuteOfficerCommandInput): void {
        const target = this.getTargetObject(input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.startDockingRequestContactSequence(target);
                return;
        }
    }

    private executeDockCommand(input: ExecuteOfficerCommandInput): void {
        const target = this.getTargetObject(input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.emit({
                    type: ENCOUNTER_EVENT.DOCKING_STARTED,
                    targetId: target.id,
                });
                return;
        }
    }

    private getTargetObject(targetId: string | undefined): EncounterObjectState | undefined {
        if (!targetId) {
            return undefined;
        }

        return this.state.objects.find((object) => object.id === targetId);
    }

    private startStationHailContactSequence(target: StationEncounterObjectState): void {
        this.activeContactSequence = {
            currentStepIndex: 0,
            waitRemainingMs: 0,
            steps: [
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.START_CONTACT,
                    waitAfterMs: 800,
                    contactName: target.station.contact.name,
                    contactPortraitId: target.station.contact.portraitId,
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                    waitAfterMs: 2500,
                    speakerName: target.station.contact.name,
                    text: 'Station traffic control. State your business.',
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.END_CONTACT,
                    waitAfterMs: 1000,
                },
            ],
        };
    }

    private startDockingRequestContactSequence(target: StationEncounterObjectState): void {
        target.docking.clearance = DOCKING_CLEARANCE_STATE.REQUESTED;

        this.activeContactSequence = {
            currentStepIndex: 0,
            waitRemainingMs: 0,
            steps: [
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.START_CONTACT,
                    waitAfterMs: 1000,
                    contactName: target.station.contact.name,
                    contactPortraitId: target.station.contact.portraitId,
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                    waitAfterMs: 1000,
                    speakerName: 'COMMS',
                    text: 'This is our ship. Requesting docking clearance.',
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                    waitAfterMs: 2000,
                    speakerName: target.station.contact.name,
                    text: 'Hold on.',
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.GRANT_DOCKING_CLEARANCE,
                    waitAfterMs: 0,
                    targetId: target.id,
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
                    waitAfterMs: 1200,
                    speakerName: target.station.contact.name,
                    text: 'You are cleared to dock.',
                },
                {
                    kind: CONTACT_SEQUENCE_STEP_KIND.END_CONTACT,
                    waitAfterMs: 0,
                },
            ],
        };
    }

    private stepContactSequence(deltaMs: number): void {
        if (!this.activeContactSequence) {
            return;
        }

        this.activeContactSequence.waitRemainingMs -= deltaMs;

        if (this.activeContactSequence.waitRemainingMs > 0) {
            return;
        }

        this.processCurrentContactStep();
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

        if (this.activeContactSequence.currentStepIndex >= this.activeContactSequence.steps.length) {
            this.activeContactSequence = undefined;
            return;
        }

        this.activeContactSequence.waitRemainingMs += step.waitAfterMs;
    }

    private executeContactStep(step: ContactSequenceStep): void {
        switch (step.kind) {
            case CONTACT_SEQUENCE_STEP_KIND.START_CONTACT:
                this.emit({
                    type: ENCOUNTER_EVENT.CONTACT_STARTED,
                    contactName: step.contactName,
                    contactPortraitId: step.contactPortraitId,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.MESSAGE:
                this.emit({
                    type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
                    speakerName: step.speakerName,
                    text: step.text,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.END_CONTACT:
                this.emit({
                    type: ENCOUNTER_EVENT.CONTACT_ENDED,
                });
                return;

            case CONTACT_SEQUENCE_STEP_KIND.GRANT_DOCKING_CLEARANCE:
                this.grantDockingClearance(step.targetId);
                return;
        }

        throw new Error(`Unhandled contact sequence step: ${String(step)}`);
    }

    private grantDockingClearance(targetId: string): void {
        const target = this.getTargetObject(targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;
                return;
        }
    }

    private emit(event: EncounterEvent): void {
        this.events.push(event);
    }
}
