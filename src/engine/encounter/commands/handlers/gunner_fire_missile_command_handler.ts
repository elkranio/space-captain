// src/engine/encounter/commands/handlers/gunner_fire_missile_command_handler.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { OFFICER_ROLE } from "../../../defs/officer";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
    type ShipWeaponState,
} from "../../../defs/ship_weapon";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import type { EncounterState } from "../../model/state";
import { findCurrentEnemyShip } from "../queries/find_current_enemy_ship";
import { createGunnerFireMissileTask } from "../../officer_tasks/create_officer_task_draft";

const def = {
    role: OFFICER_ROLE.GUNNER,

    label: "FIRE MISSILE",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const gunnerFireMissileCommandHandler: OfficerCommandHandler = {
    commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE,

    def,

    getAvailableCommands(state) {
        const targetActor = findCurrentEnemyShip(state);

        if (!targetActor) {
            return [];
        }

        return getReadyMissileLaunchers(state).map((launcher) => {
            return {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE,

                label: def.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,

                    weaponId: launcher.id,

                    actorId: targetActor.id,
                },

                targetLabel: targetActor.displayName,
            };
        });
    },

    execute(context, input) {
        if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON) {
            throw new Error("FIRE MISSILE requires " + "an actor-weapon target");
        }

        const weapon = context.stateStore.findPlayerWeaponById(input.target.weaponId);
        const definition = weapon && SHIP_WEAPONS[weapon.weaponId];

        if (!definition || definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error("Player weapon definition mismatch: " + input.target.weaponId);
        }

        context.stateStore.startPlayerMissileTargeting(input.target.weaponId);

        context.startOfficerTask(
            createGunnerFireMissileTask(input.target.weaponId, input.target.actorId, definition.targetingDurationMs),
        );
    },
};

function getReadyMissileLaunchers(state: EncounterState) {
    return state.combat.playerWeapons.filter(isReadyMissileLauncher);
}

function isReadyMissileLauncher(weapon: ShipWeaponState): weapon is MissileLauncherState {
    return (
        weapon.kind === SHIP_WEAPON_KIND.MISSILE_LAUNCHER &&
        weapon.phase === SHIP_WEAPON_PHASE.READY &&
        weapon.ammoCount > 0
    );
}
