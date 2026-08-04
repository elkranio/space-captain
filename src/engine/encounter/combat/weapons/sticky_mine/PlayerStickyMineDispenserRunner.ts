import { SHIP_WEAPONS } from '../../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../../defs/encounter_team';
import type { StickyMineId } from '../../../../defs/sticky_mine';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserDefinition,
    type StickyMineDispenserState,
} from '../../../../defs/ship_weapon';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../model/officer_task';
import type EncounterStateStore from '../../../state/EncounterStateStore';

type WeaponsFireStickyMinesTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES;
    }
>;

type PlayerStickyMineDispenserRunnerOptions = {
    stateStore: EncounterStateStore;
    queuePlayerStickyMineAttach: (
        input: {
            sourceWeaponId: string;
            mineId: StickyMineId;
            targetActorId: string;
            ageMs: number;
        },
    ) => void;

    completeOfficerTask:
        (taskId: string) => void;
};

// Owns the active installed player sticky-mine dispenser lifecycle:
// salvo timing, ammo consumption and physical attach.
export default class PlayerStickyMineDispenserRunner {
    constructor(
        private readonly options:
            PlayerStickyMineDispenserRunnerOptions,
    ) {}

    public advanceTask(
        task: WeaponsFireStickyMinesTaskState,
        deltaMs: number,
    ): void {
        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner resolves target-loss cancellation.
            return;
        }

        const dispenser =
            this.findTaskDispenser(task);

        if (!dispenser) {
            return;
        }

        if (
            dispenser.phase !==
            SHIP_WEAPON_PHASE.DISPENSING
        ) {
            throw new Error(
                'Player sticky-mine task has invalid weapon phase: ' +
                    `${task.id}/` +
                    `${dispenser.id}/` +
                    `${dispenser.phase}`,
            );
        }

        const definition =
            this.getDefinition(dispenser);

        dispenser.phaseElapsedMs +=
            deltaMs;

        // There is no aiming/prep phase: the first mine leaves
        // on the first step, including step(0).
        if (
            dispenser.dispensedMineCount ===
            0
        ) {
            this.launchMine(
                task,
                dispenser,
                definition,
                dispenser.phaseElapsedMs,
            );
        }

        while (
            dispenser.dispensedMineCount <
                definition.salvoSize &&
            dispenser.ammoCount > 0 &&
            dispenser.phaseElapsedMs >=
                definition.launchIntervalMs
        ) {
            dispenser.phaseElapsedMs -=
                definition.launchIntervalMs;

            this.launchMine(
                task,
                dispenser,
                definition,
                dispenser.phaseElapsedMs,
            );
        }

        if (
            dispenser.dispensedMineCount <
                definition.salvoSize &&
            dispenser.ammoCount > 0
        ) {
            return;
        }

        dispenser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        // As with player missile/laser, overflow is not
        // carried into the new phase.
        dispenser.phaseElapsedMs = 0;

        this.options.completeOfficerTask(
            task.id,
        );
    }

    private launchMine(
        task: WeaponsFireStickyMinesTaskState,
        dispenser: StickyMineDispenserState,
        definition: StickyMineDispenserDefinition,
        ageMs: number,
    ): void {
        if (
            dispenser.dispensedMineCount >=
            definition.salvoSize
        ) {
            throw new Error(
                'Cannot exceed player sticky-mine salvo size: ' +
                    `${task.id}/` +
                    `${dispenser.id}/` +
                    `${definition.salvoSize}`,
            );
        }

        const mineId =
            dispenser.loadedMineId;

        if (
            !mineId ||
            dispenser.ammoCount <= 0
        ) {
            throw new Error(
                'Player sticky-mine dispenser became empty during salvo: ' +
                    `${task.id}/` +
                    `${dispenser.id}/` +
                    `${dispenser.ammoCount}`,
            );
        }

        this.options.queuePlayerStickyMineAttach({
            sourceWeaponId:
                dispenser.id,
            mineId,
            targetActorId:
                task.targetActorId,
            ageMs,
        });

        dispenser.ammoCount -= 1;
        dispenser.dispensedMineCount += 1;
    }

    private findTaskDispenser(
        task: WeaponsFireStickyMinesTaskState,
    ): StickyMineDispenserState | undefined {
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
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Player sticky-mine task references non-dispenser weapon: ' +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(
        task: WeaponsFireStickyMinesTaskState,
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

    private getDefinition(
        dispenser: StickyMineDispenserState,
    ): StickyMineDispenserDefinition {
        const definition =
            SHIP_WEAPONS[
                dispenser.weaponId
            ];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                'Player sticky-mine dispenser kind does not match definition: ' +
                    `${dispenser.id}/` +
                    `${dispenser.weaponId}`,
            );
        }

        return definition;
    }
}
