// src/engine/encounter/commands/handlers/comms_request_docking_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import {
    ENCOUNTER_OBJECT_TARGET_SCOPE,
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { ENCOUNTER_OBJECT_KIND } from '../../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../../objects/station/station_encounter_object';
import { createCommsRequestDockingTask } from '../../officer_tasks/create_officer_task_draft';
import { createTargetedCommand, getStationTarget, isCurrentAnchorObject } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING;

const COMMAND_DEF = {
    role: OFFICER_ROLE.COMMS,
    label: 'REQUEST DOCKING',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT,
        scope: ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const commsRequestDockingCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.objects
            .filter((object) => {
                return (
                    object.kind === ENCOUNTER_OBJECT_KIND.STATION &&
                    isCurrentAnchorObject(state, object) &&
                    object.docking.clearance === DOCKING_CLEARANCE_STATE.NONE
                );
            })
            .map((object) => {
                return createTargetedCommand(COMMAND_ID, COMMAND_DEF.label, object);
            });
    },

    execute(context, input) {
        const target = getStationTarget(context, input);

        context.startOfficerTask(createCommsRequestDockingTask(target.id));
    },
} satisfies OfficerCommandHandler;
