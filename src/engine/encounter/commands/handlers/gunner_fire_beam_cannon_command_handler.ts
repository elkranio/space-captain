// src/engine/encounter/commands/handlers/gunner_fire_beam_cannon_command_handler.ts

import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { OFFICER_ROLE } from "../../../defs/officer";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonState,
    type ShipWeaponState,
} from "../../../defs/ship_weapon";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import { ENCOUNTER_EVENT } from "../../model/event";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { findCurrentEnemyShip } from "../queries/find_current_enemy_ship";
import { createGunnerFireBeamCannonTask } from "../../officer_tasks/create_officer_task_draft";

const def = {
    role: OFFICER_ROLE.GUNNER,

    label: "FIRE BEAM CANNON",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const gunnerFireBeamCannonCommandHandler: OfficerCommandHandler = {
    commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,

    def,

    getAvailableCommands(state) {
        const targetActor = findCurrentEnemyShip(state);

        const powerCore = state.combat.powerCore;

        if (!targetActor || !powerCore) {
            return [];
        }

        return state.combat.playerWeapons
            .filter(isReadyBeamCannon)
            .filter((weapon) => {
                return powerCore.charges >= getBeamCannonDefinition(weapon).powerCost;
            })
            .map((weapon) => {
            return {
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,

                label: def.label,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON,

                    weaponId: weapon.id,

                    actorId: targetActor.id,
                },

                targetLabel: targetActor.displayName,
            };
        });
    },

    execute(context, input) {
        if (input.target.kind !== OFFICER_COMMAND_TARGET_KIND.ACTOR_WEAPON) {
            throw new Error("FIRE BEAM CANNON requires " + "an actor weapon target");
        }

        const weapon = context.stateStore.findPlayerWeaponById(input.target.weaponId);

        if (!weapon || !isReadyBeamCannon(weapon)) {
            throw new Error("Player beamCannon is not ready: " + input.target.weaponId);
        }

        const definition = getBeamCannonDefinition(weapon);
        const powerCore = context.stateStore.getState().combat.powerCore;

        if (!powerCore || powerCore.charges < definition.powerCost) {
            throw new Error("Player Beam Cannon has insufficient Power Core charges: " + weapon.id);
        }

        if (weapon.cooldownRemainingMs > 0) {
            throw new Error("Ready player Beam Cannon still has committed cooldown: " + weapon.id);
        }

        context.stateStore.spendPowerCoreCharges(definition.powerCost);

        const beamCannon = context.stateStore.startPlayerBeamCannonCharging(input.target.weaponId);

        context.emit({
            type: ENCOUNTER_EVENT.PLAYER_BEAM_CANNON_CHARGING_STARTED,

            weaponId: beamCannon.id,

            targetActorId: input.target.actorId,

            chargeDurationMs: definition.chargeDurationMs,
        });

        context.startOfficerTask(createGunnerFireBeamCannonTask(input.target.weaponId, input.target.actorId));
    },
};

function isReadyBeamCannon(weapon: ShipWeaponState): weapon is BeamCannonState {
    return weapon.kind === SHIP_WEAPON_KIND.BEAM_CANNON && weapon.phase === SHIP_WEAPON_PHASE.READY;
}

function getBeamCannonDefinition(weapon: ShipWeaponState) {
    const definition = SHIP_WEAPONS[weapon.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
        throw new Error("Player beamCannon definition mismatch: " + weapon.id + "/" + weapon.weaponId);
    }

    return definition;
}
