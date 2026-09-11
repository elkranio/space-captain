import { afterEach, describe, expect, it } from 'vitest';
import { DEFENSE_TURRETS } from '../../../src/engine/content/catalogs/defense_turrets';
import { SHIELD_GENERATORS } from '../../../src/engine/content/catalogs/shield_generators';
import { SHIP_DRIVES } from '../../../src/engine/content/catalogs/ship_drives';
import { SHIP_WEAPONS } from '../../../src/engine/content/catalogs/ship_weapons';
import { OFFICER_ROLE, type OfficerRole } from '../../../src/engine/defs/officer';
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../src/engine/defs/ship_weapon';
import EnemyCrewTaskRunner from '../../../src/engine/encounter/combat/enemy/EnemyCrewTaskRunner';
import EnemyDecisionPolicy from '../../../src/engine/encounter/combat/enemy/EnemyDecisionPolicy';
import EnemyWorkExecutor from '../../../src/engine/encounter/combat/enemy/EnemyWorkExecutor';
import {
    getEnemyCaptainDecisionSnapshot,
} from '../../../src/engine/encounter/combat/queries/get_enemy_captain_decision_snapshot';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type EncounterOfficerCommandId,
} from '../../../src/engine/encounter/model/command';
import {
    COMBAT_PROJECTILE_KIND, COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND,
} from '../../../src/engine/encounter/model/combat';
import {
    ENEMY_THREAT_KIND, ENEMY_THREAT_SOURCE_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import { SHIP_CREW_TASK_KIND } from '../../../src/engine/encounter/model/ship_crew_task';
import ShipDefenseTurretFactory from '../../../src/engine/generation/ship_system/ShipDefenseTurretFactory';
import SpamProjectorFactory from '../../../src/engine/generation/ship_weapon/SpamProjectorFactory';
import {
    createAnchoredPlayerCombatTestSetup, getPlayerWeaponOrThrow, type AnchoredPlayerCombatTestSetup,
} from './combat_test_support';

const CONTENT_ID = 'test_operation_timing';

afterEach(() => {
    delete SHIP_WEAPONS[CONTENT_ID];
    delete SHIELD_GENERATORS[CONTENT_ID];
    delete SHIP_DRIVES[CONTENT_ID];
    delete DEFENSE_TURRETS[CONTENT_ID];
});

function startCommand(setup: AnchoredPlayerCombatTestSetup, role: OfficerRole, commandId: EncounterOfficerCommandId) {
    const command = setup.engine.getAvailableCommands(role).find((candidate) => candidate.commandId === commandId);
    if (!command) throw new Error('Expected command: ' + commandId);
    expect(setup.engine.executeCommand({ role, commandId, target: command.target })).toEqual({ status: 'executed' });
}

function addIncomingMissile(setup: AnchoredPlayerCombatTestSetup) {
    setup.state.combat.projectiles.push({
        id: 'timing_missile', designation: 'M1', kind: COMBAT_PROJECTILE_KIND.MISSILE,
        source: { kind: COMBAT_SOURCE_KIND.ACTOR, actorId: setup.targetActor.id },
        sourceWeaponId: 'enemy_launcher', target: { kind: COMBAT_TARGET_KIND.PLAYER_SHIP },
        timeToImpactMs: 60000, initialTimeToImpactMs: 60000, damage: 1,
    });
}

function activatePlayerSpam(setup: AnchoredPlayerCombatTestSetup) {
    startCommand(setup, OFFICER_ROLE.SCIENTIST, ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM);
    setup.engine.step(SHIP_WEAPONS.spam_projector_00.warmupDurationMs);

    expect(getPlayerWeaponOrThrow(setup.state, SHIP_WEAPON_KIND.SPAM_PROJECTOR)).toMatchObject({
        phase: SHIP_WEAPON_PHASE.CHANNELING,
        activeChannelId: expect.any(String),
    });
}

describe('Equipment owns base execution timing', () => {
    // Two non-default durations catch fallback to a builtin definition or old role tuning.
    describe.each([800, 1600])('base duration %i ms', (durationMs) => {
        it.each(['missile', 'mine', 'turret', 'shield', 'repair'] as const)(
            'resolves player %s from installed content and preserves SPAM slowdown', (operation) => {
                const setup = createAnchoredPlayerCombatTestSetup();
                const { engine, state, targetActor } = setup;
                targetActor.crewRoles = [];
                targetActor.weapons = [{
                    ...SpamProjectorFactory.create({ id: 'hostile_spam', weaponId: 'spam_projector_00' }),
                    integrity: SHIP_WEAPONS.spam_projector_00.maxIntegrity,
                    phase: SHIP_WEAPON_PHASE.CHANNELING, activeChannelId: 'hostile_channel',
                }];
                delete targetActor.defenseTurret;

                let role: OfficerRole = OFFICER_ROLE.GUNNER;
                let commandId: EncounterOfficerCommandId;
                if (operation === 'missile' || operation === 'mine') {
                    const weapon = operation === 'missile'
                        ? getPlayerWeaponOrThrow(state, SHIP_WEAPON_KIND.MISSILE_LAUNCHER)
                        : getPlayerWeaponOrThrow(state, SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER);
                    const definition = SHIP_WEAPONS[weapon.weaponId];
                    if (!('targetingDurationMs' in definition)) throw new Error('Expected targeting weapon');
                    SHIP_WEAPONS[CONTENT_ID] = { ...definition, id: CONTENT_ID, targetingDurationMs: durationMs };
                    weapon.weaponId = CONTENT_ID;
                    commandId = operation === 'missile'
                        ? ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE
                        : ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES;
                } else if (operation === 'turret') {
                    DEFENSE_TURRETS[CONTENT_ID] = {
                        ...DEFENSE_TURRETS.defense_turret_basic_00, id: CONTENT_ID, loadDurationMs: durationMs,
                    };
                    state.combat.defenseTurret = {
                        ...ShipDefenseTurretFactory.create({ id: 'player_turret', defenseTurretId: CONTENT_ID }),
                        integrity: DEFENSE_TURRETS[CONTENT_ID].maxIntegrity,
                    };
                    addIncomingMissile(setup);
                    commandId = ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_INTERCEPT_MISSILE;
                } else if (operation === 'shield') {
                    const emitter = state.combat.shieldGenerator!;
                    SHIELD_GENERATORS[CONTENT_ID] = {
                        ...SHIELD_GENERATORS[emitter.shieldGeneratorId],
                        id: CONTENT_ID, deploymentDurationMs: durationMs,
                    };
                    emitter.shieldGeneratorId = CONTENT_ID;
                    role = OFFICER_ROLE.ENGINEER;
                    commandId = ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;
                } else {
                    SHIP_DRIVES[CONTENT_ID] = {
                        ...SHIP_DRIVES[state.drive.driveId], id: CONTENT_ID, repairDurationMs: durationMs,
                    };
                    state.drive.driveId = CONTENT_ID;
                    state.drive.integrity = 0;
                    role = OFFICER_ROLE.ENGINEER;
                    commandId = ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE;
                }

                startCommand(setup, role, commandId);
                expect(state.officerTasks[role]).toMatchObject({ durationMs, elapsedMs: 0 });
                const snapshot = engine.getCombatPresentationSnapshot();
                if (operation === 'missile' || operation === 'mine') {
                    expect(snapshot.player.weapons.find((weapon) => weapon.state.weaponId === CONTENT_ID))
                        .toMatchObject({ phaseDurationMs: durationMs });
                } else if (operation === 'turret') {
                    expect(snapshot.playerThreatDecisionTimings.missile.interceptMinRemainingMs).toBe(durationMs * 2);
                } else if (operation === 'shield') {
                    expect(snapshot.playerThreatDecisionTimings.beam.shieldWindow).toEqual({
                        closesAtRemainingMs: durationMs * 2,
                        opensAtRemainingMs: durationMs * 2 + SHIELD_GENERATORS[CONTENT_ID].shieldDurationMs,
                    });
                }

                engine.step(durationMs * 2 - 2);
                expect(state.officerTasks[role]).toMatchObject({ durationMs, elapsedMs: durationMs - 1 });
                engine.step(2);
                expect(state.officerTasks[role]).toBeUndefined();
                const completed = engine.getCombatPresentationSnapshot();
                if (operation === 'missile') expect(completed.outgoingMissiles).toHaveLength(1);
                if (operation === 'mine') expect(completed.outgoingStickyMines).toHaveLength(1);
                if (operation === 'turret') expect(state.combat.projectiles).toHaveLength(0);
                if (operation === 'shield') {
                    expect(state.combat.activeShield?.remainingDurationMs)
                        .toBe(SHIELD_GENERATORS[CONTENT_ID].shieldDurationMs);
                }
                if (operation === 'repair') expect(state.drive.integrity).toBe(SHIP_DRIVES[CONTENT_ID].maxIntegrity);
            },
        );

        it.each([SHIP_WEAPON_KIND.MISSILE_LAUNCHER, SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER])(
            'uses installed enemy %s timing for execution and captain occupancy', (kind) => {
                const setup = createAnchoredPlayerCombatTestSetup();
                const { engine, state, targetActor } = setup;
                targetActor.crewRoles = [];
                targetActor.crewTasks = {};
                targetActor.weapons = [];
                delete targetActor.defenseTurret;
                activatePlayerSpam(setup);

                const playerWeapon = kind === SHIP_WEAPON_KIND.MISSILE_LAUNCHER
                    ? getPlayerWeaponOrThrow(state, SHIP_WEAPON_KIND.MISSILE_LAUNCHER)
                    : getPlayerWeaponOrThrow(state, SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER);
                const definition = SHIP_WEAPONS[playerWeapon.weaponId];
                if (!('targetingDurationMs' in definition)) throw new Error('Expected targeting weapon');
                SHIP_WEAPONS[CONTENT_ID] = { ...definition, id: CONTENT_ID, targetingDurationMs: durationMs };
                const weapon = { ...playerWeapon, id: 'enemy_custom_weapon', weaponId: CONTENT_ID };
                targetActor.weapons = [weapon];
                targetActor.crewRoles = [OFFICER_ROLE.GUNNER];
                targetActor.crewTasks = {};
                targetActor.decision.decisionTickRemainingMs = 0;
                expect(getEnemyCaptainDecisionSnapshot(state, targetActor).weapons[0].operatorBusyDurationMs)
                    .toBe(durationMs);

                engine.step(0);
                expect(weapon.phase).toBe(SHIP_WEAPON_PHASE.TARGETING);
                const ammoBefore = weapon.ammoCount;
                engine.step(durationMs * 2 - 2);
                expect(weapon).toMatchObject({ phase: SHIP_WEAPON_PHASE.TARGETING, phaseElapsedMs: durationMs - 1 });
                expect(weapon.ammoCount).toBe(ammoBefore);
                engine.step(2);
                expect(weapon.ammoCount).toBe(ammoBefore - 1);
                expect(weapon.phase).toBe(SHIP_WEAPON_PHASE.COOLDOWN);
                expect(targetActor.crewTasks[OFFICER_ROLE.GUNNER]).toBeUndefined();
            },
        );

        it('uses the installed enemy shield for both decision window and slowed deployment', () => {
            const setup = createAnchoredPlayerCombatTestSetup();
            const { state, targetActor } = setup;
            targetActor.crewRoles = [];
            targetActor.crewTasks = {};
            targetActor.weapons = [];
            delete targetActor.defenseTurret;
            activatePlayerSpam(setup);

            // Install explicitly so this test does not depend on the enemy ship's loadout.
            targetActor.shieldGenerator = { ...state.combat.shieldGenerator! };
            const emitter = targetActor.shieldGenerator;
            SHIELD_GENERATORS[CONTENT_ID] = {
                ...SHIELD_GENERATORS[emitter.shieldGeneratorId], id: CONTENT_ID, deploymentDurationMs: durationMs,
            };
            emitter.shieldGeneratorId = CONTENT_ID;
            targetActor.crewRoles = [OFFICER_ROLE.ENGINEER];
            targetActor.threatObservations = [{
                id: 'beam_observation', kind: ENEMY_THREAT_KIND.BEAM_CANNON,
                source: { kind: ENEMY_THREAT_SOURCE_KIND.PLAYER_OFFICER_TASK, officerTaskId: 'beam_task' },
            }];
            const snapshot = getEnemyCaptainDecisionSnapshot(state, targetActor);
            snapshot.threats = [{
                kind: ENEMY_THREAT_KIND.BEAM_CANNON, observationId: 'beam_observation',
                officerTaskId: 'beam_task', weaponId: 'beam', estimatedRemainingChargeMs: durationMs + 1,
            }];
            const policy = new EnemyDecisionPolicy(() => 0.5);
            const intent = policy.selectWork(snapshot);
            expect(intent).toEqual({
                kind: SHIP_CREW_TASK_KIND.DEPLOY_SHIELD, role: OFFICER_ROLE.ENGINEER,
                observationId: 'beam_observation',
            });
            const threat = snapshot.threats[0];
            if (threat.kind !== ENEMY_THREAT_KIND.BEAM_CANNON) throw new Error('Expected beam threat');
            threat.estimatedRemainingChargeMs = durationMs - 1;
            expect(policy.selectWork(snapshot)).toBeUndefined();
            if (!intent) throw new Error('Expected shield deployment');

            const crewTaskRunner = new EnemyCrewTaskRunner({ state });
            const executor = new EnemyWorkExecutor({ state, crewTaskRunner, emit: () => {} });
            const chargesBefore = targetActor.powerCore!.charges;
            executor.start(targetActor, intent);
            expect(targetActor.powerCore!.charges).toBe(chargesBefore - 1);
            expect(crewTaskRunner.advance(durationMs * 2 - 2)).toEqual([]);
            expect(targetActor.crewTasks[OFFICER_ROLE.ENGINEER])
                .toMatchObject({ durationMs, elapsedMs: durationMs - 1 });
            expect(crewTaskRunner.advance(2)).toHaveLength(1);
            expect(targetActor.crewTasks[OFFICER_ROLE.ENGINEER]).toBeUndefined();
        });
    });
});
