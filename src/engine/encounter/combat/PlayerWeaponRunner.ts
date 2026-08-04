// src/engine/encounter/combat/PlayerWeaponRunner.ts

import { SHIP_WEAPONS } from '../../content/catalogs/ship_weapons';
import type { MissileId } from '../../defs/missile';
import { OFFICER_ROLE } from '../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponDefinition,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type { StickyMineId } from '../../defs/sticky_mine';
import type { EncounterEvent } from '../model/event';
import {
    OFFICER_TASK_KIND,
} from '../model/officer_task';
import OfficerPerformanceResolver from '../officer_performance/OfficerPerformanceResolver';
import type EncounterStateStore from '../state/EncounterStateStore';
import PlayerLaserRunner from './PlayerLaserRunner';
import PlayerMissileLauncherRunner from './PlayerMissileLauncherRunner';
import PlayerSpamProjectorRunner from './PlayerSpamProjectorRunner';
import PlayerStickyMineDispenserRunner from './PlayerStickyMineDispenserRunner';

type PlayerWeaponRunnerOptions = {
    stateStore: EncounterStateStore;

    queuePlayerStickyMineAttach: (
        input: {
            sourceWeaponId: string;
            mineId: StickyMineId;
            targetActorId: string;
            ageMs: number;
        },
    ) => void;

    queuePlayerMissileLaunch: (
        input: {
            sourceWeaponId: string;
            missileId: MissileId;
            targetActorId: string;
        },
    ) => void;

    destroyEnemyActor:
        (actorId: string) => void;

    emit: (event: EncounterEvent) => void;

    completeOfficerTask:
        (taskId: string) => void;
};

// Owns the shared player-weapon cooldown phase and dispatches each active
// weapon family to its concrete lifecycle owner.
//
// Cooldowns for every installed weapon advance before the active Weapons
// officer task, matching the locked encounter-step contract.
export default class PlayerWeaponRunner {
    private readonly missileLauncherRunner:
        PlayerMissileLauncherRunner;

    private readonly stickyMineDispenserRunner:
        PlayerStickyMineDispenserRunner;

    private readonly laserRunner:
        PlayerLaserRunner;

    private readonly spamProjectorRunner:
        PlayerSpamProjectorRunner;

    private readonly stateStore:
        EncounterStateStore;

    constructor({
        stateStore,
        ...options
    }: PlayerWeaponRunnerOptions) {
        this.stateStore = stateStore;

        const performanceResolver =
            new OfficerPerformanceResolver(
                this.stateStore,
            );

        this.missileLauncherRunner =
            new PlayerMissileLauncherRunner({
                stateStore:
                    this.stateStore,
                performanceResolver,
                queuePlayerMissileLaunch:
                    options.queuePlayerMissileLaunch,
                completeOfficerTask:
                    options.completeOfficerTask,
            });

        this.stickyMineDispenserRunner =
            new PlayerStickyMineDispenserRunner({
                stateStore:
                    this.stateStore,
                performanceResolver,
                queuePlayerStickyMineAttach:
                    options.queuePlayerStickyMineAttach,
                completeOfficerTask:
                    options.completeOfficerTask,
            });

        this.spamProjectorRunner =
            new PlayerSpamProjectorRunner({
                stateStore:
                    this.stateStore,

                performanceResolver,

                emit:
                    options.emit,

                completeOfficerTask:
                    options.completeOfficerTask,
            });

        this.laserRunner =
            new PlayerLaserRunner({
                stateStore:
                    this.stateStore,
                performanceResolver,
                emit:
                    options.emit,
                completeOfficerTask:
                    options.completeOfficerTask,
                destroyEnemyActor:
                    options.destroyEnemyActor,
            });
    }

    public step(deltaMs: number): void {
        this.advanceCooldowns(deltaMs);

        const scienceTask =
            this.stateStore.getOfficerTask(
                OFFICER_ROLE.SCIENCE,
            );

        if (
            scienceTask?.kind ===
            OFFICER_TASK_KIND
                .SCIENCE_FIRE_SPAM
        ) {
            this.spamProjectorRunner
                .advanceTask(
                    scienceTask,
                    deltaMs,
                );
        }

        const task =
            this.stateStore.getOfficerTask(
                OFFICER_ROLE.WEAPONS,
            );

        if (!task) {
            return;
        }

        switch (task.kind) {
            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_MISSILE:
                this.missileLauncherRunner
                    .advanceTask(
                        task,
                        deltaMs,
                    );
                return;

            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES:
                this.stickyMineDispenserRunner
                    .advanceTask(
                        task,
                        deltaMs,
                    );
                return;

            case OFFICER_TASK_KIND
                .WEAPONS_FIRE_LASER:
                this.laserRunner.advanceTask(
                    task,
                    deltaMs,
                );
                return;

            default:
                return;
        }
    }

    private advanceCooldowns(
        deltaMs: number,
    ): void {
        const weapons =
            this.stateStore
                .getState()
                .combat
                .playerWeapons;

        for (const weapon of weapons) {
            if (
                weapon.phase !==
                SHIP_WEAPON_PHASE.COOLDOWN
            ) {
                continue;
            }

            const definition =
                this.getWeaponDefinition(
                    weapon,
                );

            weapon.phaseElapsedMs += deltaMs;

            if (
                weapon.phaseElapsedMs <
                definition.cooldownDurationMs
            ) {
                continue;
            }

            weapon.phase =
                SHIP_WEAPON_PHASE.READY;
            weapon.phaseElapsedMs = 0;

            if (
                weapon.kind ===
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER
            ) {
                weapon.dispensedMineCount = 0;
            }
        }
    }

    private getWeaponDefinition(
        weapon: ShipWeaponState,
    ): ShipWeaponDefinition {
        const definition =
            SHIP_WEAPONS[weapon.weaponId];

        if (
            definition.kind !==
            weapon.kind
        ) {
            throw new Error(
                'Player weapon kind does not match definition: ' +
                    `${weapon.id}/` +
                    `${weapon.weaponId}`,
            );
        }

        return definition;
    }
}
