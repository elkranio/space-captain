// src/engine/encounter/commands/execution/comms/hail/execute_hail_command.ts

import { CONTACT_SEQUENCE_STEP_KIND, type ContactSequenceStep } from '../../../../contact/contact_sequence';
import type { ExecuteOfficerCommandInput } from '../../../../model/command';
import { ENCOUNTER_OBJECT_KIND } from '../../../../objects/encounter_object';
import type { StationEncounterObjectState } from '../../../../objects/station/station_encounter_object';
import { findEncounterObjectById } from '../../../../state/find_encounter_object_by_id';
import type { OfficerCommandExecutionContext } from '../../officer_command_execution_context';

// Выполняет COMMS / HAIL для выбранного encounter object.
// Команда запускает короткий contact flow с внешним собеседником.
export function executeHailCommand(input: ExecuteOfficerCommandInput, context: OfficerCommandExecutionContext): void {
    const target = findEncounterObjectById(context.state, input.targetId);

    if (!target) {
        return;
    }

    switch (target.kind) {
        case ENCOUNTER_OBJECT_KIND.STATION:
            context.startContactSequence(createStationHailContactSequence(target));
            return;
    }
}

function createStationHailContactSequence(target: StationEncounterObjectState): ContactSequenceStep[] {
    return [
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
            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
            waitAfterMs: 2500,
            speakerName: 'COMMS',
            text: "Hey beautiful. How's it going?",
        },
        {
            kind: CONTACT_SEQUENCE_STEP_KIND.MESSAGE,
            waitAfterMs: 2000,
            speakerName: target.station.contact.name,
            text: 'Ugh...',
        },

        {
            kind: CONTACT_SEQUENCE_STEP_KIND.END_CONTACT,
            waitAfterMs: 1000,
        },
    ];
}
