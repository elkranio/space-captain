// src/engine/encounter/commands/OfficerCommandExecutor.ts

import { OFFICER_ROLE, type OfficerRole } from "../../defs/officer";
import {
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_REJECTION_REASON,
    OFFICER_COMMAND_TARGET_KIND,
    type ExecuteOfficerCommandInput,
    type ExecuteOfficerCommandResult,
    type OfficerCommandTarget,
    ENCOUNTER_OFFICER_COMMAND_ID,
} from "../model/command";
import type { OfficerCommandExecutionContext, OfficerCommandHandler } from "../model/officer_command_handler";
import EncounterStateStore from "../state/EncounterStateStore";
import { getOfficerCommandHandler } from "./officer_command_handlers";
import { getAvailableOfficerCommands } from "./queries/get_available_officer_commands";

const OFFICER_ROLES = Object.values(OFFICER_ROLE);

export default class OfficerCommandExecutor {
    private readonly stateStore: EncounterStateStore;

    private readonly executionContext: OfficerCommandExecutionContext;

    constructor(options: OfficerCommandExecutionContext) {
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
        // Это исключение относится только к текущему
        // deferred-target контракту PLOT COURSE.
        // Другие SPACE_NODE-команды должны проходить
        // обычную проверку конкретной цели.
        if (
            input.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PLOT_COURSE &&
            input.target.kind === OFFICER_COMMAND_TARGET_KIND.SPACE_NODE
        ) {
            return true;
        }

        return availableCommands.some((command) => {
            return this.areTargetsEqual(command.target, input.target);
        });
    }

    private areTargetsEqual(availableTarget: OfficerCommandTarget, inputTarget: OfficerCommandTarget): boolean {
        switch (availableTarget.kind) {
            case OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE &&
                    availableTarget.weaponId === inputTarget.weaponId &&
                    availableTarget.actorId === inputTarget.actorId &&
                    availableTarget.node.kind === inputTarget.node.kind &&
                    (availableTarget.node.kind === "hull" ||
                        availableTarget.node.kind === "bridge" ||
                        (inputTarget.node.kind === "slot" && availableTarget.node.slotId === inputTarget.node.slotId))
                );

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

            case OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON &&
                    availableTarget.weaponId === inputTarget.weaponId &&
                    availableTarget.actorId === inputTarget.actorId
                );

            case OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE &&
                    availableTarget.targetNode === inputTarget.targetNode
                );

            case OFFICER_COMMAND_TARGET_KIND.THREAT:
                return (
                    inputTarget.kind === OFFICER_COMMAND_TARGET_KIND.THREAT &&
                    availableTarget.threatId === inputTarget.threatId
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
