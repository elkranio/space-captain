import { describe, expect, it } from 'vitest';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND } from '../../../src/engine/defs/ship_weapon';
import { SHIP_EVADE_PHASE } from '../../../src/engine/defs/ship_evade';
import { ENCOUNTER_TEAM } from '../../../src/engine/defs/encounter_team';
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND } from '../../../src/engine/encounter/model/command';
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from '../../../src/engine/encounter/model/combat';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import { findShipSlotEquipment } from '../../../src/engine/encounter/actors/find_ship_slot_equipment';
import { getEnemyShipDashboardSnapshots } from '../../../src/engine/encounter/combat/queries/get_enemy_ship_dashboard_snapshots';
import { createAnchoredPlayerCombatTestSetup, getPlayerWeaponOrThrow } from './combat_test_support';

const definition = SHIP_WEAPONS[SHIP_WEAPON_ID.BEAM_CANNON_00];

function setup() {
    const fixture = createAnchoredPlayerCombatTestSetup();
    fixture.targetActor.crewRoles = [];
    return fixture;
}

function start(fixture: ReturnType<typeof setup>, slotId: string) {
    const { engine, targetActor } = fixture;
    const target = {
        kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE,
        weaponId: 'beam_cannon_player_00', actorId: targetActor.id,
        node: { kind: 'slot' as const, slotId },
    };
    expect(engine.executeCommand({
        role: OFFICER_ROLE.GUNNER, commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON, target,
    })).toEqual({ status: 'executed' });
    const task = engine.getOfficerTasks()[0];
    expect(task).toMatchObject({
        kind: OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON,
        weaponId: target.weaponId, targetActorId: targetActor.id, target: { kind: 'slot', slotId },
    });
    // Mutating the input must not retarget the running task.
    target.node.slotId = 'not-the-committed-slot';
    return task!;
}

