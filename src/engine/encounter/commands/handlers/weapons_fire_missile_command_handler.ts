// src/engine/encounter/commands/handlers/weapons_fire_missile_command_handler.ts

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
import { createWeaponsFireMissileTask } from "../../officer_tasks/create_officer_task_draft";

const def = {
    role: OFFICER_ROLE.WEAPONS,

    label: "FIRE MISSILE",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const weaponsFireMissileCommandHandler: OfficerCommandHandler = {
    commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE,

    def,

    getAvailableCommands(state) {
        const targetActor = findCurrentEnemyShip(state);

        if (!targetActor) {
            return [];
        }

        return getReadyMissileLaunchers(state).map((launcher) => {
            return {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE,

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

        context.stateStore.startPlayerMissileTargeting(input.target.weaponId);

        context.startOfficerTask(createWeaponsFireMissileTask(input.target.weaponId, input.target.actorId));
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
