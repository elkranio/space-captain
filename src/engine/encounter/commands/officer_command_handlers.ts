// src/engine/encounter/commands/officer_command_handlers.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type EncounterOfficerCommandId, type OfficerCommandDef } from '../model/command';
import type { OfficerCommandHandler } from '../model/officer_command_handler';
import { commsHailCommandHandler } from './handlers/comms_hail_command_handler';
import { commsRequestDockingCommandHandler } from './handlers/comms_request_docking_command_handler';
import {
    engineerDeployShieldCenterCommandHandler,
    engineerDeployShieldLeftCommandHandler,
    engineerDeployShieldRightCommandHandler,
} from './handlers/engineer_deploy_shield_command_handler';
import { helmDockCommandHandler } from './handlers/helm_dock_command_handler';
import { helmFlyToCommandHandler } from './handlers/helm_fly_to_command_handler';
import { helmJumpCommandHandler } from './handlers/helm_jump_command_handler';
import { scienceIdentifyThreatCommandHandler } from './handlers/science_identify_threat_command_handler';
import { sciencePurgeSpamCommandHandler } from './handlers/science_purge_spam_command_handler';
import { sciencePlotCourseCommandHandler } from './handlers/science_plot_course_command_handler';
import {
    weaponsFireBlueBeamCommandHandler,
    weaponsFireRedBeamCommandHandler,
} from './handlers/weapons_point_defense_command_handler';

const OFFICER_COMMAND_HANDLER_BY_ID = {
    [ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL]: commsHailCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING]: commsRequestDockingCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE]: sciencePlotCourseCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT]: scienceIdentifyThreatCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM]: sciencePurgeSpamCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_LEFT]: engineerDeployShieldLeftCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER]: engineerDeployShieldCenterCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_RIGHT]: engineerDeployShieldRightCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM]: weaponsFireRedBeamCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BLUE_BEAM]: weaponsFireBlueBeamCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK]: helmDockCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO]: helmFlyToCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP]: helmJumpCommandHandler,
} satisfies Record<EncounterOfficerCommandId, OfficerCommandHandler>;

export const OFFICER_COMMAND_HANDLERS: readonly OfficerCommandHandler[] = Object.values(OFFICER_COMMAND_HANDLER_BY_ID);

export function getOfficerCommandHandler(commandId: EncounterOfficerCommandId): OfficerCommandHandler {
    return OFFICER_COMMAND_HANDLER_BY_ID[commandId];
}

export function getOfficerCommandDef(commandId: EncounterOfficerCommandId): OfficerCommandDef {
    return getOfficerCommandHandler(commandId).def;
}
