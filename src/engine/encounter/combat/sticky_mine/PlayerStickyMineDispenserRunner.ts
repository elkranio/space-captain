import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import {
    commitShipWeaponCooldown,
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserDefinition,
    type StickyMineDispenserState,
} from "../../../defs/ship_weapon";
import { OFFICER_TASK_KIND, type OfficerTaskState } from "../../model/officer_task";
import type EncounterStateStore from "../../state/EncounterStateStore";
import type OfficerTaskRunner from "../../officer_tasks/OfficerTaskRunner";
import type CombatRunner from "../CombatRunner";

type GunnerFireStickyMinesTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES;
    }
>;

type PlayerStickyMineDispenserRunnerOptions = {
    stateStore: EncounterStateStore;
    combatRunner: Pick<CombatRunner, "queuePlayerStickyMineAttach">;
    officerTaskRunner: Pick<OfficerTaskRunner, "complete">;
};

// Gunner owns target acquisition and the single physical mine release.
export default class PlayerStickyMineDispenserRunner {
    constructor(private readonly options: PlayerStickyMineDispenserRunnerOptions) {}

    public advanceTask(task: GunnerFireStickyMinesTaskState): void {
        if (!this.hasValidTarget(task.targetActorId)) {
            // OfficerTaskRunner resolves target-loss cancellation
            // at the end of the encounter step.
            return;
        }

        const dispenser = this.findTaskDispenser(task);

        if (!dispenser) {
            return;
        }

        if (dispenser.phase !== SHIP_WEAPON_PHASE.TARGETING) {
            throw new Error(
                "Player sticky-mine task has invalid weapon phase: " +
                    `${task.id}/` +
                    `${dispenser.id}/` +
                    `${dispenser.phase}`,
            );
        }

        const durationMs = task.durationMs;

        if (durationMs === null) {
            throw new Error("Player sticky-mine aiming task is missing duration: " + task.id);
        }

        dispenser.phaseElapsedMs = task.elapsedMs;

        if (task.elapsedMs < durationMs) {
            return;
        }

        this.releaseMine(task, dispenser);
    }

    private releaseMine(
        task: GunnerFireStickyMinesTaskState,
        dispenser: StickyMineDispenserState,
    ): void {
        const definition = this.getDefinition(dispenser);

        if (dispenser.ammoCount <= 0) {
            throw new Error(
                "Player sticky-mine dispenser became empty during targeting: " +
                    `${task.id}/` +
                    `${dispenser.id}/` +
                    `${dispenser.ammoCount}`,
            );
        }

        commitShipWeaponCooldown(dispenser, definition.cooldownDurationMs);

        this.options.combatRunner.queuePlayerStickyMineAttach({
            sourceWeaponId: dispenser.id,

            damage: definition.damage,

            fuseDurationMs: definition.fuseDurationMs,

            targetActorId: task.targetActorId,
            ageMs: 0,
        });

        dispenser.ammoCount -= 1;
        dispenser.dispensedMineCount = 1;

        finishShipWeaponAction(dispenser, definition.cooldownDurationMs);

        this.options.officerTaskRunner.complete(task.id);
    }

    private findTaskDispenser(task: GunnerFireStickyMinesTaskState): StickyMineDispenserState | undefined {
        const weapon = this.options.stateStore.findPlayerWeaponById(task.weaponId);

        if (!weapon) {
            return undefined;
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
            throw new Error(
                "Player sticky-mine task references non-dispenser weapon: " +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(targetActorId: string): boolean {
        const actor = this.options.stateStore.findActorById(targetActorId);

        return actor?.team === ENCOUNTER_TEAM.ENEMY;
    }

    private getDefinition(dispenser: StickyMineDispenserState): StickyMineDispenserDefinition {
        const definition = SHIP_WEAPONS[dispenser.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
            throw new Error(
                "Player sticky-mine dispenser kind does not match definition: " +
                    `${dispenser.id}/` +
                    `${dispenser.weaponId}`,
            );
        }

        return definition;
    }
}
