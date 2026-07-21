// src/engine/encounter/commands/OfficerCommandExecutor.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
import type { ContactSequenceStep } from '../contact/contact_sequence';
import { createStationHailSequence } from '../contact/sequences/create_station_hail_sequence';
import { ENCOUNTER_OFFICER_COMMAND_ID, type ExecuteOfficerCommandInput } from '../model/command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_OBJECT_KIND } from '../objects/encounter_object';
import { createCommsHailTask } from '../officer_tasks/factories/create_comms_hail_task';
import { createCommsRequestDockingTask } from '../officer_tasks/factories/create_comms_request_docking_task';
import { createHelmDockTask } from '../officer_tasks/factories/create_helm_dock_task';
import { createHelmFlyToTask } from '../officer_tasks/factories/create_helm_fly_to_task';
import { findEncounterObjectById } from '../state/find_encounter_object_by_id';
import { getAvailableOfficerCommands } from './get_available_officer_commands';

type StartContactSequence = (steps: ContactSequenceStep[], onContactEnded?: () => void) => void;

type StartOfficerTask = (task: OfficerTaskState) => string;

type CompleteOfficerTask = (taskId: string) => void;

type OfficerCommandExecutorOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    startOfficerTask: StartOfficerTask;

    completeOfficerTask: CompleteOfficerTask;

    startContactSequence: StartContactSequence;
};

export default class OfficerCommandExecutor {
    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly startOfficerTask: StartOfficerTask;

    private readonly completeOfficerTask: CompleteOfficerTask;

    private readonly startContactSequence: StartContactSequence;

    constructor({
        state,
        emit,
        startOfficerTask,
        completeOfficerTask,
        startContactSequence,
    }: OfficerCommandExecutorOptions) {
        this.state = state;
        this.emit = emit;

        this.startOfficerTask = startOfficerTask;

        this.completeOfficerTask = completeOfficerTask;

        this.startContactSequence = startContactSequence;
    }

    // #region Public API

    public execute(input: ExecuteOfficerCommandInput): void {
        if (!this.canExecute(input)) {
            return;
        }

        switch (input.commandId) {
            case ENCOUNTER_OFFICER_COMMAND_ID.HAIL:
                this.executeHail(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING:
                this.executeRequestDocking(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.DOCK:
                this.executeDock(input);
                return;

            case ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO:
                this.executeFlyTo(input);
                return;

            default:
                throw new Error(`Unhandled encounter officer command: ${String(input.commandId)}`);
        }
    }

    // #endregion

    // #region Command availability

    private canExecute(input: ExecuteOfficerCommandInput): boolean {
        const commands = getAvailableOfficerCommands(this.state, input.role);

        return commands.some((command) => {
            return command.commandId === input.commandId && command.targetId === input.targetId;
        });
    }

    // #endregion

    // #region Command execution

    private executeHail(input: ExecuteOfficerCommandInput): void {
        const target = findEncounterObjectById(this.state, input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION: {
                const commsTaskId = this.startOfficerTask(createCommsHailTask(target.id));

                const onContactEnded = (): void => {
                    this.completeOfficerTask(commsTaskId);
                };

                this.startContactSequence(
                    createStationHailSequence(target),

                    onContactEnded,
                );

                return;
            }
        }
    }

    private executeRequestDocking(input: ExecuteOfficerCommandInput): void {
        if (!input.targetId) {
            throw new Error('REQUEST_DOCKING command requires targetId');
        }

        this.startOfficerTask(createCommsRequestDockingTask(input.targetId));
    }

    private executeDock(input: ExecuteOfficerCommandInput): void {
        const target = findEncounterObjectById(this.state, input.targetId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                this.startOfficerTask(createHelmDockTask(target.id));

                this.emit({
                    type: ENCOUNTER_EVENT.DOCKING_STARTED,

                    targetId: target.id,
                });

                return;
        }
    }

    private executeFlyTo(input: ExecuteOfficerCommandInput): void {
        if (!input.targetId) {
            throw new Error('FLY_TO command requires targetId');
        }

        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            throw new Error(`Cannot execute FLY_TO from navigation state: ${navigation.kind}`);
        }

        const target = findEncounterObjectById(this.state, input.targetId);

        if (!target) {
            throw new Error(`FLY_TO target not found: ${input.targetId}`);
        }

        const fromObjectId = navigation.anchorObjectId;

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,

            fromObjectId,
            targetObjectId: target.id,
        };

        const helmTaskId = this.startOfficerTask(createHelmFlyToTask(target.id));

        this.emit({
            type: ENCOUNTER_EVENT.TRAVEL_STARTED,

            taskId: helmTaskId,

            fromObjectId,
            target,
        });
    }

    // #endregion
}
