import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../../defs/encounter_team';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
} from '../../../../defs/ship_weapon';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../model/officer_task';
import type EncounterStateStore from '../../../state/EncounterStateStore';

type WeaponsFireMissileTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_MISSILE;
    }
>;

type PlayerMissileLauncherRunnerOptions = {
    stateStore: EncounterStateStore;
    queuePlayerMissileLaunch: (
        input: {
            sourceWeaponId: string;
            targetActorId: string;
        },
    ) => void;

    completeOfficerTask:
        (taskId: string) => void;
};

// Owns the active installed player missile-launcher lifecycle:
// targeting, ammo consumption and physical launch.
export default class PlayerMissileLauncherRunner {
    constructor(
        private readonly options:
            PlayerMissileLauncherRunnerOptions,
    ) {}

    public advanceTask(
        task: WeaponsFireMissileTaskState,
        deltaMs: number,
    ): void {
        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner cancels the task
            // at the end of the encounter step.
            return;
        }

        const launcher =
            this.findTaskLauncher(task);

        if (!launcher) {
            // Missing weapon is handled by the shared
            // missing-target cleanup.
            return;
        }

        if (
            launcher.phase !==
            SHIP_WEAPON_PHASE.TARGETING
        ) {
            throw new Error(
                'Player missile task has invalid weapon phase: ' +
                    `${task.id}/` +
                    `${launcher.id}/` +
                    `${launcher.phase}`,
            );
        }

        this.advanceTargeting(
            task,
            launcher,
            deltaMs,
        );
    }

    private advanceTargeting(
        task: WeaponsFireMissileTaskState,
        launcher: MissileLauncherState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            launcher.phaseElapsedMs +
            deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            launcher.phaseElapsedMs =
                elapsedMs;

            return;
        }

        if (
            launcher.ammoCount <= 0
        ) {
            throw new Error(
                'Player missile launcher became ' +
                    'empty during targeting: ' +
                    `${task.id}/` +
                    `${launcher.id}/` +
                    `${launcher.ammoCount}`,
            );
        }

        launcher.ammoCount -= 1;
        launcher.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        // Targeting overflow does not advance
        // cooldown or the new projectile.
        launcher.phaseElapsedMs = 0;

        this.options.queuePlayerMissileLaunch({
            sourceWeaponId:
                launcher.id,
            targetActorId:
                task.targetActorId,
        });

        // Weapons is released immediately after launch.
        // Cooldown and projectile do not occupy the officer.
        this.options.completeOfficerTask(
            task.id,
        );
    }

    private findTaskLauncher(
        task: WeaponsFireMissileTaskState,
    ): MissileLauncherState | undefined {
        const weapon =
            this.options.stateStore
                .findPlayerWeaponById(
                    task.weaponId,
                );

        if (!weapon) {
            return undefined;
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND.MISSILE_LAUNCHER
        ) {
            throw new Error(
                'Player missile task references non-launcher weapon: ' +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(
        task: WeaponsFireMissileTaskState,
    ): boolean {
        const actor =
            this.options.stateStore
                .findActorById(
                    task.targetActorId,
                );

        return (
            actor?.team ===
            ENCOUNTER_TEAM.ENEMY
        );
    }
}
