// src/engine/encounter/commands/OfficerCommandExecutor.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import type { ContactSequenceStep } from '../contact/sequences/contact_sequence';
import { createStationHailSequence } from '../contact/sequences/create_station_hail_sequence';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_REJECTION_REASON,
    getOfficerCommandDef,
    type EncounterOfficerCommandId,
    type ExecuteOfficerCommandInput,
    type ExecuteOfficerCommandResult,
} from '../model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { OfficerTaskDraft } from '../model/officer_task';
import { ENCOUNTER_OBJECT_KIND } from '../objects/encounter_object';
import type { JumpPointEncounterObjectState } from '../objects/jump_point/jump_point_encounter_object';
import type { StationEncounterObjectState } from '../objects/station/station_encounter_object';
import {
    createCommsHailTask,
    createCommsRequestDockingTask,
    createHelmDockTask,
    createHelmFlyToTask,
    createHelmJumpTask,
    createSciencePlotCourseTask,
} from '../officer_tasks/create_officer_task_draft';
import EncounterStateStore from '../state/EncounterStateStore';
import { getAvailableOfficerCommands } from './queries/get_available_officer_commands';

type StartContactSequence = (steps: ContactSequenceStep[], onContactEnded?: () => void) => void;

type StartOfficerTask = (task: OfficerTaskDraft) => string;

type CompleteOfficerTask = (taskId: string) => void;

type OfficerCommandExecutorOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    startOfficerTask: StartOfficerTask;
    completeOfficerTask: CompleteOfficerTask;
    startContactSequence: StartContactSequence;
};

const OFFICER_ROLES = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;

export default class OfficerCommandExecutor {
    private readonly stateStore: EncounterStateStore;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly startOfficerTask: StartOfficerTask;

    private readonly completeOfficerTask: CompleteOfficerTask;

    private readonly startContactSequence: StartContactSequence;

    constructor({
        stateStore,
        emit,
        startOfficerTask,
        completeOfficerTask,
        startContactSequence,
    }: OfficerCommandExecutorOptions) {
        this.stateStore = stateStore;
        this.emit = emit;
        this.startOfficerTask = startOfficerTask;
        this.completeOfficerTask = completeOfficerTask;
        this.startContactSequence = startContactSequence;
    }

    // #region Public API

    public execute(input: ExecuteOfficerCommandInput): ExecuteOfficerCommandResult {
        if (!this.canExecute(input)) {
            return {
                status: OFFICER_COMMAND_EXECUTION_STATUS.REJECTED,
                reason: OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE,
            };
        }

        const busyRoles = this.getBusyRolesBlockingCommand(input.commandId);

        if (busyRoles.length > 0) {
            return {
                status: OFFICER_COMMAND_EXECUTION_STATUS.REJECTED,
                reason: OFFICER_COMMAND_REJECTION_REASON.OFFICERS_BUSY,
                busyRoles,
            };
        }

        switch (input.commandId) {
            case ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL:
                this.executeHail(input);
                break;

            case ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING:
                this.executeRequestDocking(input);
                break;

            case ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE:
                this.executeSciencePlotCourse(input);
                break;

            case ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK:
                this.executeDock(input);
                break;

            case ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO:
                this.executeFlyTo(input);
                break;

            case ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP:
                this.executeJump(input);
                break;

            default:
                throw new Error(`Unhandled encounter officer command: ${String(input.commandId)}`);
        }

        return {
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        };
    }

    // #endregion

    // #region Command validation

    private canExecute(input: ExecuteOfficerCommandInput): boolean {
        if (input.commandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE && !input.targetNodeId) {
            return false;
        }

        const commands = getAvailableOfficerCommands(this.stateStore.getState(), input.role);

        return commands.some((command) => {
            return command.commandId === input.commandId && command.targetId === input.targetId;
        });
    }

    private getBusyRolesBlockingCommand(commandId: EncounterOfficerCommandId): OfficerRole[] {
        const commandDef = getOfficerCommandDef(commandId);

        if (!commandDef.requiresIdleBridge) {
            return [];
        }

        return OFFICER_ROLES.filter((role) => {
            return this.stateStore.getOfficerTask(role) !== undefined;
        });
    }

    // #endregion

    // #region Command execution

    private executeHail(input: ExecuteOfficerCommandInput): void {
        const target = this.getStationTarget(input);

        const commsTaskId = this.startOfficerTask(createCommsHailTask(target.id));

        const onContactEnded = (): void => {
            this.completeOfficerTask(commsTaskId);
        };

        this.startContactSequence(createStationHailSequence(target), onContactEnded);
    }

    private executeRequestDocking(input: ExecuteOfficerCommandInput): void {
        if (!input.targetId) {
            throw new Error('REQUEST_DOCKING command requires targetId');
        }

        this.startOfficerTask(createCommsRequestDockingTask(input.targetId));
    }

    private executeSciencePlotCourse(input: ExecuteOfficerCommandInput): void {
        if (!input.targetNodeId) {
            throw new Error('SCIENCE_PLOT_COURSE command requires targetNodeId');
        }

        this.startOfficerTask(createSciencePlotCourseTask(input.targetNodeId));
    }

    private executeDock(input: ExecuteOfficerCommandInput): void {
        const target = this.getStationTarget(input);

        this.startOfficerTask(createHelmDockTask(target.id));

        this.emit({
            type: ENCOUNTER_EVENT.DOCKING_STARTED,
            targetId: target.id,
        });
    }

    private executeFlyTo(input: ExecuteOfficerCommandInput): void {
        if (!input.targetId) {
            throw new Error('FLY_TO command requires targetId');
        }

        const { fromObjectId, target } = this.stateStore.startTravel(input.targetId);

        const helmTaskId = this.startOfficerTask(createHelmFlyToTask(target.id));

        this.emit({
            type: ENCOUNTER_EVENT.TRAVEL_STARTED,
            taskId: helmTaskId,
            fromObjectId,
            target,
        });
    }

    private executeJump(input: ExecuteOfficerCommandInput): void {
        const target = this.getJumpPointTarget(input);

        const helmTaskId = this.startOfficerTask(createHelmJumpTask(target.id, target.jumpPoint.targetNodeId));

        this.emit({
            type: ENCOUNTER_EVENT.JUMP_STARTED,
            taskId: helmTaskId,
            targetNodeId: target.jumpPoint.targetNodeId,
        });
    }

    // #endregion

    // #region Target lookup

    private getStationTarget(input: ExecuteOfficerCommandInput): StationEncounterObjectState {
        if (!input.targetId) {
            throw new Error(`${input.commandId} command requires targetId`);
        }

        const target = this.stateStore.findObjectById(input.targetId);

        if (!target) {
            throw new Error(`${input.commandId} command target not found: ${input.targetId}`);
        }

        if (target.kind !== ENCOUNTER_OBJECT_KIND.STATION) {
            throw new Error(`${input.commandId} command does not support encounter object: ${target.kind}`);
        }

        return target;
    }

    private getJumpPointTarget(input: ExecuteOfficerCommandInput): JumpPointEncounterObjectState {
        if (!input.targetId) {
            throw new Error(`${input.commandId} command requires targetId`);
        }

        const target = this.stateStore.findObjectById(input.targetId);

        if (!target) {
            throw new Error(`${input.commandId} command target not found: ${input.targetId}`);
        }

        if (target.kind !== ENCOUNTER_OBJECT_KIND.JUMP_POINT) {
            throw new Error(`${input.commandId} command does not support encounter object: ${target.kind}`);
        }

        return target;
    }

    // #endregion
}
