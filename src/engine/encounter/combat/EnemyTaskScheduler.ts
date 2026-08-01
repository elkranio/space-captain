// src/engine/encounter/combat/EnemyTaskScheduler.ts

import {
    ENCOUNTER_TEAM,
} from '../../defs/encounter_team';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../defs/player_location';
import {
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import {
    SHIP_CREW_TASK_KIND,
} from '../model/ship_crew_task';
import type {
    EncounterState,
} from '../model/state';
import EnemyDecisionPolicy from './EnemyDecisionPolicy';

type EnemyTaskSchedulerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;
};

const WEAPON_TASK_ROLES = [
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.SCIENCE,
] as const;

// Назначает выбранные policy задачи
// на ограниченные роли вражеского экипажа.
//
// Lifecycle самого оружия остаётся в CombatRunner.
// Scheduler только:
// - занимает роль;
// - запускает targeting;
// - освобождает роль,
//   когда оружие закончило активную работу.
export default class EnemyTaskScheduler {
    private readonly state: EncounterState;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly decisionPolicy =
        new EnemyDecisionPolicy();

    constructor({
        state,
        emit,
    }: EnemyTaskSchedulerOptions) {
        this.state = state;
        this.emit = emit;
    }

    public schedule(): void {
        this.synchronizeTasks();

        const navigation =
            this.state.navigation;

        if (
            navigation.kind !==
            PLAYER_SPACE_NAVIGATION_KIND
                .ANCHORED
        ) {
            return;
        }

        for (const actor of this.state.actors) {
            if (
                actor.team !==
                ENCOUNTER_TEAM.ENEMY
            ) {
                continue;
            }

            if (
                actor.anchorId !==
                navigation.anchorId
            ) {
                continue;
            }

            for (
                const role of WEAPON_TASK_ROLES
            ) {
                this.scheduleRole(
                    actor,
                    role,
                );
            }
        }
    }

    public synchronizeTasks(): void {
        for (const actor of this.state.actors) {
            for (
                const role of WEAPON_TASK_ROLES
            ) {
                const task =
                    actor.crewTasks[role];

                if (!task) {
                    continue;
                }

                const weapon =
                    actor.weapons.find(
                        (candidate) => {
                            return (
                                candidate.id ===
                                task.weaponId
                            );
                        },
                    );

                if (
                    weapon &&
                    this.isWeaponActive(weapon)
                ) {
                    continue;
                }

                delete actor.crewTasks[role];
            }
        }
    }

    private scheduleRole(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): void {
        if (actor.crewTasks[role]) {
            return;
        }

        const weapon =
            this.decisionPolicy.selectWeapon(
                actor,
                role,
            );

        if (!weapon) {
            return;
        }

        actor.crewTasks[role] = {
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role,

            weaponId: weapon.id,
        };

        weapon.phase =
            SHIP_WEAPON_PHASE.TARGETING;
        weapon.phaseElapsedMs = 0;

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_SHIP_TARGETING_DETECTED,

            sourceActorId: actor.id,
            sourceWeaponId: weapon.id,
        });
    }

    private isWeaponActive(
        weapon: ShipWeaponState,
    ): boolean {
        return (
            weapon.phase ===
                SHIP_WEAPON_PHASE.TARGETING ||
            weapon.phase ===
                SHIP_WEAPON_PHASE.CHARGING ||
            weapon.phase ===
                SHIP_WEAPON_PHASE.CHANNELING ||
            weapon.phase ===
                SHIP_WEAPON_PHASE.DISPENSING
        );
    }
}
