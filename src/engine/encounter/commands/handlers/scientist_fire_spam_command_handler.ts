// src/engine/encounter/commands/handlers/scientist_fire_spam_command_handler.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { OFFICER_ROLE } from "../../../defs/officer";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
    type SpamProjectorState,
} from "../../../defs/ship_weapon";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import type { EncounterState } from "../../model/state";
import { createScientistFireSpamTask } from "../../officer_tasks/create_officer_task_draft";
import { findCurrentEnemyShip } from "../queries/find_current_enemy_ship";

const def = {
    role: OFFICER_ROLE.SCIENTIST,

    label: "FIRE SPAM",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const scientistFireSpamCommandHandler: OfficerCommandHandler = {
    commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM,

    def,

    getAvailableCommands(state) {
        const targetActor = findCurrentEnemyShip(state);

        if (!targetActor) {
            return [];
        }

        return getReadySpamProjectors(state).map((projector) => {
            return {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM,

                label: def.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,

                    weaponId: projector.id,

                    actorId: targetActor.id,
                },

                targetLabel: targetActor.displayName,
            };
        });
    },

    execute(context, input) {
        if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON) {
            throw new Error("FIRE SPAM requires " + "an actor-weapon target");
        }

        const weapon = context.stateStore.findPlayerWeaponById(input.target.weaponId);
        const definition = weapon && SHIP_WEAPONS[weapon.weaponId];

        if (!definition || definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error("Player weapon definition mismatch: " + input.target.weaponId);
        }

        context.stateStore.startPlayerSpamTargeting(input.target.weaponId);

        context.startOfficerTask(
            createScientistFireSpamTask(input.target.weaponId, input.target.actorId, definition.warmupDurationMs),
        );
    },
};

function getReadySpamProjectors(state: EncounterState) {
    return state.combat.playerWeapons.filter(isReadySpamProjector);
}

function isReadySpamProjector(weapon: ShipWeaponState): weapon is SpamProjectorState {
    return weapon.kind === SHIP_WEAPON_KIND.SPAM_PROJECTOR && weapon.phase === SHIP_WEAPON_PHASE.READY;
}
