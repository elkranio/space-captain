// src/engine/encounter/commands/OfficerCommandExecutor.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import {
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_REJECTION_REASON,
    OFFICER_COMMAND_TARGET_KIND,
    type ExecuteOfficerCommandInput,
    type ExecuteOfficerCommandResult,
    type OfficerCommandTarget,
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

        if (handler.def.targeting.kind !== input.target.kind) {
            return false;
        }

        const availableCommands = getAvailableOfficerCommands(this.stateStore.getState(), input.role).filter(
            (command) => {
                return command.commandId === input.commandId;
            },
        );

        if (availableCommands.length === 0) {
            return false;
        }

        // Destination PLOT COURSE пока выбирается
        // app-слоем перед execution.
        //
        // Encounter проверяет доступность самой команды
        // и правильный typed target kind.
        if (input.target.kind === OFFICER_COMMAND_TARGET_KIND.SPACE_NODE) {
            return true;
        }

        return availableCommands.some((command) => {
            return this.areTargetsEqual(command.target, input.target);
        });
    }

    private areTargetsEqual(availableTarget: OfficerCommandTarget, inputTarget: OfficerCommandTarget): boolean {
        switch (availableTarget.kind) {
            case OFFICER_COMMAND_TARGET_KIND.NONE:
                return inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.NONE;

            case OFFICER_COMMAND_TARGET_KIND.ANCHOR:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.ANCHOR &&
                    availableTarget.anchorId === inputTarget.anchorId
                );

            case OFFICER_COMMAND_TARGET_KIND.ACTOR:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.ACTOR &&
                    availableTarget.actorId === inputTarget.actorId
                );

            case OFFICER_COMMAND_TARGET_KIND.SPACE_NODE:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.SPACE_NODE &&
                    availableTarget.nodeId === inputTarget.nodeId
                );

            default:
                return this.assertNever(availableTarget);
        }
    }

    private getBusyRolesBlockingCommand(handler: OfficerCommandHandler): OfficerRole[] {
        if (!handler.def.requiresIdleBridge) {
            return [];
        }

        return OFFICER_ROLES.filter((role) => {
            return this.stateStore.getOfficerTask(role) !== undefined;
        });
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled officer command target: ${String(value)}`);
    }

    // #endregion
}
