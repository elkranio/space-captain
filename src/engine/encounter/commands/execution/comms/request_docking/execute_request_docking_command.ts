// src/engine/encounter/commands/execution/comms/request_docking/execute_request_docking_command.ts

import { CONTACT_SEQUENCE_STEP_KIND, type ContactSequenceStep } from '../../../../contact/contact_sequence';
import type { ExecuteOfficerCommandInput } from '../../../../model/command';
import { ENCOUNTER_OBJECT_KIND } from '../../../../objects/encounter_object';
import {
    DOCKING_CLEARANCE_STATE,
    type StationEncounterObjectState,
} from '../../../../objects/station/station_encounter_object';
import { findEncounterObjectById } from '../../../../state/find_encounter_object_by_id';
import type { OfficerCommandExecutionContext } from '../../officer_command_execution_context';

// Выполняет COMMS / REQUEST DOCKING для станции.
// Команда переводит docking clearance в REQUESTED и запускает contact flow.
export function executeRequestDockingCommand(
    input: ExecuteOfficerCommandInput,
    context: OfficerCommandExecutionContext,
): void {
    const target = findEncounterObjectById(context.state, input.targetId);

    if (!target) {
        return;
    }

    switch (target.kind) {
        case ENCOUNTER_OBJECT_KIND.STATION:
            target.docking.clearance = DOCKING_CLEARANCE_STATE.REQUESTED;
            context.startContactSequence(createStationDockingRequestContactSequence(target));
            return;
    }
}

function createStationDockingRequestContactSequence(target: StationEncounterObjectState): ContactSequenceStep[] {
    return [
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
    ];
}
