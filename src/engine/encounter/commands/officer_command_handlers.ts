// src/engine/encounter/commands/officer_command_handlers.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type EncounterOfficerCommandId, type OfficerCommandDef } from '../model/command';
import type { OfficerCommandHandler } from '../model/officer_command_handler';
import { clearStickyMineCommandHandler } from './handlers/clear_sticky_mine_command_handler';
import { engineerRepairDriveCommandHandler } from './handlers/engineer_repair_drive_command_handler';
import { engineerDeployShieldCommandHandler } from './handlers/engineer_deploy_shield_command_handler';
import { helmDockCommandHandler } from './handlers/helm_dock_command_handler';
import { helmEvadeCommandHandler } from './handlers/helm_evade_command_handler';
import { helmFlyToCommandHandler } from './handlers/helm_fly_to_command_handler';
import { helmJumpCommandHandler } from './handlers/helm_jump_command_handler';
import { scienceIdentifyThreatCommandHandler } from './handlers/science_identify_threat_command_handler';
import { sciencePurgeSpamCommandHandler } from './handlers/science_purge_spam_command_handler';
import { scienceFireSpamCommandHandler } from './handlers/science_fire_spam_command_handler';
import { sciencePlotCourseCommandHandler } from './handlers/science_plot_course_command_handler';
import {
    weaponsInterceptMissileCommandHandler,
} from './handlers/weapons_defense_turret_command_handler';
import {
    weaponsFireMissileCommandHandler,
} from './handlers/weapons_fire_missile_command_handler';
import {
    weaponsFireStickyMinesCommandHandler,
} from './handlers/weapons_fire_sticky_mines_command_handler';
import {
    weaponsFireBeamCannonCommandHandler,
} from './handlers/weapons_fire_beam_cannon_command_handler';

const OFFICER_COMMAND_HANDLER_BY_ID = {
    [ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE]: clearStickyMineCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE]: sciencePlotCourseCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT]: scienceIdentifyThreatCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM]: sciencePurgeSpamCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_FIRE_SPAM]:
        scienceFireSpamCommandHandler,


    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE]: engineerRepairDriveCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD]:
        engineerDeployShieldCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE]:
        weaponsInterceptMissileCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE]:
        weaponsFireMissileCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_STICKY_MINES]:
        weaponsFireStickyMinesCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_BEAM_CANNON]:
        weaponsFireBeamCannonCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK]: helmDockCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO]: helmFlyToCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP]: helmJumpCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_EVADE]: helmEvadeCommandHandler,
} satisfies Record<EncounterOfficerCommandId, OfficerCommandHandler>;

export const OFFICER_COMMAND_HANDLERS: readonly OfficerCommandHandler[] = Object.values(OFFICER_COMMAND_HANDLER_BY_ID);

export function getOfficerCommandHandler(commandId: EncounterOfficerCommandId): OfficerCommandHandler {
    return OFFICER_COMMAND_HANDLER_BY_ID[commandId];
}

export function getOfficerCommandDef(commandId: EncounterOfficerCommandId): OfficerCommandDef {
    return getOfficerCommandHandler(commandId).def;
}
