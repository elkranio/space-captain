// src/engine/encounter/combat/CombatRunner.ts

import { doesDefenseTurretPhaseAdvanceWithCrew } from "../../defs/defense_turret";
import { doesShipWeaponPhaseAdvanceWithCrew, SHIP_WEAPON_KIND } from "../../defs/ship_weapon";
import type { EncounterEvent } from "../model/event";
import type { EncounterInternalEffectSink } from "../model/internal_effect";
import type { EncounterState } from "../model/state";
import EncounterStateStore from "../state/EncounterStateStore";
import CombatBeamCannonRunner from "./beam_cannon/CombatBeamCannonRunner";
import EnemyDefenseTurretRunner from "./defense_turret/EnemyDefenseTurretRunner";
import EnemyShieldRunner from "./shield/EnemyShieldRunner";
import CombatMissileRunner, { type PlayerMissileLaunchInput } from "./missile/CombatMissileRunner";
import CombatRuntimeIdentityFactory from "./CombatRuntimeIdentityFactory";
import { getActorCrewProgressMultiplier } from "../crew_performance/get_crew_progress_multiplier";
import CombatSpamRunner from "./weapons/spam/CombatSpamRunner";
import CombatStickyMineRunner, { type PlayerStickyMineAttachInput } from "./sticky_mine/CombatStickyMineRunner";
import EnemyBehaviorRunner from "./enemy/EnemyBehaviorRunner";

type CombatStepExistingObjectIds = {
    projectileIds: string[];
    stickyMineIds: string[];
};

type CombatRunnerOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    random: () => number;

    destroyEnemyActor: (actorId: string) => void;

    applyInternalEffect: EncounterInternalEffectSink;
};

// Владеет боевым циклом encounter:
//
// - делегирует enemy behavior одному root runner;
// - фиксирует порядок combat phases;
// - оркестрирует concrete weapon-family runners;
// - делегирует каждый weapon lifecycle его concrete runner-у;
// - эмитит combat events.
//
// Корабли, оружие и угрозы остаются частью EncounterState.
// Статические параметры моделей оружия читаются из content.
export default class CombatRunner {
    private readonly state: EncounterState;

    private readonly enemyBehaviorRunner: EnemyBehaviorRunner;

    private readonly enemyShieldRunner: EnemyShieldRunner;

    private readonly identities: CombatRuntimeIdentityFactory;

    private readonly missileRunner: CombatMissileRunner;

    private readonly defenseTurretRunner: EnemyDefenseTurretRunner;

    private readonly beamCannonRunner: CombatBeamCannonRunner;

    private readonly stickyMineRunner: CombatStickyMineRunner;

    private readonly spamRunner: CombatSpamRunner;

    constructor({
        stateStore,
        emit,

        random,

        destroyEnemyActor,
        applyInternalEffect,
    }: CombatRunnerOptions) {
        this.state = stateStore.getState();

        this.identities = new CombatRuntimeIdentityFactory();

        this.enemyShieldRunner = new EnemyShieldRunner(this.state);

        this.missileRunner = new CombatMissileRunner({
            stateStore,

            identities: this.identities,

            random,

            emit,

            destroyEnemyActor,
        });

        this.defenseTurretRunner = new EnemyDefenseTurretRunner({
            state: this.state,

            emit,

            random,

            missileRunner: this.missileRunner,
        });

        this.beamCannonRunner = new CombatBeamCannonRunner({
            stateStore,

            identities: this.identities,

            random,

            emit,
            applyInternalEffect,
        });

        this.stickyMineRunner = new CombatStickyMineRunner({
            stateStore,

            identities: this.identities,

            emit,

            destroyEnemyActor,
            applyInternalEffect,
        });

        this.spamRunner = new CombatSpamRunner({
            stateStore,

            identities: this.identities,

            emit,
        });

        this.enemyBehaviorRunner = new EnemyBehaviorRunner({
            state: this.state,
            emit,

            clearPlayerStickyMine: (mineId, targetActorId) => {
                return this.stickyMineRunner.clearPlayerMineFromActor(mineId, targetActorId);
            },

            deployEnemyShield: (actor) => {
                this.enemyShieldRunner.deploy(actor);
            },

            applyInternalEffect,
            random,
        });
    }

