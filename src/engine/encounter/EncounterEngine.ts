// src\engine\encounter\EncounterEngine.ts

import { SPACE_BACKGROUND_ID } from '../defs/space_background';
import { SPECIES_ID } from '../defs/species';
import StationGenerator from '../generation/station/StationGenerator';
import { ENCOUNTER_EVENT, type EncounterEvent } from './encounter_event';
import type { EncounterState } from './encounter_state';
import { OFFICER_ROLE, type OfficerRole } from '../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID, type EncounterOfficerCommand } from './encounter_command';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from './objects/encounter_object';

export default class EncounterEngine {
    private readonly state: EncounterState;
    private readonly outbox: EncounterEvent[] = [];

    constructor() {
        this.state = this.createInitialState();

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

    private createInitialState(): EncounterState {
        const station = StationGenerator.generateStation(SPECIES_ID.HUMAN);

        return {
            spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,
            objects: [
                {
                    id: station.id,
                    kind: ENCOUNTER_OBJECT_KIND.STATION,
                    station,
                    position: {
                        x: 0.1,
                        y: -0.05,
                    },
                    supportedCommandIds: [ENCOUNTER_OFFICER_COMMAND_ID.HAIL],
                },
            ],
        };
    }

    public requestOfficerCommands(role: OfficerRole): void {
        this.outbox.push({
            type: ENCOUNTER_EVENT.OFFICER_COMMANDS_READY,
            role,
            commands: this.getOfficerCommands(role),
        });
    }

    private getOfficerCommands(role: OfficerRole): EncounterOfficerCommand[] {
        const commands: EncounterOfficerCommand[] = [];

        for (const object of this.state.objects) {
            commands.push(...this.getOfficerCommandsForObject(role, object));
        }

        return commands;
    }

    private getOfficerCommandsForObject(role: OfficerRole, object: EncounterObjectState): EncounterOfficerCommand[] {
        if (role !== OFFICER_ROLE.COMMS) {
            return [];
        }

        if (!object.supportedCommandIds.includes(ENCOUNTER_OFFICER_COMMAND_ID.HAIL)) {
            return [];
        }

        switch (object.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                return [
                    {
                        commandId: ENCOUNTER_OFFICER_COMMAND_ID.HAIL,
                        label: `Hail ${object.station.name}`,
                        targetId: object.id,
                    },
                ];

            default:
                throw new Error(`Unhandled encounter object kind: ${String(object.kind)}`);
        }
    }
}
