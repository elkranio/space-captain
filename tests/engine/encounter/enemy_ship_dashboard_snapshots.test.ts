import { describe, expect, it } from 'vitest';
import { POWER_CORES } from '../../../src/engine/content/catalogs/power_cores';
import {
    getEnemyShipDashboardSnapshots,
} from '../../../src/engine/encounter/combat/queries/get_enemy_ship_dashboard_snapshots';
import { createAnchoredPlayerCombatTestSetup } from './combat_test_support';

describe('enemy ship dashboard snapshots', () => {
    it('keeps chassis mounts in encounter state and exposes only public dashboard state', () => {
        const { state, targetActor } = createAnchoredPlayerCombatTestSetup();
        const powerCore = targetActor.powerCore;

        if (!powerCore) {
            throw new Error('Expected enemy Power Core');
        }

        const powerCoreDefinition = POWER_CORES[powerCore.powerCoreId];

        powerCore.charges = 1;
        powerCore.rechargeElapsedMs = Math.floor(powerCoreDefinition.rechargeDurationMs / 2);

        expect(targetActor.mounts).toEqual([
            {
                slotId: 'drive',
                equipmentId: 'drive_00',
            },
            {
                slotId: 'defense_01',
                equipmentId: 'defense_turret_00',
            },
            {
                slotId: 'power_core',
                equipmentId: 'power_core_00',
            },
            {
                slotId: 'defense_02',
                equipmentId: 'shield_generator_00',
            },
            {
                slotId: 'weapon_01',
                equipmentId: 'missile_launcher_00',
            },
        ]);

        const snapshots = getEnemyShipDashboardSnapshots(state);

        expect(snapshots).toHaveLength(1);

        const snapshot = snapshots[0];

        expect(snapshot).toBeDefined();

        if (!snapshot) {
            throw new Error('Expected enemy dashboard snapshot');
        }

        expect(snapshot.actorId).toBe(targetActor.id);
        expect(snapshot.displayName).toBe(targetActor.displayName);
        expect(snapshot.chassisId).toBe(targetActor.chassisId);
        expect(snapshot.hull).toEqual({
            current: targetActor.hull,
            max: targetActor.maxHull,
        });
        expect(snapshot.mounts).toEqual(targetActor.mounts);

        expect(snapshot.powerCore).toMatchObject({
            id: powerCore.id,
            definitionId: powerCore.powerCoreId,
            charges: 1,
            capacity: powerCoreDefinition.capacity,
            rechargeProgress: 0.5,
            integrity: {
                current: powerCore.integrity,
                max: powerCoreDefinition.maxIntegrity,
            },
        });
        expect(snapshot.powerCore).not.toHaveProperty('state');
        expect(snapshot.powerCore).not.toHaveProperty('rechargeElapsedMs');

        expect(snapshot.drive).toMatchObject({
            id: 'drive_00',
            integrity: {
                current: targetActor.drive.integrity,
            },
        });
        expect(snapshot.defenseTurret).toMatchObject({
            id: 'defense_turret_00',
        });
        expect(snapshot.shieldGenerator).toMatchObject({
            id: 'shield_generator_00',
        });
        expect(snapshot.weapons).toHaveLength(1);
        expect(snapshot.weapons[0]).toMatchObject({
            id: 'missile_launcher_00',
            kind: 'missile_launcher',
        });

        expect(snapshot.weapons[0]).not.toHaveProperty('ammoCount');
        expect(snapshot.weapons[0]).not.toHaveProperty('cooldownRemainingMs');
        expect(snapshot).not.toHaveProperty('crewTasks');
        expect(snapshot).not.toHaveProperty('decision');

        snapshot.mounts[0]!.slotId = 'mutated_for_test';

        expect(targetActor.mounts[0]?.slotId).toBe('drive');
    });
});