    public step(deltaMs: number): void {
        // Existing shield/emitter time advances before new enemy work.
        // A field deployed later in this step starts at full duration.
        this.enemyShieldRunner.step(deltaMs);

        const existingCombatObjectIds = this.captureExistingCombatObjectIds();

        this.integratePendingPlayerCombatObjects();

        this.resolveExistingCombatObjects(existingCombatObjectIds, deltaMs);

        this.advanceEnemyBehavior(deltaMs);
        this.advanceEnemyCombatSystems(deltaMs);
        this.finalizeEnemyCrewTasks();
    }

    private captureExistingCombatObjectIds(): CombatStepExistingObjectIds {
        // PlayerWeaponRunner уже выполнил физический launch,
        // но новые combat objects пока лежат в очередях.
        // Snapshot содержит только объекты, существовавшие
        // до начала этого combat step.
        return {
            projectileIds: this.missileRunner.captureExistingProjectileIds(),

            stickyMineIds: this.stickyMineRunner.captureExistingMineIds(),
        };
    }

    private integratePendingPlayerCombatObjects(): void {
        // Новый launch должен существовать до resolution
        // старых угроз: lethal impact сможет сразу завершить
        // его как TARGET_LOST. При этом новый объект
        // отсутствует в captured IDs и не получает
        // текущий deltaMs.
        this.missileRunner.integratePendingPlayerLaunches();
        this.stickyMineRunner.integratePendingPlayerAttachments();
    }

    private resolveExistingCombatObjects(existingIds: CombatStepExistingObjectIds, deltaMs: number): void {
        this.missileRunner.advanceExistingProjectiles(existingIds.projectileIds, deltaMs);

        this.stickyMineRunner.advanceExistingMines(existingIds.stickyMineIds, deltaMs);
    }

    private advanceEnemyBehavior(deltaMs: number): void {
        this.enemyBehaviorRunner.step(deltaMs);
    }

    private finalizeEnemyCrewTasks(): void {
        // Weapon advancement мог освободить оператора.
        this.enemyBehaviorRunner.synchronizeTasks();
    }

    public purgeSpamChannel(channelId: string): boolean {
        const purged = this.spamRunner.purgeChannel(channelId);

        if (purged) {
            this.enemyBehaviorRunner.synchronizeTasks();
        }

        return purged;
    }

    public queuePlayerMissileLaunch(input: PlayerMissileLaunchInput): void {
        this.missileRunner.queuePlayerLaunch(input);
    }

    public queuePlayerStickyMineAttach(input: PlayerStickyMineAttachInput): void {
        this.stickyMineRunner.queuePlayerAttach(input);
    }

    public clearStickyMine(mineId: string): boolean {
        return this.stickyMineRunner.clearMine(mineId);
    }

    public removePlayerCombatObjectsTargetingActor(actorId: string): void {
        this.missileRunner.removePlayerMissilesTargetingActor(actorId);

        this.stickyMineRunner.removePlayerMinesTargetingActor(actorId);
    }

    // #region Enemy combat-system lifecycle

    private advanceEnemyCombatSystems(deltaMs: number): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                continue;
            }

            const crewDeltaMs = deltaMs * getActorCrewProgressMultiplier(this.state, actor.id);

            if (actor.defenseTurret) {
                const defenseTurretDeltaMs = doesDefenseTurretPhaseAdvanceWithCrew(actor.defenseTurret.phase)
                    ? crewDeltaMs
                    : deltaMs;

                this.defenseTurretRunner.advance(actor, actor.defenseTurret, defenseTurretDeltaMs, deltaMs);
            }

            for (const weapon of actor.weapons) {
                const weaponDeltaMs = doesShipWeaponPhaseAdvanceWithCrew(weapon.kind, weapon.phase)
                    ? crewDeltaMs
                    : deltaMs;

                switch (weapon.kind) {
                    case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                        this.missileRunner.advanceEnemyLauncher(actor, weapon, weaponDeltaMs, deltaMs);
                        break;

                    case SHIP_WEAPON_KIND.BEAM_CANNON:
                        this.beamCannonRunner.advanceEnemyBeamCannon(actor, weapon, weaponDeltaMs, deltaMs);
                        break;

                    case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                        this.stickyMineRunner.advanceEnemyDispenser(actor, weapon, weaponDeltaMs, deltaMs);
                        break;

                    case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                        this.spamRunner.advanceEnemyProjector(actor, weapon, weaponDeltaMs, deltaMs);
                        break;
                }
            }
        }
    }

    // #endregion
}
