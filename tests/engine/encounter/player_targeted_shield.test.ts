import { describe, expect, it } from 'vitest';
import { getTimedOfficerTaskDurationMs } from '../../../src/engine/content/catalogs/officer_tasks';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonState,
} from '../../../src/engine/defs/ship_weapon';
import {
    BEAM_CANNON_SHOT_OUTCOME,
    BEAM_CANNON_TARGET_INTEL_STATUS,
    BEAM_CANNON_TARGET_NODE,
    COMBAT_TARGET_KIND,
    type BeamCannonTargetNode,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import { ENCOUNTER_EVENT } from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import {
    createAnchoredPlayerCombatTestSetup,
    type AnchoredPlayerCombatTestSetup,
} from './combat_test_support';

const DEPLOY_DURATION_MS = getTimedOfficerTaskDurationMs(OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD);

function makeEnemyPassive(setup: AnchoredPlayerCombatTestSetup): void {
    setup.targetActor.crewRoles = [];
    setup.targetActor.crewTasks = {};
    setup.targetActor.weapons = [];
}

function primeIncomingBeam(
    setup: AnchoredPlayerCombatTestSetup,
    targetNode: BeamCannonTargetNode,
    remainingChargeMs: number,
): string {
    const definition = SHIP_WEAPONS[SHIP_WEAPON_ID.BEAM_CANNON_00];

    if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error('Expected Beam Cannon definition');
    }

    if (remainingChargeMs < 0 || remainingChargeMs > definition.chargeDurationMs) {
        throw new Error('Invalid remaining Beam Cannon charge time');
    }

    const beamCannon: BeamCannonState = {
        id: 'targeted_shield_beam_cannon_00',
        weaponId: SHIP_WEAPON_ID.BEAM_CANNON_00,
        kind: SHIP_WEAPON_KIND.BEAM_CANNON,
        phase: SHIP_WEAPON_PHASE.CHARGING,
        phaseElapsedMs: definition.chargeDurationMs - remainingChargeMs,
        cooldownRemainingMs: 0,
    };

    setup.targetActor.weapons.push(beamCannon);

    const attackId = 'targeted_shield_attack_00';

    setup.state.combat.beamCannonAttacks.push({
        id: attackId,
        designation: 'L99',
        sourceActorId: setup.targetActor.id,
        sourceWeaponId: beamCannon.id,
        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },
        targetNode,
        targetIntel: {
            status: BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN,
        },
    });

    return attackId;
}

describe('player targeted shield', () => {
    it('offers explicit HULL and DRIVE shield targets', () => {
        const { engine } = createAnchoredPlayerCombatTestSetup();

        const commands = engine.getAvailableCommands(OFFICER_ROLE.ENGINEER).filter((command) => {
            return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;
        });

        expect(commands).toEqual([
            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,
                label: 'DEPLOY SHIELD',
                targetLabel: 'HULL',
                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
                    targetNode: BEAM_CANNON_TARGET_NODE.HULL,
                },
            },
            {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,
                label: 'DEPLOY SHIELD',
                targetLabel: 'DRIVE',
                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
                    targetNode: BEAM_CANNON_TARGET_NODE.DRIVE,
                },
            },
        ]);
    });

    it('lets a wrong-node Beam penetrate without consuming the shield', () => {
        const setup = createAnchoredPlayerCombatTestSetup();
        const { engine, state } = setup;
        makeEnemyPassive(setup);

        const result = engine.executeCommand({
            role: OFFICER_ROLE.ENGINEER,
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,
            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
                targetNode: BEAM_CANNON_TARGET_NODE.HULL,
            },
        });

        expect(result.status).toBe(OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED);

        engine.step(DEPLOY_DURATION_MS);
        engine.drainEvents();

        if (!state.combat.activeShield) {
            throw new Error('Expected active targeted shield');
        }

        const shieldBeforeImpact = {
            ...state.combat.activeShield,
        };
        const driveIntegrityBefore = state.drive.integrity;
        const attackId = primeIncomingBeam(setup, BEAM_CANNON_TARGET_NODE.DRIVE, 0);

        engine.step(0);

        expect(state.drive.integrity).toBeLessThan(driveIntegrityBefore);
        expect(state.combat.activeShield).toEqual(shieldBeforeImpact);

        const events = engine.drainEvents();
        const firedEvent = events.find((event) => {
            return event.type === ENCOUNTER_EVENT.BEAM_CANNON_FIRED && event.attack.id === attackId;
        });

        expect(firedEvent).toMatchObject({
            type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,
            outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
        });
        expect(events.some((event) => event.type === ENCOUNTER_EVENT.PLAYER_SHIELD_ENDED)).toBe(false);
    });

    it('deploys before a matching Beam impact crossed by the same engine step', () => {
        const setup = createAnchoredPlayerCombatTestSetup();
        const { engine, state } = setup;
        makeEnemyPassive(setup);

        const result = engine.executeCommand({
            role: OFFICER_ROLE.ENGINEER,
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,
            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.PLAYER_SHIP_NODE,
                targetNode: BEAM_CANNON_TARGET_NODE.HULL,
            },
        });

        expect(result.status).toBe(OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED);

        const attackId = primeIncomingBeam(setup, BEAM_CANNON_TARGET_NODE.HULL, DEPLOY_DURATION_MS);
        const hullBefore = state.playerHull.hull;

        engine.step(DEPLOY_DURATION_MS);

        expect(state.playerHull.hull).toBe(hullBefore);
        expect(state.combat.activeShield).toBeNull();

        const events = engine.drainEvents();
        const deployedIndex = events.findIndex((event) => event.type === ENCOUNTER_EVENT.PLAYER_SHIELD_DEPLOYED);
        const firedIndex = events.findIndex((event) => {
            return event.type === ENCOUNTER_EVENT.BEAM_CANNON_FIRED && event.attack.id === attackId;
        });

        expect(deployedIndex).toBeGreaterThanOrEqual(0);
        expect(firedIndex).toBeGreaterThan(deployedIndex);
        expect(events[firedIndex]).toMatchObject({
            type: ENCOUNTER_EVENT.BEAM_CANNON_FIRED,
            outcome: BEAM_CANNON_SHOT_OUTCOME.ABSORBED,
        });
    });
});
