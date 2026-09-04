// src/engine/encounter/commands/officer_command_handlers.ts

import { ENCOUNTER_OFFICER_COMMAND_ID, type EncounterOfficerCommandId, type OfficerCommandDef } from "../model/command";
import type { OfficerCommandHandler } from "../model/officer_command_handler";
import { clearStickyMineCommandHandler } from "./handlers/clear_sticky_mine_command_handler";
import { engineerRepairDriveCommandHandler } from "./handlers/engineer_repair_drive_command_handler";
import { engineerDeployShieldCommandHandler } from "./handlers/engineer_deploy_shield_command_handler";
import { pilotDockCommandHandler } from "./handlers/pilot_dock_command_handler";
import { pilotEvadeCommandHandler } from "./handlers/pilot_evade_command_handler";
import { pilotFlyToCommandHandler } from "./handlers/pilot_fly_to_command_handler";
import { pilotJumpCommandHandler } from "./handlers/pilot_jump_command_handler";
import { scientistPurgeSpamCommandHandler } from "./handlers/scientist_purge_spam_command_handler";
import { scientistFireSpamCommandHandler } from "./handlers/scientist_fire_spam_command_handler";
import { scientistPlotCourseCommandHandler } from "./handlers/scientist_plot_course_command_handler";
import { gunnerInterceptMissileCommandHandler } from "./handlers/gunner_defense_turret_command_handler";
import { gunnerFireMissileCommandHandler } from "./handlers/gunner_fire_missile_command_handler";
import { gunnerFireStickyMinesCommandHandler } from "./handlers/gunner_fire_sticky_mines_command_handler";
import { gunnerFireBeamCannonCommandHandler } from "./handlers/gunner_fire_beam_cannon_command_handler";

const OFFICER_COMMAND_HANDLER_BY_ID = {
    [ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE]: clearStickyMineCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PLOT_COURSE]: scientistPlotCourseCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM]: scientistPurgeSpamCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM]: scientistFireSpamCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE]: engineerRepairDriveCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD]: engineerDeployShieldCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_INTERCEPT_MISSILE]: gunnerInterceptMissileCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE]: gunnerFireMissileCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES]: gunnerFireStickyMinesCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON]: gunnerFireBeamCannonCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.PILOT_DOCK]: pilotDockCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO]: pilotFlyToCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.PILOT_JUMP]: pilotJumpCommandHandler,

    [ENCOUNTER_OFFICER_COMMAND_ID.PILOT_EVADE]: pilotEvadeCommandHandler,
} satisfies Record<EncounterOfficerCommandId, OfficerCommandHandler>;

export const OFFICER_COMMAND_HANDLERS: readonly OfficerCommandHandler[] = Object.values(OFFICER_COMMAND_HANDLER_BY_ID);

export function getOfficerCommandHandler(commandId: EncounterOfficerCommandId): OfficerCommandHandler {
    return OFFICER_COMMAND_HANDLER_BY_ID[commandId];
}

export function getOfficerCommandDef(commandId: EncounterOfficerCommandId): OfficerCommandDef {
    return getOfficerCommandHandler(commandId).def;
}
