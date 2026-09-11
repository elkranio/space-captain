// src/engine/encounter/commands/handlers/gunner_fire_sticky_mines_command_handler.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { OFFICER_ROLE } from "../../../defs/officer";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
    type StickyMineDispenserState,
} from "../../../defs/ship_weapon";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import type { EncounterState } from "../../model/state";
import { findCurrentEnemyShip } from "../queries/find_current_enemy_ship";
import { createGunnerFireStickyMinesTask } from "../../officer_tasks/create_officer_task_draft";

const def = {
    role: OFFICER_ROLE.GUNNER,

    label: "FIRE MINES",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const gunnerFireStickyMinesCommandHandler: OfficerCommandHandler = {
    commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES,

    def,

    getAvailableCommands(state) {
        const targetActor = findCurrentEnemyShip(state);

        if (!targetActor) {
            return [];
        }

        return getReadyStickyMineDispensers(state).map((dispenser) => {
            return {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES,

                label: def.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,

                    weaponId: dispenser.id,

                    actorId: targetActor.id,
                },

                targetLabel: targetActor.displayName,
            };
        });
    },

    execute(context, input) {
        if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON) {
            throw new Error("FIRE MINES requires " + "an actor-weapon target");
        }

        const weapon = context.stateStore.findPlayerWeaponById(input.target.weaponId);
        const definition = weapon && SHIP_WEAPONS[weapon.weaponId];

        if (!definition || definition.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
            throw new Error("Player weapon definition mismatch: " + input.target.weaponId);
        }

        context.stateStore.startPlayerStickyMineTargeting(input.target.weaponId);

        context.startOfficerTask(
            createGunnerFireStickyMinesTask(input.target.weaponId, input.target.actorId, definition.targetingDurationMs),
        );
    },
};

function getReadyStickyMineDispensers(state: EncounterState) {
    return state.combat.playerWeapons.filter(isReadyStickyMineDispenser);
}

function isReadyStickyMineDispenser(weapon: ShipWeaponState): weapon is StickyMineDispenserState {
    return (
        weapon.kind === SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER &&
        weapon.phase === SHIP_WEAPON_PHASE.READY &&
        weapon.ammoCount > 0
    );
}
