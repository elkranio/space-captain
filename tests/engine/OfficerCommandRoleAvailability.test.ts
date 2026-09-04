// tests/engine/OfficerCommandRoleAvailability.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../src/engine/defs/officer';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type EncounterOfficerCommandId,
} from '../../src/engine/encounter/model/command';
import {
    OFFICER_COMMAND_HANDLERS,
} from '../../src/engine/encounter/commands/officer_command_handlers';

const EXPECTED_ROLE_BY_COMMAND = {
    [ENCOUNTER_OFFICER_COMMAND_ID
        .SCIENTIST_PLOT_COURSE]:
        OFFICER_ROLE.SCIENTIST,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .SCIENTIST_PURGE_SPAM]:
        OFFICER_ROLE.SCIENTIST,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .SCIENTIST_FIRE_SPAM]:
        OFFICER_ROLE.SCIENTIST,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .ENGINEER_REPAIR_DRIVE]:
        OFFICER_ROLE.ENGINEER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .ENGINEER_DEPLOY_SHIELD]:
        OFFICER_ROLE.ENGINEER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .CLEAR_STICKY_MINE]:
        OFFICER_ROLE.ENGINEER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .GUNNER_INTERCEPT_MISSILE]:
        OFFICER_ROLE.GUNNER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .GUNNER_FIRE_MISSILE]:
        OFFICER_ROLE.GUNNER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .GUNNER_FIRE_STICKY_MINES]:
        OFFICER_ROLE.GUNNER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .GUNNER_FIRE_BEAM_CANNON]:
        OFFICER_ROLE.GUNNER,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .PILOT_DOCK]:
        OFFICER_ROLE.PILOT,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .PILOT_FLY_TO]:
        OFFICER_ROLE.PILOT,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .PILOT_JUMP]:
        OFFICER_ROLE.PILOT,

    [ENCOUNTER_OFFICER_COMMAND_ID
        .PILOT_EVADE]:
        OFFICER_ROLE.PILOT,
} satisfies Record<
    EncounterOfficerCommandId,
    OfficerRole
>;

describe(
    'Officer command role availability',
    () => {
        it(
            'assigns every command to exactly one specialist role',
            () => {
                expect(
                    OFFICER_COMMAND_HANDLERS,
                ).toHaveLength(
                    Object.keys(
                        EXPECTED_ROLE_BY_COMMAND,
                    ).length,
                );

                for (
                    const handler of
                    OFFICER_COMMAND_HANDLERS
                ) {
                    expect(
                        handler.def.role,
                        handler.commandId,
                    ).toBe(
                        EXPECTED_ROLE_BY_COMMAND[
                            handler.commandId
                        ],
                    );
                }
            },
        );
    },
);
