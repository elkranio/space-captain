// src/engine/encounter/commands/OfficerCommandExecutor.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import {
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_REJECTION_REASON,
    type ExecuteOfficerCommandInput,
    type ExecuteOfficerCommandResult,
} from '../model/command';
import type { OfficerCommandExecutionContext, OfficerCommandHandler } from '../model/officer_command_handler';
import EncounterStateStore from '../state/EncounterStateStore';
import { getOfficerCommandHandler } from './officer_command_handlers';
import { getAvailableOfficerCommands } from './queries/get_available_officer_commands';

type OfficerCommandExecutorOptions = OfficerCommandExecutionContext;

const OFFICER_ROLES = Object.values(OFFICER_ROLE);

export default class OfficerCommandExecutor {
    private readonly stateStore: EncounterStateStore;

    private readonly executionContext: OfficerCommandExecutionContext;

    constructor(options: OfficerCommandExecutorOptions) {
        this.stateStore = options.stateStore;
        this.executionContext = options;
    }

    // #region Public API

    public execute(input: ExecuteOfficerCommandInput): ExecuteOfficerCommandResult {
        const handler = getOfficerCommandHandler(input.commandId);

        if (!this.isCommandAvailable(handler, input)) {
            return {
                status: OFFICER_COMMAND_EXECUTION_STATUS.REJECTED,
                reason: OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE,
            };
        }

        const busyRoles = this.getBusyRolesBlockingCommand(handler);

        if (busyRoles.length > 0) {
            return {
                status: OFFICER_COMMAND_EXECUTION_STATUS.REJECTED,
                reason: OFFICER_COMMAND_REJECTION_REASON.OFFICERS_BUSY,
                busyRoles,
            };
        }

        handler.execute(this.executionContext, input);

        return {
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        };
    }

    // #endregion

    // #region Command validation

    private isCommandAvailable(handler: OfficerCommandHandler, input: ExecuteOfficerCommandInput): boolean {
        if (handler.def.role !== input.role) {
            return false;
        }

        if (handler.isInputValid && !handler.isInputValid(input)) {
            return false;
        }

        const commands = getAvailableOfficerCommands(this.stateStore.getState(), input.role);

        return commands.some((command) => {
            return command.commandId === input.commandId && command.targetId === input.targetId;
        });
    }

    private getBusyRolesBlockingCommand(handler: OfficerCommandHandler): OfficerRole[] {
        if (!handler.def.requiresIdleBridge) {
            return [];
        }

        return OFFICER_ROLES.filter((role) => {
            return this.stateStore.getOfficerTask(role) !== undefined;
        });
    }

    // #endregion
}
