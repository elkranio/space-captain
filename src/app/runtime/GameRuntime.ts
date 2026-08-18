// src/app/runtime/GameRuntime.ts

import { POWER_CORES } from "../../engine/content/catalogs/power_cores";
import { SHIELD_GENERATORS } from "../../engine/content/catalogs/shield_generators";
import { createNewRunState } from "../../engine/content/new_game/create_new_run_state";
import type { PowerCoreState } from "../../engine/defs/power_core";
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from "../../engine/defs/player_location";
import type { RunState } from "../../engine/defs/run";
import type { ShipDriveState } from "../../engine/defs/ship_drive";
import type { ShipWeaponState } from "../../engine/defs/ship_weapon";
import { SHIELD_GENERATOR_PHASE, type ShieldGeneratorState } from "../../engine/defs/shield_generator";
import { SPACE_ANCHOR_KIND, type SpaceAnchorState } from "../../engine/defs/universe";
import { getCurrentNode } from "../../engine/universe/queries/get_current_node";

type PlayerLocationChangedListener = () => void;
type CurrentNodeAnchorsChangedListener = () => void;

// Runtime текущей игровой сессии.
//
// Владеет persistent RunState и предоставляет контролируемые mutations.
// После изменения player location уведомляет app-слой,
// чтобы постоянные UI-системы могли перечитать актуальное состояние.
export class GameRuntime {
    private readonly currentRun: RunState = createNewRunState();

    private readonly playerLocationChangedListeners = new Set<PlayerLocationChangedListener>();

    private readonly currentNodeAnchorsChangedListeners = new Set<CurrentNodeAnchorsChangedListener>();

    public getCurrentRun(): RunState {
        return this.currentRun;
    }

    public setPlayerShipHull(hull: number): void {
        const ship = this.currentRun.player.ship;

        if (!Number.isFinite(hull) || hull < 0 || hull > ship.maxHull) {
            throw new Error("Player ship hull must be in [0, maxHull]: " + hull + "/" + ship.maxHull);
        }

        ship.hull = hull;
    }

    public setPlayerShipPowerCoreState(next: PowerCoreState): void {
        const current = this.currentRun.player.ship.powerCore;

        if (next.id !== current.id) {
            throw new Error("Player defense-powerCore runtime id cannot change: " + next.id + " !== " + current.id);
        }

        if (next.powerCoreId !== current.powerCoreId) {
            throw new Error(
                "Player defense-powerCore definition cannot change: " +
                    next.powerCoreId +
                    " !== " +
                    current.powerCoreId,
            );
        }

        const definition = POWER_CORES[current.powerCoreId];

        if (!Number.isInteger(next.charges) || next.charges < 0 || next.charges > definition.capacity) {
            throw new Error(
                "Player defense-powerCore charges must be an integer between " +
                    "0 and " +
                    definition.capacity +
                    ": " +
                    next.charges,
            );
        }

        if (
            !Number.isFinite(next.rechargeElapsedMs) ||
            next.rechargeElapsedMs < 0 ||
            next.rechargeElapsedMs >= definition.rechargeDurationMs
        ) {
            throw new Error(
                "Player defense-powerCore recharge elapsed must be in [0, " +
                    definition.rechargeDurationMs +
                    "): " +
                    next.rechargeElapsedMs,
            );
        }

        if (next.charges === definition.capacity && next.rechargeElapsedMs !== 0) {
            throw new Error("Full player power core must have zero recharge elapsed: " + next.rechargeElapsedMs);
        }

        current.charges = next.charges;

        current.rechargeElapsedMs = next.rechargeElapsedMs;
    }

    public setPlayerShipShieldGeneratorState(next: ShieldGeneratorState): void {
        const current = this.currentRun.player.ship.shieldGenerator;

        if (next.id !== current.id) {
            throw new Error("Player shield-emitter runtime id cannot change: " + next.id + " !== " + current.id);
        }

        if (next.shieldGeneratorId !== current.shieldGeneratorId) {
            throw new Error(
                "Player shield-emitter definition cannot change: " +
                    next.shieldGeneratorId +
                    " !== " +
                    current.shieldGeneratorId,
            );
        }

        const definition = SHIELD_GENERATORS[current.shieldGeneratorId];

        if (!Number.isFinite(next.phaseElapsedMs) || next.phaseElapsedMs < 0) {
            throw new Error("Player shield-emitter phase elapsed must be non-negative: " + String(next.phaseElapsedMs));
        }

        switch (next.phase) {
            case SHIELD_GENERATOR_PHASE.READY:
                if (next.phaseElapsedMs !== 0) {
                    throw new Error(
                        "Ready player shield generator must have zero phase elapsed: " + String(next.phaseElapsedMs),
                    );
                }

                break;

            case SHIELD_GENERATOR_PHASE.COOLDOWN:
                if (next.phaseElapsedMs >= definition.cooldownDurationMs) {
                    throw new Error(
                        "Player shield-emitter cooldown elapsed must be in [0, " +
                            definition.cooldownDurationMs +
                            "): " +
                            String(next.phaseElapsedMs),
                    );
                }

                break;

            default:
                this.assertNever(next.phase);
        }

        current.status = next.status;

        current.phase = next.phase;

        current.phaseElapsedMs = next.phaseElapsedMs;
    }

