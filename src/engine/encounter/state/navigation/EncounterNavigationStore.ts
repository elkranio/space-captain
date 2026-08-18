// src/engine/encounter/state/navigation/EncounterNavigationStore.ts

import { JUMP_POINT_OBJECT_SPRITE_ID } from "../../../defs/jump_point";
import { PLAYER_SPACE_NAVIGATION_KIND, type PlayerSpaceNavigationState } from "../../../defs/player_location";
import { doesShipWeaponPhaseRequireOperator, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from "../../../defs/ship_weapon";
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorState } from "../../anchors/encounter_anchor";
import type { JumpPointEncounterAnchorState } from "../../anchors/jump_point/jump_point_encounter_anchor";
import type { EncounterState } from "../../model/state";

export type EncounterTravelStart = {
    fromAnchorId: string;
    target: EncounterAnchorState;
};

// Owns navigation transitions and encounter-zone cleanup.
export default class EncounterNavigationStore {
    constructor(private readonly state: EncounterState) {}

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

        this.clearCombatZone(fromAnchorId);

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

    public abortTravel(expectedTargetAnchorId: string): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
            throw new Error(`Cannot abort travel from navigation state: ` + navigation.kind);
        }

        if (navigation.targetAnchorId !== expectedTargetAnchorId) {
            throw new Error(
                `Travel target does not match aborted task: ` +
                    `${navigation.targetAnchorId} !== ` +
                    expectedTargetAnchorId,
            );
        }

        this.state.navigation = {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorId: navigation.fromAnchorId,
        };
    }

    public createJumpPoint(targetNodeId: string): JumpPointEncounterAnchorState {
        const existingJumpPoint = this.state.anchors.find((anchor) => {
            return anchor.kind === ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
        });

        if (existingJumpPoint) {
            throw new Error(`Encounter already contains jump point: ${existingJumpPoint.id}`);
        }

        const id = `jump_point_${targetNodeId}`;

        if (this.findAnchorById(id)) {
            throw new Error(`Cannot create duplicate encounter anchor: ${id}`);
        }

        const anchor: JumpPointEncounterAnchorState = {
            id,
            kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,
            displayName: "JUMP POINT",

            jumpPoint: {
                id,
                name: "JUMP POINT",
                targetNodeId,
                objectSpriteId: JUMP_POINT_OBJECT_SPRITE_ID.JUMP_POINT_00,
            },

            // Temporary staging position
            // inside the current node.
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

        this.state.anchors.push(anchor);

        return anchor;
    }

    private clearCombatZone(anchorId: string): void {
        const combat = this.state.combat;

        combat.projectiles.length = 0;
        combat.beamCannonAttacks.length = 0;
        combat.stickyMines.length = 0;

        const actors = this.state.actors.filter((actor) => {
            return actor.anchorId === anchorId;
        });

        for (const actor of actors) {
            actor.crewTasks = {};
            actor.threatObservations.length = 0;

            for (const weapon of actor.weapons) {
                if (!doesShipWeaponPhaseRequireOperator(weapon.phase)) {
                    continue;
                }

                weapon.phase = SHIP_WEAPON_PHASE.READY;
                weapon.phaseElapsedMs = 0;

                if (weapon.kind === SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                    weapon.activeChannelId = null;
                }

                if (weapon.kind === SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
                    weapon.dispensedMineCount = 0;
                }
            }
        }
    }
}
