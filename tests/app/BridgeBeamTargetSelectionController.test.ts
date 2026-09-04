import { describe, expect, it, vi } from 'vitest';
import BridgeBeamTargetSelectionController from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgeBeamTargetSelectionController';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgeEnemyShipDashboardUpdatedPayload,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerWeaponDashboardPayload,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import { SHIP_WEAPON_KIND } from '../../src/engine/defs/ship_weapon';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND } from '../../src/engine/encounter/model/command';

describe('Beam target selection before command commitment', () => {
    it('accepts the clicked stable slot, closes selection and submits the existing Gunner command once', () => {
        const { bus, emit, enemy } = setup();
        enemy!.equipment.unshift({ ...enemy!.equipment[0], id: 'other', slotId: 'other-slot' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-2' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTED, { actorId: 'enemy', slotId: 'drive-slot' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTED, { actorId: 'enemy', slotId: 'other-slot' });
        expect(selectionUpdates(emit)).toEqual(['beam-2', null]);
        const commands = emit.mock.calls.filter(([event]) => event === BRIDGE_EVENT.OFFICER_COMMAND_SELECTED);
        expect(commands).toEqual([[BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, {
            role: OFFICER_ROLE.GUNNER, commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,
            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE, weaponId: 'beam-2', actorId: 'enemy',
                node: { kind: 'slot', slotId: 'drive-slot' },
            },
        }]]);
        const commandIndex = emit.mock.calls.findIndex(([event]) => event === BRIDGE_EVENT.OFFICER_COMMAND_SELECTED);
        expect(emit.mock.calls[commandIndex - 1]).toEqual([BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED, null]);
    });

    it('ignores stale enemy and missing-slot clicks', () => {
        const { bus, emit } = setup();
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTED, { actorId: 'other', slotId: 'drive-slot' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTED, { actorId: 'enemy', slotId: 'missing' });
        expect(selectionUpdates(emit)).toEqual(['beam-1']);
        expect(emit.mock.calls.some(([event]) => event === BRIDGE_EVENT.OFFICER_COMMAND_SELECTED)).toBe(false);
    });

    it('enters and cancels without issuing an officer command or task cancellation', () => {
        const { bus, emit } = setup();
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        expect(selectionUpdates(emit)).toEqual(['beam-1', null]);
        expect(emit.mock.calls.some(([event]) => event === BRIDGE_EVENT.OFFICER_COMMAND_SELECTED)).toBe(false);
        expect(emit.mock.calls.some(([event]) => event === BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED)).toBe(false);
    });

    it('keeps selection across snapshots and ignores other own weapons until cancelled', () => {
        const { bus, emit, player } = setup();
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, structuredClone(player));
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-2' });
        expect(selectionUpdates(emit)).toEqual(['beam-1']);
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-2' });
        expect(selectionUpdates(emit)).toEqual(['beam-1', null, 'beam-2']);
    });

    it('cancels when engine-derived availability is lost and rejects stale clicks', () => {
        const { bus, emit, player } = setup();
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        player.weapons![0].action = { state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM };
        bus.emit(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, player);
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        expect(selectionUpdates(emit)).toEqual(['beam-1', null]);
    });

    it('cancels on enemy loss or replacement, including while the player snapshot is still stale', () => {
        const { bus, emit, enemy } = setup();
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, { ...enemy!, actorId: 'other-enemy' });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        expect(selectionUpdates(emit)).toEqual(['beam-1', null]);
        bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, enemy);
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, null);
        expect(selectionUpdates(emit)).toEqual(['beam-1', null, 'beam-1', null]);
    });

    it('allows BROKEN equipment previews but not a dead enemy or an empty equipment board', () => {
        const { bus, emit, enemy } = setup();
        bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, { ...enemy!, equipment: [] });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, { ...enemy!, hull: { current: 0, max: 3 } });
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        expect(selectionUpdates(emit)).toEqual([]);
        bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, enemy);
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        expect(selectionUpdates(emit)).toEqual(['beam-1']);
    });

    it('clears presentation on destroy and removes its listeners', () => {
        const { bus, emit, controller, listeners } = setup();
        bus.emit(BRIDGE_EVENT.BEAM_TARGET_SELECTION_REQUESTED, { weaponId: 'beam-1' });
        controller.destroy();
        expect(selectionUpdates(emit)).toEqual(['beam-1', null]);
        expect([...listeners.values()].flat()).toHaveLength(0);
    });
});

function setup() {
    type Listener = { callback: (payload: unknown) => void; context: unknown };
    const listeners = new Map<string, Listener[]>();
    const emit = vi.fn((event: string, payload?: unknown) => {
        for (const listener of listeners.get(event) ?? []) {
            listener.callback.call(listener.context, payload);
        }
    });
    const bus = {
        emit,
        on(event: string, callback: Listener['callback'], context: unknown) {
            listeners.set(event, [...listeners.get(event) ?? [], { callback, context }]);
        },
        off(event: string, callback: Listener['callback'], context: unknown) {
            listeners.set(event, (listeners.get(event) ?? []).filter(
                (listener) => listener.callback !== callback || listener.context !== context,
            ));
        },
    } as unknown as BridgeEventBus;
    const controller = new BridgeBeamTargetSelectionController(bus);
    const player: BridgePlayerShipDashboardUpdatedPayload = { weapons: [beam('beam-1'), beam('beam-2')] };
    const enemy: BridgeEnemyShipDashboardUpdatedPayload = {
        actorId: 'enemy', displayName: 'Enemy', hull: { current: 3, max: 3 },
        equipment: [{
            slotId: 'drive-slot', targetLocked: false,
            id: 'drive', shortName: 'DRIVE', slot: { column: 1, row: 1 },
            sprite: { atlasKey: 'atlas', frameKey: 'drive' },
            integrity: { current: 0, max: 2 }, broken: true,
        }],
    };
    bus.emit(BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED, player);
    bus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, enemy);
    return { bus, emit, controller, player, enemy, listeners };
}

function beam(id: string): BridgePlayerWeaponDashboardPayload {
    return {
        id, weaponId: 'beam_cannon_00', shortName: 'BEAM CANNON', kind: SHIP_WEAPON_KIND.BEAM_CANNON,
        slot: { column: 1, row: 1 }, integrity: { current: 2, max: 2 }, powerCost: 1,
        action: {
            state: BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE,
            command: {
                role: OFFICER_ROLE.GUNNER, commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,
                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE, weaponId: id, actorId: 'enemy',
                    node: { kind: 'hull' },
                },
            },
        },
    };
}

function selectionUpdates(emit: ReturnType<typeof setup>['emit']) {
    return emit.mock.calls.filter(([event]) => event === BRIDGE_EVENT.BEAM_TARGET_SELECTION_UPDATED)
        .map(([, payload]) => payload);
}