    public setPlayerShipDriveState(next: ShipDriveState): void {
        const current = this.currentRun.player.ship.drive;

        if (next.id !== current.id) {
            throw new Error("Player drive runtime id cannot change: " + `${next.id} !== ${current.id}`);
        }

        if (next.driveId !== current.driveId) {
            throw new Error("Player drive definition cannot change: " + `${next.driveId} !== ${current.driveId}`);
        }

        current.status = next.status;
    }

    public setPlayerShipWeaponStates(next: ShipWeaponState[]): void {
        const current = this.currentRun.player.ship.weapons;

        if (next.length !== current.length) {
            throw new Error("Player ship weapon count cannot change: " + `${next.length} !== ${current.length}`);
        }

        const nextById = new Map<string, ShipWeaponState>();

        for (const weapon of next) {
            if (nextById.has(weapon.id)) {
                throw new Error("Duplicate player ship weapon runtime id: " + weapon.id);
            }

            if (!Number.isFinite(weapon.phaseElapsedMs) || weapon.phaseElapsedMs < 0) {
                throw new Error(
                    "Player ship weapon phase elapsed must be non-negative: " + `${weapon.id}/${weapon.phaseElapsedMs}`,
                );
            }

            nextById.set(weapon.id, weapon);
        }

        for (const currentWeapon of current) {
            const nextWeapon = nextById.get(currentWeapon.id);

            if (!nextWeapon) {
                throw new Error("Player ship weapon runtime id cannot change: " + currentWeapon.id);
            }

            if (nextWeapon.kind !== currentWeapon.kind) {
                throw new Error(
                    "Player ship weapon kind cannot change: " +
                        `${currentWeapon.id}/` +
                        `${nextWeapon.kind} !== ${currentWeapon.kind}`,
                );
            }

            if (nextWeapon.weaponId !== currentWeapon.weaponId) {
                throw new Error(
                    "Player ship weapon definition cannot change: " +
                        `${currentWeapon.id}/` +
                        `${nextWeapon.weaponId} !== ${currentWeapon.weaponId}`,
                );
            }
        }

        current.splice(
            0,
            current.length,

            ...next.map((weapon) => {
                return {
                    ...weapon,
                };
            }),
        );
    }

