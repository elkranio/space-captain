import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import {
    commitShipWeaponCooldown,
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
} from "../../../defs/ship_weapon";
import { OFFICER_TASK_KIND, type OfficerTaskState } from "../../model/officer_task";
import type EncounterStateStore from "../../state/EncounterStateStore";
import type OfficerTaskRunner from "../../officer_tasks/OfficerTaskRunner";
import type CombatRunner from "../CombatRunner";

type GunnerFireMissileTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE;
    }
>;

type PlayerMissileLauncherRunnerOptions = {
    stateStore: EncounterStateStore;
    combatRunner: Pick<CombatRunner, "queuePlayerMissileLaunch">;
    officerTaskRunner: Pick<OfficerTaskRunner, "complete">;
};

// Owns the active installed player missile-launcher lifecycle:
// targeting, ammo consumption and physical launch.
export default class PlayerMissileLauncherRunner {
    constructor(private readonly options: PlayerMissileLauncherRunnerOptions) {}

    public advanceTask(task: GunnerFireMissileTaskState): void {
        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner cancels the task
            // at the end of the encounter step.
            return;
        }

        const launcher = this.findTaskLauncher(task);

        if (!launcher) {
            // Missing weapon is handled by the shared
            // missing-target cleanup.
            return;
        }

        if (launcher.phase !== SHIP_WEAPON_PHASE.TARGETING) {
            throw new Error(
                "Player missile task has invalid weapon phase: " +
                    `${task.id}/` +
                    `${launcher.id}/` +
                    `${launcher.phase}`,
            );
        }

        this.advanceTargeting(task, launcher);
    }

    private advanceTargeting(task: GunnerFireMissileTaskState, launcher: MissileLauncherState): void {
        const durationMs = task.durationMs;

        if (durationMs === null) {
            throw new Error("Player missile aiming task is missing duration: " + task.id);
        }

        launcher.phaseElapsedMs = task.elapsedMs;

        if (task.elapsedMs < durationMs) {
            return;
        }

        const definition = SHIP_WEAPONS[launcher.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error(
                "Player missile launcher kind does not match definition: " + launcher.id + "/" + launcher.weaponId,
            );
        }

        if (launcher.ammoCount <= 0) {
            throw new Error(
                "Player missile launcher became " +
                    "empty during targeting: " +
                    `${task.id}/` +
                    `${launcher.id}/` +
                    `${launcher.ammoCount}`,
            );
        }

        launcher.ammoCount -= 1;

        // Missile commitment happens at physical launch, not at targeting start.
        commitShipWeaponCooldown(launcher, definition.cooldownDurationMs);

        finishShipWeaponAction(launcher, definition.cooldownDurationMs);

        this.options.combatRunner.queuePlayerMissileLaunch({
            sourceWeaponId: launcher.id,
            targetActorId: task.targetActorId,
        });

        // Gunner is released immediately after launch.
        // Cooldown and projectile do not occupy the officer.
        this.options.officerTaskRunner.complete(task.id);
    }

    private findTaskLauncher(task: GunnerFireMissileTaskState): MissileLauncherState | undefined {
        const weapon = this.options.stateStore.findPlayerWeaponById(task.weaponId);

        if (!weapon) {
            return undefined;
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error(
                "Player missile task references non-launcher weapon: " +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(task: GunnerFireMissileTaskState): boolean {
        const actor = this.options.stateStore.findActorById(task.targetActorId);

        return actor?.team === ENCOUNTER_TEAM.ENEMY;
    }
}
