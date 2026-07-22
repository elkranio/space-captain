// src/engine/encounter/state/EncounterStateStore.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND, type PlayerSpaceNavigationState } from '../../defs/player_location';
import { SPACE_OBJECT_KIND, type SpaceNodeState, type SpaceObjectState } from '../../defs/universe';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../model/command';
import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectState } from '../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../objects/station/station_encounter_object';

export type EncounterTravelStart = {
    fromObjectId: string;
    target: EncounterObjectState;
};

// Владеет mutable runtime state одного encounter.
//
// Подсистемы решают, когда должна произойти операция.
// EncounterStateStore выполняет саму state mutation
// и проверяет локальные invariants состояния.
export default class EncounterStateStore {
    constructor(private readonly state: EncounterState) {}

    // #region Creation

    public static fromSpaceNode(node: SpaceNodeState, navigation: PlayerSpaceNavigationState): EncounterStateStore {
        return new EncounterStateStore({
            spaceBackgroundId: node.spaceBackgroundId,

            // Encounter получает собственный runtime snapshot.
            // Persistent player state обновляется отдельно.
            navigation: {
                ...navigation,
            },

            officerTasks: {},

            objects: node.objects.map((object) => {
                return this.createEncounterObjectState(object);
            }),
        });
    }

    // #endregion

    // #region State reading

    // Пока raw state нужен существующим pure queries
    // и ENCOUNTER_LOADED event.
    //
    // Все новые mutations должны добавляться
    // отдельными методами EncounterStateStore.
    public getState(): EncounterState {
        return this.state;
    }

    public getNavigationState(): PlayerSpaceNavigationState {
        return {
            ...this.state.navigation,
        };
    }

    public findObjectById(objectId: string | undefined): EncounterObjectState | undefined {
        if (!objectId) {
            return undefined;
        }

        return this.state.objects.find((object) => {
            return object.id === objectId;
        });
    }

    // #endregion

    // #region Navigation

    public completeArrival(): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ARRIVING) {
            throw new Error(`Cannot complete arrival from navigation state: ${navigation.kind}`);
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorObjectId: navigation.targetObjectId,
        };
    }

    public startTravel(targetObjectId: string): EncounterTravelStart {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            throw new Error(`Cannot start travel from navigation state: ${navigation.kind}`);
        }

        const target = this.findObjectById(targetObjectId);

        if (!target) {
            throw new Error(`Travel target not found: ${targetObjectId}`);
        }

        const fromObjectId = navigation.anchorObjectId;

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,
            fromObjectId,
            targetObjectId: target.id,
        };

        return {
            fromObjectId,
            target,
        };
    }

    public completeTravel(targetObjectId: string): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            throw new Error(`Cannot complete travel from navigation state: ${navigation.kind}`);
        }

        if (navigation.targetObjectId !== targetObjectId) {
            throw new Error(
                `Travel target does not match navigation target: ` +
                    `${targetObjectId} !== ${navigation.targetObjectId}`,
            );
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorObjectId: targetObjectId,
        };
    }

    // #endregion

    // #region Encounter object mutations

    public grantDockingClearance(targetObjectId: string): void {
        const target = this.findObjectById(targetObjectId);

        if (!target) {
            return;
        }

        switch (target.kind) {
            case ENCOUNTER_OBJECT_KIND.STATION:
                target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;
                return;

            default:
                throw new Error(`Cannot grant docking clearance to encounter object: ${target.kind}`);
        }
    }

    // #endregion

    // #region Officer task storage

    public getOfficerTask(role: OfficerRole): OfficerTaskState | undefined {
        return this.state.officerTasks[role];
    }

    public getOfficerTasks(): OfficerTaskState[] {
        return Object.values(this.state.officerTasks).filter((task): task is OfficerTaskState => {
            return task !== undefined;
        });
    }

    public findOfficerTaskById(taskId: string): OfficerTaskState | undefined {
        return this.getOfficerTasks().find((task) => {
            return task.id === taskId;
        });
    }

    public assignOfficerTask(task: OfficerTaskState): void {
        this.state.officerTasks[task.role] = task;
    }

    public removeOfficerTask(role: OfficerRole): void {
        delete this.state.officerTasks[role];
    }

    public hasActiveHelmTask(): boolean {
        return this.state.officerTasks[OFFICER_ROLE.HELM] !== undefined;
    }

    // #endregion

    // #region Encounter state creation

    private static createEncounterObjectState(object: SpaceObjectState): EncounterObjectState {
        switch (object.kind) {
            case SPACE_OBJECT_KIND.STATION:
                return {
                    id: object.station.id,
                    kind: ENCOUNTER_OBJECT_KIND.STATION,
                    displayName: object.station.name,
                    station: object.station,

                    position: {
                        x: -0.52,
                        y: -0.05,
                    },

                    docking: {
                        clearance: DOCKING_CLEARANCE_STATE.NONE,
                    },

                    officerCommandIds: [
                        ENCOUNTER_OFFICER_COMMAND_ID.HAIL,
                        ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING,
                        ENCOUNTER_OFFICER_COMMAND_ID.DOCK,
                        ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO,
                    ],
                };

            case SPACE_OBJECT_KIND.NAVIGATION_BEACON:
                return {
                    id: object.beacon.id,
                    kind: ENCOUNTER_OBJECT_KIND.NAVIGATION_BEACON,
                    displayName: object.beacon.name,
                    beacon: object.beacon,

                    position: {
                        x: -0.52,
                        y: -0.05,
                    },

                    officerCommandIds: [ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO],
                };

            case SPACE_OBJECT_KIND.ASTEROID:
                return {
                    id: object.asteroid.id,
                    kind: ENCOUNTER_OBJECT_KIND.ASTEROID,
                    displayName: object.asteroid.name,
                    asteroid: object.asteroid,

                    // Временная постановочная позиция.
                    position: {
                        x: 0.42,
                        y: 0.12,
                    },

                    officerCommandIds: [ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO],
                };

            default:
                return this.assertNever(object);
        }
    }

    private static assertNever(value: never): never {
        throw new Error(`Unhandled space object: ${String(value)}`);
    }

    // #endregion
}