    public setPlayerSpaceNavigation(navigation: PlayerSpaceNavigationState): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot set space navigation for player location: ${location.kind}`);
        }

        if (this.isSamePlayerSpaceNavigation(location.navigation, navigation)) {
            return;
        }

        location.navigation = {
            ...navigation,
        };

        this.emitPlayerLocationChanged();
    }

    public addCurrentNodeAnchor(anchor: SpaceAnchorState): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot add space anchor for player location: ${location.kind}`);
        }

        const node = getCurrentNode(this.currentRun);
        const anchorId = this.getSpaceAnchorId(anchor);

        const existingAnchor = node.anchors.find((candidate) => {
            return this.getSpaceAnchorId(candidate) === anchorId;
        });

        if (existingAnchor) {
            throw new Error(`Current node already contains space anchor: ${anchorId}`);
        }

        node.anchors.push(anchor);

        this.emitCurrentNodeAnchorsChanged();
    }

    public removeCurrentNodeActor(actorId: string): void {
        const node = getCurrentNode(this.currentRun);

        const actorIndex = node.actors.findIndex((actor) => {
            return actor.id === actorId;
        });

        if (actorIndex < 0) {
            throw new Error("Current node actor not found: " + actorId);
        }

        node.actors.splice(actorIndex, 1);
    }

    public jumpPlayerToNode(targetNodeId: string): void {
        const location = this.currentRun.player.location;

        if (location.kind !== PLAYER_LOCATION_KIND.SPACE) {
            throw new Error(`Cannot jump from player location: ${location.kind}`);
        }

        if (location.navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            throw new Error(`Cannot jump from space navigation state: ${location.navigation.kind}`);
        }

        const sourceNode = getCurrentNode(this.currentRun);
        const anchorId = location.navigation.anchorId;

        const anchor = sourceNode.anchors.find((candidate) => {
            return this.getSpaceAnchorId(candidate) === anchorId;
        });

        if (!anchor) {
            throw new Error(`Jump anchor not found: ${anchorId}`);
        }

        if (anchor.kind !== SPACE_ANCHOR_KIND.JUMP_POINT) {
            throw new Error(`Cannot jump from space anchor: ${anchor.kind}`);
        }

        if (anchor.jumpPoint.targetNodeId !== targetNodeId) {
            throw new Error(
                `Jump point destination does not match requested node: ` +
                    `${anchor.jumpPoint.targetNodeId} !== ${targetNodeId}`,
            );
        }

        const targetNode = this.currentRun.universe.nodes.find((node) => {
            return node.id === targetNodeId;
        });

        if (!targetNode) {
            throw new Error(`Jump destination node not found: ${targetNodeId}`);
        }

        if (targetNode.id === sourceNode.id) {
            throw new Error(`Cannot jump to current node: ${targetNodeId}`);
        }

        const arrivalAnchor = targetNode.anchors.find((candidate) => {
            return this.getSpaceAnchorId(candidate) === targetNode.arrivalAnchorId;
        });

        if (!arrivalAnchor) {
            throw new Error(`Jump destination arrival anchor not found: ${targetNode.arrivalAnchorId}`);
        }

        // Все рассчитанные искажения принадлежат старому node visit.
        sourceNode.anchors = sourceNode.anchors.filter((candidate) => {
            return candidate.kind !== SPACE_ANCHOR_KIND.JUMP_POINT;
        });

        this.currentRun.player.location = {
            kind: PLAYER_LOCATION_KIND.SPACE,
            nodeId: targetNode.id,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ARRIVING,
                targetAnchorId: targetNode.arrivalAnchorId,
            },
        };

        this.emitPlayerLocationChanged();
    }

    public onPlayerLocationChanged(listener: PlayerLocationChangedListener): void {
        this.playerLocationChangedListeners.add(listener);
    }

    public offPlayerLocationChanged(listener: PlayerLocationChangedListener): void {
        this.playerLocationChangedListeners.delete(listener);
    }

    public onCurrentNodeAnchorsChanged(listener: CurrentNodeAnchorsChangedListener): void {
        this.currentNodeAnchorsChangedListeners.add(listener);
    }

    public offCurrentNodeAnchorsChanged(listener: CurrentNodeAnchorsChangedListener): void {
        this.currentNodeAnchorsChangedListeners.delete(listener);
    }

    private emitPlayerLocationChanged(): void {
        for (const listener of [...this.playerLocationChangedListeners]) {
            listener();
        }
    }

    private emitCurrentNodeAnchorsChanged(): void {
        for (const listener of [...this.currentNodeAnchorsChangedListeners]) {
            listener();
        }
    }

    private isSamePlayerSpaceNavigation(
        current: PlayerSpaceNavigationState,
        next: PlayerSpaceNavigationState,
    ): boolean {
        switch (current.kind) {
            case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                return (
                    next.kind === PLAYER_SPACE_NAVIGATION_KIND.ARRIVING &&
                    current.targetAnchorId === next.targetAnchorId
                );

            case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                return next.kind === PLAYER_SPACE_NAVIGATION_KIND.ANCHORED && current.anchorId === next.anchorId;

            case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                return (
                    next.kind === PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING &&
                    current.fromAnchorId === next.fromAnchorId &&
                    current.targetAnchorId === next.targetAnchorId
                );

            default:
                return this.assertNever(current);
        }
    }

    private getSpaceAnchorId(anchor: SpaceAnchorState): string {
        switch (anchor.kind) {
            case SPACE_ANCHOR_KIND.STATION:
                return anchor.station.id;

            case SPACE_ANCHOR_KIND.NAVIGATION_BEACON:
                return anchor.beacon.id;

            case SPACE_ANCHOR_KIND.ASTEROID:
                return anchor.asteroid.id;

            case SPACE_ANCHOR_KIND.JUMP_POINT:
                return anchor.jumpPoint.id;

            default:
                return this.assertNever(anchor);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled GameRuntime state: ${String(value)}`);
    }
}

export const GAME_RUNTIME = new GameRuntime();
