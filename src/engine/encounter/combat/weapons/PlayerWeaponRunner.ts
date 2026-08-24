// src/engine/encounter/combat/PlayerWeaponRunner.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { OFFICER_ROLE } from "../../../defs/officer";
import { advanceShipWeaponCooldown, type ShipWeaponDefinition, type ShipWeaponState } from "../../../defs/ship_weapon";
import type { EncounterEvent } from "../../model/event";
import { OFFICER_TASK_KIND } from "../../model/officer_task";
import { getPlayerCrewProgressMultiplier } from "../../crew_performance/get_crew_progress_multiplier";
import type EncounterStateStore from "../../state/EncounterStateStore";
import type OfficerTaskRunner from "../../officer_tasks/OfficerTaskRunner";
import type CombatRunner from "../CombatRunner";
import PlayerBeamCannonRunner from "../beam_cannon/PlayerBeamCannonRunner";
import PlayerMissileLauncherRunner from "../missile/PlayerMissileLauncherRunner";
import PlayerSpamProjectorRunner from "./spam/PlayerSpamProjectorRunner";
import PlayerStickyMineDispenserRunner from "./sticky_mine/PlayerStickyMineDispenserRunner";

type PlayerWeaponRunnerOptions = {
    stateStore: EncounterStateStore;

    combatRunner: Pick<CombatRunner, "queuePlayerStickyMineAttach" | "queuePlayerMissileLaunch">;
    officerTaskRunner: Pick<OfficerTaskRunner, "complete">;

    destroyEnemyActor: (actorId: string) => void;

    emit: (event: EncounterEvent) => void;

};

// Owns the shared player-weapon cooldown phase and dispatches each active
// weapon family to its concrete lifecycle owner.
//
// Cooldowns for every installed weapon advance before the active Weapons
// officer task, matching the locked encounter-step contract.
export default class PlayerWeaponRunner {
    private readonly missileLauncherRunner: PlayerMissileLauncherRunner;

    private readonly stickyMineDispenserRunner: PlayerStickyMineDispenserRunner;

    private readonly beamCannonRunner: PlayerBeamCannonRunner;

    private readonly spamProjectorRunner: PlayerSpamProjectorRunner;

    private readonly stateStore: EncounterStateStore;

    constructor({ stateStore, combatRunner, officerTaskRunner, ...options }: PlayerWeaponRunnerOptions) {
        this.stateStore = stateStore;

        this.missileLauncherRunner = new PlayerMissileLauncherRunner({
            stateStore: this.stateStore,
            combatRunner,
            officerTaskRunner,
        });

        this.stickyMineDispenserRunner = new PlayerStickyMineDispenserRunner({
            stateStore: this.stateStore,
            combatRunner,
            officerTaskRunner,
        });

        this.spamProjectorRunner = new PlayerSpamProjectorRunner({
            stateStore: this.stateStore,

            emit: options.emit,
            officerTaskRunner,
        });

        this.beamCannonRunner = new PlayerBeamCannonRunner({
            stateStore: this.stateStore,
            emit: options.emit,
            officerTaskRunner,
            destroyEnemyActor: options.destroyEnemyActor,
        });
    }

    public purgeSpamChannel(channelId: string, targetActorId: string): boolean {
        return this.spamProjectorRunner.purgeChannel(channelId, targetActorId);
    }

    public step(deltaMs: number): void {
        this.advanceCooldowns(deltaMs);

        const crewDeltaMs = deltaMs * getPlayerCrewProgressMultiplier(this.stateStore.getState());

        const scienceTask = this.stateStore.getOfficerTask(OFFICER_ROLE.SCIENCE);

        if (scienceTask?.kind === OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM) {
            this.spamProjectorRunner.advanceTask(scienceTask, deltaMs);
        }

        const task = this.stateStore.getOfficerTask(OFFICER_ROLE.WEAPONS);

        if (!task) {
            return;
        }

        switch (task.kind) {
            case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:
                this.missileLauncherRunner.advanceTask(task, crewDeltaMs);
                return;

            case OFFICER_TASK_KIND.WEAPONS_FIRE_STICKY_MINES:
                this.stickyMineDispenserRunner.advanceTask(task, crewDeltaMs);
                return;

            case OFFICER_TASK_KIND.WEAPONS_FIRE_BEAM_CANNON:
                this.beamCannonRunner.advanceTask(task, crewDeltaMs);
                return;

            default:
                return;
        }
    }

    private advanceCooldowns(deltaMs: number): void {
        const weapons = this.stateStore.getState().combat.playerWeapons;

        for (const weapon of weapons) {
            const definition = this.getWeaponDefinition(weapon);

            advanceShipWeaponCooldown(weapon, definition.cooldownDurationMs, deltaMs);
        }
    }

    private getWeaponDefinition(weapon: ShipWeaponState): ShipWeaponDefinition {
        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== weapon.kind) {
            throw new Error("Player weapon kind does not match definition: " + `${weapon.id}/` + `${weapon.weaponId}`);
        }

        return definition;
    }
}
