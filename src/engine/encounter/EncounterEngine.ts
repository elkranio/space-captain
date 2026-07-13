// src\engine\encounter\EncounterEngine.ts

import type { OfficerRole } from '../defs/officer';
import { resolveOfficerCommands } from './commands/resolve_officer_commands';
import { ENCOUNTER_EVENT, type EncounterEvent } from './encounter_event';
import type { EncounterState } from './encounter_state';
import { createInitialEncounterState } from './state/create_initial_encounter_state';

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
}
