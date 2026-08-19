// src/engine/encounter/commands/handlers/science_identify_threat_command_handler.ts

import { OFFICER_ROLE } from "../../../defs/officer";
import { getBeamCannonThreatSnapshots } from "../../combat/queries/get_beam_cannon_threat_snapshots";
import {
    BEAM_CANNON_TARGET_INTEL_STATUS,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    COMBAT_THREAT_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from "../../model/combat";
import { ENCOUNTER_OFFICER_COMMAND_ID, OFFICER_COMMAND_TARGET_KIND, type OfficerCommandDef } from "../../model/command";
import type { EncounterState } from "../../model/state";
import type { OfficerCommandHandler } from "../../model/officer_command_handler";
import { createScienceIdentifyThreatTask } from "../../officer_tasks/create_officer_task_draft";
import { requireThreatTargetId } from "./command_handler_helpers";

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: "IDENTIFY THREAT",

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresOnlineDrive: false,

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

type AvailableThreat = {
    kind: typeof COMBAT_THREAT_KIND.MISSILE | typeof COMBAT_THREAT_KIND.BEAM_CANNON;

    id: string;
    designation: string;

    timeRemainingMs: number;
};

export const scienceIdentifyThreatCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return getAnalyzableEnemyThreats(state)
            .sort((left, right) => {
                return left.timeRemainingMs - right.timeRemainingMs;
            })
            .map((threat) => {
                return {
                    commandId: COMMAND_ID,

                    label: getThreatLabel(threat),

                    target: {
                        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                        threatId: threat.id,
                    },

                    targetLabel: COMMAND_DEF.label,
                };
            });
    },

    execute(context, input) {
        const threatId = requireThreatTargetId(input);

        context.startOfficerTask(createScienceIdentifyThreatTask(threatId));
    },
} satisfies OfficerCommandHandler;

function getAnalyzableEnemyThreats(state: EncounterState): AvailableThreat[] {
    const threats: AvailableThreat[] = [];

    for (const projectile of state.combat.projectiles) {
        if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            continue;
        }

        if (projectile.identification.status === MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED) {
            continue;
        }

        if (projectile.source.kind !== COMBAT_SOURCE_KIND.ACTOR) {
            continue;
        }

        // A launched incoming missile remains an analyzable threat
        // independently of the source actor lifecycle.

        threats.push({
            kind: COMBAT_THREAT_KIND.MISSILE,

            id: projectile.id,
            designation: projectile.designation,

            timeRemainingMs: projectile.timeToImpactMs,
        });
    }

    for (const snapshot of getBeamCannonThreatSnapshots(state)) {
        if (snapshot.targetIntel.status === BEAM_CANNON_TARGET_INTEL_STATUS.CONFIRMED) {
            continue;
        }

        threats.push({
            kind: COMBAT_THREAT_KIND.BEAM_CANNON,

            id: snapshot.attack.id,
            designation: snapshot.attack.designation,

            timeRemainingMs: snapshot.timeToFireMs,
        });
    }

    return threats;
}

function getThreatLabel(threat: AvailableThreat): string {
    switch (threat.kind) {
        case COMBAT_THREAT_KIND.MISSILE:
            return "MISSILE " + threat.designation;

        case COMBAT_THREAT_KIND.BEAM_CANNON:
            return "BEAM " + threat.designation;
    }
}
