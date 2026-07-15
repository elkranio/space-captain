// src/engine/encounter/EncounterEngine.ts

import type { OfficerRole } from '../defs/officer';
import { resolveOfficerCommands } from './commands/resolve_officer_commands';
import { ENCOUNTER_EVENT, type EncounterEvent } from './encounter_event';
import type { EncounterState } from './encounter_state';
import { createInitialEncounterState } from './state/create_initial_encounter_state';
import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from './encounter_command';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from './objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from './objects/station/station_encounter_object';

export default class EncounterEngine {
    private readonly state: EncounterState;
    private readonly outbox: EncounterEvent[] = [];

    constructor() {
        this.state = createInitialEncounterState();

        this.outbox.push({
            type: ENCOUNTER_EVENT.ENCOUNTER_LOADED,
            state: this.state,
        });
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
                console.log('Execute HAIL command:', input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
                this.executeRequestDockingCommand(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
                console.log('Execute DOCK command:', input);
                return;
        }

        console.warn('Unhandled officer command:', input);
    }

    private canExecuteOfficerCommand(input: ExecuteOfficerCommandInput): boolean {
        const commands = resolveOfficerCommands(this.state, input.role);

        return commands.some((command) => {
            if (command.commandId !== input.commandId) {
                return false;
            }

            return command.targetId === input.targetId;
        });
    }

    private executeRequestDockingCommand(input: ExecuteOfficerCommandInput): void {
        const target = this.getTargetObject(input.targetId);

        if (!target) {
            console.warn('Cannot request docking. Target not found:', input);
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_STARTED,
                    contactName: target.station.contactName,
                    contactPortraitId: target.station.contactPortraitId,
                });

                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
                    speakerName: 'COMMS',
                    text: `This is our ship. Requesting docking clearance.`,
                });

                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
                    speakerName: target.station.contactName,
                    text: `Hold on.`,
                });

                target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;

                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
                    speakerName: target.station.contactName,
                    text: `You are cleared to dock.`,
                });

                this.outbox.push({
                    type: ENCOUNTER_EVENT.CONTACT_ENDED,
                });

                // target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;

                // console.log('Docking clearance granted:', {
                //     targetId: target.id,
                //     targetName: target.displayName,
                // });

                return;
        }

        console.warn('Cannot request docking. Invalid target:', {
            command: input,
            target,
        });
    }

    private getTargetObject(targetId?: string): EncounterObjectState | undefined {
        if (!targetId) {
            return undefined;
        }

        return this.state.objects.find((object) => object.id === targetId);
    }
}