describe('player Beam semantic slot targeting', () => {
    it.each(['drive', 'defense_01', 'defense_02', 'weapon_01'])(
        'damages only the equipment mounted at %s with configured module damage', (slotId) => {
            const fixture = setup();
            const { engine, targetActor, state } = fixture;
            const equipment = findShipSlotEquipment(targetActor, slotId)!;
            equipment.integrity = definition.moduleDamage + 2;
            const beforeHull = targetActor.hull;
            const beforePower = state.combat.powerCore!.charges;
            const untouched = targetActor.mounts.filter((mount) => mount.slotId !== slotId)
                .map((mount) => findShipSlotEquipment(targetActor, mount.slotId)!);
            const beforeIntegrity = untouched.map((item) => item.integrity);
            start(fixture, slotId);
            expect(state.combat.powerCore!.charges).toBe(beforePower - definition.powerCost);
            engine.step(definition.chargeDurationMs - 1);
            expect(equipment.integrity).toBe(definition.moduleDamage + 2);
            engine.step(1);
            expect(equipment.integrity).toBe(2);
            expect(untouched.map((item) => item.integrity)).toEqual(beforeIntegrity);
            expect(targetActor.hull).toBe(beforeHull);
            expect(engine.getOfficerTasks()).toEqual([]);
        },
    );

    it('does not spill into Hull when the hit itself breaks equipment', () => {
        const fixture = setup();
        const { engine, targetActor } = fixture;
        targetActor.drive.integrity = 1;
        const beforeHull = targetActor.hull;
        start(fixture, 'drive');
        engine.step(definition.chargeDurationMs);
        expect(targetActor.drive.integrity).toBe(0);
        expect(targetActor.hull).toBe(beforeHull);
    });

    it('uses moduleDamage independently of hullDamage and clamps overkill without Hull spill', () => {
        const originalDamage = definition.moduleDamage;
        try {
            definition.moduleDamage = definition.hullDamage + 3;
            const fixture = setup();
            const { engine, targetActor } = fixture;
            targetActor.drive.integrity = definition.hullDamage + 1;
            const beforeHull = targetActor.hull;
            start(fixture, 'drive');
            engine.step(definition.chargeDurationMs);
            expect(targetActor.drive.integrity).toBe(0);
            expect(targetActor.hull).toBe(beforeHull);
        } finally {
            definition.moduleDamage = originalDamage;
        }
    });

    it.each([true, false])('uses BROKEN at impact, initially broken: %s', (initiallyBroken) => {
        const fixture = setup();
        const { engine, targetActor } = fixture;
        targetActor.hull = targetActor.maxHull = definition.hullDamage * 2 + 3;
        targetActor.drive.integrity = initiallyBroken ? 0 : 2;
        start(fixture, 'drive');
        engine.step(definition.chargeDurationMs - 1);
        targetActor.drive.integrity = 0;
        engine.step(1);
        expect(targetActor.hull).toBe(3);
        expect(targetActor.drive.integrity).toBe(0);
    });

    it('resolves stable mounts even when duplicate weapons and mounts are reordered during charging', () => {
        const fixture = setup();
        const { engine, targetActor } = fixture;
        const first = targetActor.weapons[0];
        const second = { ...first, id: 'duplicate-launcher', integrity: definition.moduleDamage + 3 };
        targetActor.weapons.push(second);
        targetActor.mounts.push({ slotId: 'weapon_02', equipmentId: second.id });
        const firstIntegrity = first.integrity;
        start(fixture, 'weapon_02');
        targetActor.weapons.reverse();
        targetActor.mounts.reverse();
        engine.step(definition.chargeDurationMs);
        expect(second.integrity).toBe(3);
        expect(first.integrity).toBe(firstIntegrity);
    });

    it.each(['cancel', 'damage', 'slot-lost', 'enemy-lost'])(
        'clears the active target without firing on %s', (termination) => {
            const fixture = setup();
            const { engine, state, targetActor } = fixture;
            const task = start(fixture, 'drive');
            const beforeHull = targetActor.hull;
            const beforeIntegrity = targetActor.drive.integrity;
            expect(getEnemyShipDashboardSnapshots(state)[0].beamTarget).toEqual({
                kind: 'slot',
                slotId: 'drive',
            });
            if (termination === 'cancel') engine.cancelTask(task.id);
            if (termination === 'slot-lost') {
                targetActor.mounts = targetActor.mounts.filter((mount) => mount.slotId !== 'drive');
            }
            if (termination === 'enemy-lost') state.actors = [];
            if (termination === 'damage') {
                state.combat.stickyMines.push({
                    id: 'incoming-mine',
                    source: { kind: COMBAT_SOURCE_KIND.ACTOR, actorId: targetActor.id },
                    sourceWeaponId: targetActor.weapons[0].id,
                    target: { kind: COMBAT_TARGET_KIND.PLAYER_SHIP },
                    damage: 1, timeToDetonationMs: 1, initialTimeToDetonationMs: 1,
                });
            }
            engine.step(1);
            expect(engine.getOfficerTasks()).toEqual([]);
            expect(getEnemyShipDashboardSnapshots(state).every((item) => item.beamTarget === undefined)).toBe(true);
            engine.step(definition.chargeDurationMs);
            expect(engine.drainEvents().some((event) => event.type === ENCOUNTER_EVENT.PLAYER_BEAM_CANNON_FIRED))
                .toBe(false);
            expect(targetActor.hull).toBe(beforeHull);
            expect(targetActor.drive.integrity).toBe(beforeIntegrity);
        },
    );

    it.each(['missing', 'weapon_03', 'power_core'])(
        'rejects an unavailable slot %s without spending Power or starting a task', (slotId) => {
            const { engine, state, targetActor } = setup();
            const beforePower = state.combat.powerCore!.charges;
            expect(engine.executeCommand({
                role: OFFICER_ROLE.GUNNER, commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,
                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE,
                    weaponId: 'beam_cannon_player_00', actorId: targetActor.id, node: { kind: 'slot', slotId },
                },
            })).toEqual({ status: 'rejected', reason: 'not_available' });
            expect(state.combat.powerCore!.charges).toBe(beforePower);
            expect(engine.getOfficerTasks()).toEqual([]);
        },
    );

    it.each(['evade', 'shield'])('preserves %s before slot damage resolution', (defense) => {
        const fixture = setup();
        const { engine, state, targetActor } = fixture;
        start(fixture, 'drive');
        // Finish charging in this step without advancing enemy Evade past its end.
        getPlayerWeaponOrThrow(state, SHIP_WEAPON_KIND.BEAM_CANNON).phaseElapsedMs = definition.chargeDurationMs - 1;
        targetActor.activeShield = {
            sourceEmitterId: 'shield', remainingDurationMs: 10000, initialDurationMs: 10000,
        };
        if (defense === 'evade') targetActor.evade.phase = SHIP_EVADE_PHASE.EVADING;
        const beforeIntegrity = targetActor.drive.integrity;
        engine.step(1);
        expect(targetActor.drive.integrity).toBe(beforeIntegrity);
        expect(!!targetActor.activeShield).toBe(defense === 'evade');
    });

    it('destroys the actor once on lethal repeated-slot damage', () => {
        const fixture = setup();
        const { engine, targetActor, state } = fixture;
        targetActor.drive.integrity = 0;
        targetActor.hull = definition.hullDamage * 2;
        start(fixture, 'drive');
        engine.step(definition.chargeDurationMs);
        expect(state.actors.some((actor) => actor.team === ENCOUNTER_TEAM.ENEMY)).toBe(false);
        expect(engine.drainEvents().filter((event) => event.type === ENCOUNTER_EVENT.ENEMY_SHIP_DESTROYED))
            .toHaveLength(1);
    });
});
