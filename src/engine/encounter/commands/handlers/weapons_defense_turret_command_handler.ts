// src/engine/encounter/commands/handlers/weapons_defense_turret_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import {
    DEFENSE_TURRET_PHASE,
    DEFENSE_TURRET_POWER_COST,
} from "../../../defs/defense_turret";
import { COMBAT_PROJECTILE_KIND, COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../../model/combat";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import { isEquipmentOperational } from "../../model/equipment";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createWeaponsDefenseTurretTask } from "../../officer_tasks/create_officer_task_draft";
import { requireThreatTargetId } from "./command_handler_helpers";

export const weaponsInterceptMissileCommandHandler: OfficerCommandHandler = {
    commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,

    def: {
        role: OFFICER_ROLE.WEAPONS,

        label: "INTERCEPT",

        targeting: {
            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
        },

        requiresOnlineDrive: false,
        requiresIdleBridge: false,
    } satisfies OfficerCommandDef,

    getAvailableCommands(state) {
        const defenseTurret = state.combat.defenseTurret;

        const powerCore = state.combat.powerCore;

        if (
            !defenseTurret ||
            !isEquipmentOperational(defenseTurret) ||
            defenseTurret.phase !== DEFENSE_TURRET_PHASE.READY ||
            !powerCore ||
            powerCore.charges < DEFENSE_TURRET_POWER_COST
        ) {
            return [];
        }

        return state.combat.projectiles
            .filter((projectile) => {
                if (projectile.kind !== COMBAT_PROJECTILE_KIND.MISSILE) {
                    return false;
                }

                if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
                    return false;
                }

                if (projectile.source.kind !== COMBAT_SOURCE_KIND.ACTOR) {
                    return false;
                }

                // Once launched, an incoming actor missile remains
                // actionable even if its source actor is destroyed.
                return true;
            })
            .sort((left, right) => {
                return left.timeToImpactMs - right.timeToImpactMs;
            })
            .map((projectile) => {
                return {
                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,

                    label: "INTERCEPT",

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,

                        threatId: projectile.id,
                    },

                    targetLabel: "MISSILE " + projectile.designation,
                };
            });
    },

    execute(context, input) {
        const threatId = requireThreatTargetId(input);

        context.stateStore.spendPowerCoreCharges(DEFENSE_TURRET_POWER_COST);

        context.stateStore.startPlayerDefenseTurretLoading(threatId);

        context.startOfficerTask(createWeaponsDefenseTurretTask(threatId));
    },
};
