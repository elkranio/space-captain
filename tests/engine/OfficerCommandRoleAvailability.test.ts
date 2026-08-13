// tests/engine/OfficerCommandRoleAvailability.test.ts

import { describe, expect, it } from 'vitest';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../src/engine/encounter/model/command';
import {
    OFFICER_COMMAND_HANDLERS,
    getOfficerCommandHandler,
} from '../../src/engine/encounter/commands/officer_command_handlers';

describe('Officer command role availability', () => {
    it('keeps existing commands limited to their specialist roles', () => {
        expect(
            getOfficerCommandHandler(
                ENCOUNTER_OFFICER_COMMAND_ID
                    .SCIENCE_IDENTIFY_THREAT,
            ).def.availableToRoles,
        ).toEqual([
            OFFICER_ROLE.SCIENCE,
        ]);

        expect(
            getOfficerCommandHandler(
                ENCOUNTER_OFFICER_COMMAND_ID
                    .ENGINEER_REPAIR_DRIVE,
            ).def.availableToRoles,
        ).toEqual([
            OFFICER_ROLE.ENGINEER,
        ]);

        expect(
            getOfficerCommandHandler(
                ENCOUNTER_OFFICER_COMMAND_ID
                    .WEAPONS_FIRE_SIGNATURE_A,
            ).def.availableToRoles,
        ).toEqual([
            OFFICER_ROLE.WEAPONS,
        ]);

        expect(
            getOfficerCommandHandler(
                ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,
            ).def.availableToRoles,
        ).toEqual([
            OFFICER_ROLE.HELM,
        ]);
    });

    it('requires every command to declare unique available roles', () => {
        for (const handler of OFFICER_COMMAND_HANDLERS) {
            const roles = handler.def.availableToRoles;

            expect(
                roles.length,
                handler.commandId,
            ).toBeGreaterThan(0);

            expect(
                new Set(roles).size,
                handler.commandId,
            ).toBe(roles.length);
        }
    });
});
