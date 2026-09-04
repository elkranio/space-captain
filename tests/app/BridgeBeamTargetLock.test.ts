import { describe, expect, it } from 'vitest';
import { mapEnemyShipToBridgeDashboardPayload } from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgeEnemyShipDashboardMapper';
import { getEnemyShipDashboardSnapshots } from '../../src/engine/encounter/combat/queries/get_enemy_ship_dashboard_snapshots';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND } from '../../src/engine/encounter/model/command';
import { SHIP_WEAPONS } from '../../src/engine/content/catalogs/ship_weapons';
import { SHIP_WEAPON_ID } from '../../src/engine/defs/ship_weapon';
import { createAnchoredPlayerCombatTestSetup } from '../engine/encounter/combat_test_support';

describe('Beam target-lock dashboard mapping', () => {
    it.each(['completion', 'cancellation'])(
        'marks only the active task slot and clears on %s', (ending) => {
            const { engine, state, targetActor } = createAnchoredPlayerCombatTestSetup();
            targetActor.crewRoles = [];
            const read = () => mapEnemyShipToBridgeDashboardPayload(getEnemyShipDashboardSnapshots(state)[0]);
            const lockedSlots = () => read().equipment.filter((item) => item.targetLocked).map((item) => item.slotId);
            expect(lockedSlots()).toEqual([]);
            expect(engine.executeCommand({
                role: OFFICER_ROLE.GUNNER, commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,
                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON_NODE,
                    weaponId: 'beam_cannon_player_00', actorId: targetActor.id,
                    node: { kind: 'slot', slotId: 'defense_02' },
                },
            })).toEqual({ status: 'executed' });
            targetActor.mounts.reverse();
            expect(lockedSlots()).toEqual(['defense_02']);
            expect(read().equipment.find((item) => item.targetLocked)?.id).toBe(targetActor.shieldGenerator!.id);
            const snapshot = getEnemyShipDashboardSnapshots(state)[0];
            snapshot.beamTargetSlotId = 'drive';
            expect(lockedSlots()).toEqual(['defense_02']);
            if (ending === 'cancellation') engine.cancelTask(engine.getOfficerTasks()[0].id);
            else engine.step(SHIP_WEAPONS[SHIP_WEAPON_ID.BEAM_CANNON_00].chargeDurationMs);
            expect(lockedSlots()).toEqual([]);
        },
    );
});
