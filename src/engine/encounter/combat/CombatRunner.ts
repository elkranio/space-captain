// src/engine/encounter/combat/CombatRunner.ts

import {
    SHIP_WEAPON_KIND,
} from '../../defs/ship_weapon';
import type { EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';
import EncounterStateStore from '../state/EncounterStateStore';
import CombatLaserRunner from './CombatLaserRunner';
import EnemyPointDefenseRunner from './EnemyPointDefenseRunner';
import CombatMissileRunner, {
    type PlayerMissileLaunchInput,
} from './CombatMissileRunner';
import CombatRuntimeIdentityFactory from './CombatRuntimeIdentityFactory';
import CombatSpamRunner from './CombatSpamRunner';
import CombatStickyMineRunner, {
    type PlayerStickyMineAttachInput,
} from './CombatStickyMineRunner';
import EnemyTaskScheduler from './EnemyTaskScheduler';
import EnemyThreatObserver from './EnemyThreatObserver';

type CombatStepExistingObjectIds = {
    projectileIds: string[];
    stickyMineIds: string[];
};

type CombatRunnerOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    random: () => number;

    interruptRandomOfficerTask: () => void;

    destroyEnemyActor:
        (actorId: string) => void;
};

// Владеет боевым циклом encounter:
//
// - исполняет решения enemy task scheduler;
// - фиксирует порядок combat phases;
// - оркестрирует concrete weapon-family runners;
// - делегирует каждый weapon lifecycle его concrete runner-у;
// - эмитит combat events.
//
// Корабли, оружие и угрозы остаются частью EncounterState.
// Статические параметры моделей оружия читаются из content.
export default class CombatRunner {
    private readonly stateStore:
        EncounterStateStore;

    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly interruptRandomOfficerTask: () => void;

    private readonly destroyEnemyActor:
        CombatRunnerOptions[
            'destroyEnemyActor'
        ];

    private readonly enemyTaskScheduler:
        EnemyTaskScheduler;

    private readonly enemyThreatObserver:
        EnemyThreatObserver;

    private readonly identities:
        CombatRuntimeIdentityFactory;

    private readonly missileRunner:
        CombatMissileRunner;

    private readonly pointDefenseRunner:
        EnemyPointDefenseRunner;

    private readonly laserRunner:
        CombatLaserRunner;

    private readonly stickyMineRunner:
        CombatStickyMineRunner;

    private readonly spamRunner:
        CombatSpamRunner;

    constructor({
        stateStore,
        emit,

        random,

        interruptRandomOfficerTask,
        destroyEnemyActor,
    }: CombatRunnerOptions) {
        this.stateStore =
            stateStore;

        this.state =
            this.stateStore
                .getState();

        this.emit = emit;

        this.interruptRandomOfficerTask = interruptRandomOfficerTask;

        this.destroyEnemyActor =
            destroyEnemyActor;

        this.identities =
            new CombatRuntimeIdentityFactory();

        this.missileRunner =
            new CombatMissileRunner({
                stateStore:
                    this.stateStore,

                identities:
                    this.identities,

                emit:
                    this.emit,

                destroyEnemyActor:
                    this.destroyEnemyActor,
            });

        this.pointDefenseRunner =
            new EnemyPointDefenseRunner({
                state: this.state,

                emit: this.emit,

                interceptPlayerMissile:
                    (
                        projectileId,
                        targetActorId,
                    ) => {
                        return this
                            .missileRunner
                            .interceptPlayerMissile(
                                projectileId,
                                targetActorId,
                            );
                    },
            });

        this.laserRunner =
            new CombatLaserRunner({
                stateStore:
                    this.stateStore,

                identities:
                    this.identities,

                emit:
                    this.emit,

                random,

                interruptRandomOfficerTask:
                    this.interruptRandomOfficerTask,
            });

        this.stickyMineRunner =
            new CombatStickyMineRunner({
                stateStore:
                    this.stateStore,

                identities:
                    this.identities,

                emit:
                    this.emit,

                interruptRandomOfficerTask:
                    this.interruptRandomOfficerTask,

                destroyEnemyActor:
                    this.destroyEnemyActor,
            });

        this.spamRunner =
            new CombatSpamRunner({
                stateStore:
                    this.stateStore,

                identities:
                    this.identities,

                emit:
                    this.emit,
            });

        this.enemyTaskScheduler =
            new EnemyTaskScheduler({
                state: this.state,
                emit: this.emit,
                random,
            });

        this.enemyThreatObserver =
            new EnemyThreatObserver(
                this.state,
            );
    }

