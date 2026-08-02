// src/engine/encounter/combat/EnemyCrewTaskRunner.ts

import type {
    OfficerRole,
} from '../../defs/officer';
import {
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import {
    SHIP_CREW_TASK_KIND,
    type ShipCrewTaskState,
} from '../model/ship_crew_task';
import type {
    EncounterState,
} from '../model/state';

type EnemyCrewTaskRunnerOptions = {
    state: EncounterState;

    onOffensiveTaskCompleted: (
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ) => void;
};

// Владеет lifecycle задач абстрактного
// экипажа NPC-кораблей.
//
// Policy и scheduler выбирают работу.
// Этот runner:
// - занимает одну конкретную роль;
// - не допускает параллельные задачи одной роли;
// - отменяет задачи при смерти actor,
//   исчезновении роли или цели;
// - завершает задачу по её физическому lifecycle;
// - сообщает о natural completion владельцу policy.
//
// Пока существует только OPERATE_WEAPON.
// Новые timed defensive tasks будут добавляться
// сюда отдельными ветками, а не в scheduler.
export default class EnemyCrewTaskRunner {
    private readonly state: EncounterState;

    private readonly onOffensiveTaskCompleted:
        EnemyCrewTaskRunnerOptions[
            'onOffensiveTaskCompleted'
        ];

    constructor({
        state,
        onOffensiveTaskCompleted,
    }: EnemyCrewTaskRunnerOptions) {
        this.state = state;

        this.onOffensiveTaskCompleted =
            onOffensiveTaskCompleted;
    }

    public isRoleBusy(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): boolean {
        return (
            actor.crewTasks[role] !==
            undefined
        );
    }

    public start(
        actor: ShipEncounterActorState,
        task: ShipCrewTaskState,
    ): ShipCrewTaskState {
        if (
            !actor.crewRoles.includes(
                task.role,
            )
        ) {
            throw new Error(
                'Ship crew role is missing: ' +
                    actor.id +
                    '/' +
                    task.role,
            );
        }

        if (
            this.isRoleBusy(
                actor,
                task.role,
            )
        ) {
            throw new Error(
                'Ship crew role already busy: ' +
                    actor.id +
                    '/' +
                    task.role,
            );
        }

        const storedTask: ShipCrewTaskState = {
            ...task,
        };

        actor.crewTasks[task.role] =
            storedTask;

        return storedTask;
    }

    public cancel(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipCrewTaskState | undefined {
        const task =
            actor.crewTasks[role];

        if (!task) {
            return undefined;
        }

        delete actor.crewTasks[role];

        return task;
    }

    public synchronize(): void {
        for (const actor of this.state.actors) {
            if (actor.hull <= 0) {
                this.cancelAll(actor);
                continue;
            }

            const taskRoles =
                Object.keys(
                    actor.crewTasks,
                ) as OfficerRole[];

            for (const role of taskRoles) {
                const task =
                    actor.crewTasks[role];

                if (!task) {
                    continue;
                }

                if (task.role !== role) {
                    throw new Error(
                        'Ship crew task role mismatch: ' +
                            actor.id +
                            '/' +
                            role +
                            '/' +
                            task.role,
                    );
                }

                if (
                    !actor.crewRoles.includes(
                        role,
                    )
                ) {
                    this.cancel(
                        actor,
                        role,
                    );

                    continue;
                }

                this.synchronizeTask(
                    actor,
                    role,
                    task,
                );
            }
        }
    }

    private synchronizeTask(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        task: ShipCrewTaskState,
    ): void {
        switch (task.kind) {
            case SHIP_CREW_TASK_KIND
                .OPERATE_WEAPON:
                this.synchronizeOperateWeapon(
                    actor,
                    role,
                    task.weaponId,
                );

                return;
        }

    }

    private synchronizeOperateWeapon(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        weaponId: string,
    ): void {
        const weapon =
            actor.weapons.find(
                (candidate) => {
                    return (
                        candidate.id ===
                        weaponId
                    );
                },
            );

        if (!weapon) {
            this.cancel(
                actor,
                role,
            );

            return;
        }

        if (
            this.isWeaponActive(
                weapon,
            )
        ) {
            return;
        }

        this.complete(
            actor,
            role,
        );

        this.onOffensiveTaskCompleted(
            actor,
            role,
        );
    }

    private complete(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipCrewTaskState {
        const task =
            this.cancel(
                actor,
                role,
            );

        if (!task) {
            throw new Error(
                'Ship crew task disappeared ' +
                    'before completion: ' +
                    actor.id +
                    '/' +
                    role,
            );
        }

        return task;
    }

    private cancelAll(
        actor: ShipEncounterActorState,
    ): void {
        const taskRoles =
            Object.keys(
                actor.crewTasks,
            ) as OfficerRole[];

        for (const role of taskRoles) {
            this.cancel(
                actor,
                role,
            );
        }
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
