import { SHIP_WEAPON_KIND } from "../../../../../../engine/defs/ship_weapon";
import { OFFICER_COMMAND_TARGET_KIND } from "../../../../../../engine/encounter/model/command";
import type BridgeEventBus from "../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgeBeamTargetSelectedPayload,
    type BridgeEnemyShipDashboardUpdatedPayload,
    type BridgePlayerShipDashboardUpdatedPayload,
} from "../../events/bridge_event";

// Owns only the pre-command UI selection. Engine-derived availability remains authoritative.
export default class BridgeBeamTargetSelectionController {
    private selectedWeaponId: string | null = null;
    private player?: BridgePlayerShipDashboardUpdatedPayload;
    private enemy: BridgeEnemyShipDashboardUpdatedPayload = null;

    constructor(private readonly eventBus: BridgeEventBus) {
        eventBus.on(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, this.handleSelectionRequested, this);
        eventBus.on(BRIDGE_EVENT.BEAM_TARGET_SELECTED, this.handleTargetSelected, this);
        eventBus.on(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handlePlayerUpdated, this);
        eventBus.on(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, this.handleEnemyUpdated, this);
        eventBus.on(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, this.clear, this);
        eventBus.on(BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED, this.clear, this);
        eventBus.on(BRIDGE_EVENT.DOCKING_STARTED, this.clear, this);
        eventBus.on(BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED, this.clear, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, this.handleSelectionRequested, this);
        this.eventBus.off(BRIDGE_EVENT.BEAM_TARGET_SELECTED, this.handleTargetSelected, this);
        this.eventBus.off(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, this.handlePlayerUpdated, this);
        this.eventBus.off(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, this.handleEnemyUpdated, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, this.clear, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_JUMP_STARTED, this.clear, this);
        this.eventBus.off(BRIDGE_EVENT.DOCKING_STARTED, this.clear, this);
        this.eventBus.off(BRIDGE_EVENT.ENEMY_SHIP_DESTRUCTION_STARTED, this.clear, this);
        this.clear();
    }

    private handleSelectionRequested({ weaponId }: { weaponId: string }): void {
        if (this.selectedWeaponId === weaponId) {
            this.setSelectedWeapon(null);
            return;
        }

        // Other own tiles are blocked until the selected Beam is clicked again.
        if (this.selectedWeaponId !== null || !this.canSelect(weaponId)) {
            return;
        }

        this.setSelectedWeapon(weaponId);
    }

    private handlePlayerUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        this.player = payload;
        this.reconcile();
    }

    private handleTargetSelected({ actorId, node }: BridgeBeamTargetSelectedPayload): void {
        const weaponId = this.selectedWeaponId;
        if (
            !weaponId ||
            !this.canSelect(weaponId) ||
            this.enemy?.actorId !== actorId ||
            !this.canTargetNode(node)
        ) {
            return;
        }

        const command = this.player?.weapons?.find((weapon) => weapon.id === weaponId)?.action.command;
        if (command?.target.kind !== OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE) {
            return;
        }

        this.setSelectedWeapon(null);
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, {
            ...command,
            target: { ...command.target, node: { ...node } },
        });
    }

    private handleEnemyUpdated(payload: BridgeEnemyShipDashboardUpdatedPayload): void {
        this.enemy = payload;
        this.reconcile();
    }

    private reconcile(): void {
        if (this.selectedWeaponId !== null && !this.canSelect(this.selectedWeaponId)) {
            this.setSelectedWeapon(null);
        }
    }

    private canSelect(weaponId: string): boolean {
        const weapon = this.player?.weapons?.find((candidate) => candidate.id === weaponId);
        const command = weapon?.action.command;

        return !!(
            weapon?.kind === SHIP_WEAPON_KIND.BEAM_CANNON &&
            weapon.slot &&
            weapon.integrity && weapon.integrity.current > 0 &&
            weapon.action.state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE &&
            command?.target.kind === OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE &&
            this.enemy && this.enemy.hull.current > 0 &&
            command.target.actorId === this.enemy.actorId
        );
    }

    private canTargetNode(node: BridgeBeamTargetSelectedPayload["node"]): boolean {
        return (
            node.kind !== "slot" ||
            !!this.enemy?.equipment.some((equipment) => equipment.slotId === node.slotId)
        );
    }

    private clear(): void {
        this.player = undefined;
        this.enemy = null;
        this.setSelectedWeapon(null);
    }

    private setSelectedWeapon(weaponId: string | null): void {
        if (this.selectedWeaponId === weaponId) {
            return;
        }

        this.selectedWeaponId = weaponId;
        this.eventBus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED, weaponId);
    }
}