    public step(deltaMs: number): void {
        const existingCombatObjectIds =
            this.captureExistingCombatObjectIds();

        this.integratePendingPlayerCombatObjects();
        this.perceivePlayerThreats();

        this.resolveExistingCombatObjects(
            existingCombatObjectIds,
            deltaMs,
        );

        this.perceivePlayerThreats();
        this.decideEnemyWork(deltaMs);
        this.advanceEnemyCombatSystems(deltaMs);
        this.finalizeEnemyCrewTasks();
    }

    private captureExistingCombatObjectIds():
        CombatStepExistingObjectIds {
        // PlayerWeaponRunner уже выполнил физический launch,
        // но новые combat objects пока лежат в очередях.
        // Snapshot содержит только объекты, существовавшие
        // до начала этого combat step.
        return {
            projectileIds:
                this.missileRunner
                    .captureExistingProjectileIds(),

            stickyMineIds:
                this.stickyMineRunner
                    .captureExistingMineIds(),
        };
    }

    private integratePendingPlayerCombatObjects():
        void {
        // Новый launch должен существовать до resolution
        // старых угроз: lethal impact сможет сразу завершить
        // его как TARGET_LOST. При этом новый объект
        // отсутствует в captured IDs и не получает
        // текущий deltaMs.
        this.missileRunner
            .integratePendingPlayerLaunches();
        this.stickyMineRunner
            .integratePendingPlayerAttachments();
    }

    private perceivePlayerThreats(): void {
        this.enemyThreatObserver
            .synchronize();
    }

    private resolveExistingCombatObjects(
        existingIds:
            CombatStepExistingObjectIds,
        deltaMs: number,
    ): void {
        this.missileRunner
            .advanceExistingProjectiles(
            existingIds.projectileIds,
            deltaMs,
        );

        this.stickyMineRunner
            .advanceExistingMines(
            existingIds.stickyMineIds,
            deltaMs,
        );
    }

    private decideEnemyWork(
        deltaMs: number,
    ): void {
        // Scheduler сначала двигает текущие crew tasks
        // и policy timers, затем выбирает и запускает
        // новую работу доступных ролей.
        this.enemyTaskScheduler
            .schedule(deltaMs);
    }

    private finalizeEnemyCrewTasks(): void {
        // Weapon advancement мог освободить оператора.
        this.enemyTaskScheduler
            .synchronizeTasks();
    }

    public purgeSpamChannel(channelId: string): boolean {
        const purged =
            this.spamRunner
                .purgeChannel(channelId);

        if (purged) {
            this.enemyTaskScheduler
                .synchronizeTasks();
        }

        return purged;
    }

    public queuePlayerMissileLaunch(
        input: PlayerMissileLaunchInput,
    ): void {
        this.missileRunner
            .queuePlayerLaunch(input);
    }

    public queuePlayerStickyMineAttach(
        input: PlayerStickyMineAttachInput,
    ): void {
        this.stickyMineRunner
            .queuePlayerAttach(input);
    }

    public clearStickyMine(mineId: string): boolean {
        return this.stickyMineRunner
            .clearMine(mineId);
    }

    public removePlayerCombatObjectsTargetingActor(
        actorId: string,
    ): void {
        this.missileRunner
            .removePlayerMissilesTargetingActor(
                actorId,
            );

        this.stickyMineRunner
            .removePlayerMinesTargetingActor(
                actorId,
            );
    }

    // #region Enemy combat-system lifecycle

    private advanceEnemyCombatSystems(
        deltaMs: number,
    ): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                continue;
            }

            if (actor.pointDefense) {
                this.pointDefenseRunner
                    .advance(
                        actor,
                        actor.pointDefense,
                        deltaMs,
                    );
            }

            for (const weapon of actor.weapons) {
                switch (weapon.kind) {
                    case SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER:
                        this.missileRunner
                            .advanceEnemyLauncher(
                                actor,
                                weapon,
                                deltaMs,
                            );
                        break;

                    case SHIP_WEAPON_KIND.LASER:
                        this.laserRunner
                            .advanceEnemyLaser(
                                actor,
                                weapon,
                                deltaMs,
                            );
                        break;

                    case SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER:
                        this.stickyMineRunner
                            .advanceEnemyDispenser(
                                actor,
                                weapon,
                                deltaMs,
                            );
                        break;

                    case SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR:
                        this.spamRunner
                            .advanceEnemyProjector(
                                actor,
                                weapon,
                                deltaMs,
                            );
                        break;
                }
            }
        }
    }

    // #endregion

}
