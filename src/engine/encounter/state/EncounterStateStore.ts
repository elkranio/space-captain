// src/engine/encounter/state/EncounterStateStore.ts

import type { OfficerRole } from '../../defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND, type PlayerSpaceNavigationState } from '../../defs/player_location';
import type { SpaceNodeState } from '../../defs/universe';
import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorState } from '../anchors/encounter_anchor';
import { JUMP_POINT_OBJECT_SPRITE_ID } from '../../defs/jump_point';
import type { JumpPointEncounterAnchorState } from '../anchors/jump_point/jump_point_encounter_anchor';
import { DOCKING_CLEARANCE_STATE } from '../anchors/station/station_encounter_anchor';
import { createEncounterState } from './create_encounter_state';
import { SHIPS } from '../../content/ships';
import type { ShipId } from '../../defs/ship';
import { ENCOUNTER_ACTOR_KIND, type EncounterActorState } from '../actors/encounter_actor';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';

export type EncounterTravelStart = {
    fromAnchorId: string;
    target: EncounterAnchorState;
};

export type SpawnShipActorInput = {
    actorId: string;
    shipId: ShipId;
    anchorId: string;
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
        const store = new EncounterStateStore(createEncounterState(node, navigation));

        for (const actor of node.actors) {
            store.spawnShipActor({
                actorId: actor.id,
                shipId: actor.shipId,
                anchorId: actor.anchorId,
            });
        }

        return store;
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

    public findAnchorById(anchorId: string | undefined): EncounterAnchorState | undefined {
        if (!anchorId) {
            return undefined;
        }

        return this.state.anchors.find((anchor) => {
            return anchor.id === anchorId;
        });
    }

    public findActorById(actorId: string | undefined): EncounterActorState | undefined {
        if (!actorId) {
            return undefined;
        }

        return this.state.actors.find((actor) => {
            return actor.id === actorId;
        });
    }

    public getActorsAtAnchor(anchorId: string): EncounterActorState[] {
        return this.state.actors.filter((actor) => {
            return actor.anchorId === anchorId;
        });
    }

    public spawnShipActor({ actorId, shipId, anchorId }: SpawnShipActorInput): ShipEncounterActorState {
        if (!this.findAnchorById(anchorId)) {
            throw new Error(`Cannot spawn ship actor: ` + `anchor not found: ${anchorId}`);
        }

        if (this.findActorById(actorId)) {
            throw new Error(`Encounter actor already exists: ${actorId}`);
        }

        const ship = SHIPS[shipId];

        const actor: ShipEncounterActorState = {
            id: actorId,
            kind: ENCOUNTER_ACTOR_KIND.SHIP,
            displayName: ship.name,

            anchorId,
            shipId,
        };

        this.state.actors.push(actor);

        return actor;
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
            anchorId: navigation.targetAnchorId,
        };
    }

    public startTravel(targetAnchorId: string): EncounterTravelStart {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            throw new Error(`Cannot start travel from navigation state: ${navigation.kind}`);
        }

        const target = this.findAnchorById(targetAnchorId);

        if (!target) {
            throw new Error(`Travel target not found: ${targetAnchorId}`);
        }

        const fromAnchorId = navigation.anchorId;

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,
            fromAnchorId,
            targetAnchorId: target.id,
        };

        return {
            fromAnchorId,
            target,
        };
    }

    public completeTravel(targetAnchorId: string): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            throw new Error(`Cannot complete travel from navigation state: ${navigation.kind}`);
        }

        if (navigation.targetAnchorId !== targetAnchorId) {
            throw new Error(
                `Travel target does not match navigation target: ` +
                    `${targetAnchorId} !== ${navigation.targetAnchorId}`,
            );
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: targetAnchorId,
        };
    }

    // #endregion

    // #region Encounter object mutations

    public createJumpPoint(targetNodeId: string): JumpPointEncounterAnchorState {
        const existingJumpPoint = this.state.anchors.find((anchor) => {
            return anchor.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
        });

        if (existingJumpPoint) {
            throw new Error(`Encounter already contains jump point: ${existingJumpPoint.id}`);
        }

        const id = `jump_point_${targetNodeId}`;

        if (this.findAnchorById(id)) {
            throw new Error(`Cannot create duplicate encounter object: ${id}`);
        }

        const object: JumpPointEncounterAnchorState = {
            id,
            kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,
            displayName: 'JUMP POINT',

            jumpPoint: {
                id,
                name: 'JUMP POINT',
                targetNodeId,
                objectSpriteId: JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,
            },

            // Временная постановочная позиция внутри текущей ноды.
            localPosition: {
                x: 1500,
                y: -250,
                z: 700,
            },

            position: {
                x: 0,
                y: 0,
            },

            perspectiveDepth: 1,
        };

        this.state.anchors.push(object);

        return object;
    }

    public grantDockingClearance(targetObjectId: string): void {
        const target = this.findAnchorById(targetObjectId);

        if (!target) {
            throw new Error(`Cannot grant docking clearance: encounter object not found: ${targetObjectId}`);
        }

        switch (target.kind) {
            case ENCOUNTER_ANCHOR_KIND.STATION:
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
        const activeTask = this.getOfficerTask(task.role);

        if (activeTask) {
            throw new Error(
                `Cannot assign officer task ${task.kind}: ` +
                    `officer ${task.role} is already busy with ${activeTask.kind}`,
            );
        }

        this.state.officerTasks[task.role] = task;
    }

    public removeOfficerTask(role: OfficerRole): void {
        delete this.state.officerTasks[role];
    }

    public advanceOfficerTasks(deltaMs: number): void {
        for (const task of this.getOfficerTasks()) {
            if (task.durationMs === null) {
                continue;
            }

            task.elapsedMs = Math.min(task.elapsedMs + deltaMs, task.durationMs);
        }
    }

    // #endregion
}
