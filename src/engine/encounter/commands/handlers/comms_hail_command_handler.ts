// src/engine/encounter/commands/handlers/comms_hail_command_handler.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { createStationHailSequence } from '../../contact/sequences/create_station_hail_sequence';
import {
    ENCOUNTER_OBJECT_TARGET_SCOPE,
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { ENCOUNTER_OBJECT_KIND } from '../../objects/encounter_object';
import { createCommsHailTask } from '../../officer_tasks/create_officer_task_draft';
import { createTargetedCommand, getStationTarget, isCurrentAnchorObject } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL;

const COMMAND_DEF = {
    role: OFFICER_ROLE.COMMS,
    label: 'HAIL',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ENCOUNTER_OBJECT,
        scope: ENCOUNTER_OBJECT_TARGET_SCOPE.CURRENT_ANCHOR,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const commsHailCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return state.anchors
            .filter((object) => {
                return object.kind === ENCOUNTER_OBJECT_KIND.STATION && isCurrentAnchorObject(state, object);
            })
            .map((object) => {
                return createTargetedCommand(COMMAND_ID, COMMAND_DEF.label, object);
            });
    },

    execute(context, input) {
        const target = getStationTarget(context, input);

        const taskId = context.startOfficerTask(createCommsHailTask(target.id));

        context.startContactSequence(createStationHailSequence(target), () => {
            context.completeOfficerTask(taskId);
        });
    },
} satisfies OfficerCommandHandler;
