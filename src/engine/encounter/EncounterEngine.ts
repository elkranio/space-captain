// src\engine\encounter\EncounterEngine.ts

import { SPACE_BACKGROUND_ID } from '../defs/space_background';
import { SPECIES_ID } from '../defs/species';
import StationGenerator from '../generation/station/StationGenerator';
import { ENCOUNTER_EVENT, type EncounterEvent } from './encounter_event';
import type { EncounterState } from './encounter_state';
import { ENCOUNTER_OFFICER_COMMAND_ID } from './encounter_command';
import { ENCOUNTER_OBJECT_KIND } from './objects/encounter_object';

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
}
