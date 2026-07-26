// src/engine/encounter/commands/handlers/comms_request_docking_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import {
    ENCOUNTER_ANCHOR_TARGET_SCOPE,
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { ENCOUNTER_ANCHOR_KIND } from '../../anchors/encounter_anchor';
import { DOCKING_CLEARANCE_STATE } from '../../anchors/station/station_encounter_anchor';
import { createCommsRequestDockingTask } from '../../officer_tasks/create_officer_task_draft';
import { createAnchorTargetedCommand, getStationTarget, isCurrentAnchor } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING;

const COMMAND_DEF = {
    role: OFFICER_ROLE.COMMS,
    label: 'REQUEST DOCKING',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,
        scope: ENCOUNTER_ANCHOR_TARGET_SCOPE.CURRENT_ANCHOR,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const commsRequestDockingCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.anchors
            .filter((object) => {
                return (
                    object.kind === ENCOUNTER_ANCHOR_KIND.STATION &&
                    isCurrentAnchor(state, object) &&
                    object.docking.clearance === DOCKING_CLEARANCE_STATE.NONE
                );
            })
            .map((object) => {
                return createAnchorTargetedCommand(COMMAND_ID, COMMAND_DEF.label, object);
            });
    },

    execute(context, input) {
        const target = getStationTarget(context, input);

        context.startOfficerTask(createCommsRequestDockingTask(target.id));
    },
} satisfies OfficerCommandHandler;
