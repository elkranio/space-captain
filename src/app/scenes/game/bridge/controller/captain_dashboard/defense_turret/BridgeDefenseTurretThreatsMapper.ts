import { OFFICER_ROLE } from "../../../../../../../engine/defs/officer";
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
} from "../../../../../../../engine/encounter/model/command";
import type { OfficerTaskState } from "../../../../../../../engine/encounter/model/officer_task";
import type {
    MissilePresentationSnapshot,
} from "../../../../../../../engine/encounter/snapshots/combat_presentation_snapshot";
import type {
    PlayerThreatDecisionTimingSnapshot,
} from "../../../../../../../engine/encounter/snapshots/create_player_threat_decision_timing_snapshot";
import type {
    BridgeDefenseTurretThreatsUpdatedPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../events/bridge_event";

type DefenseTurretThreatsMapperInput = {
    incomingMissiles: MissilePresentationSnapshot[];
    availableWeaponsCommands: AvailableOfficerCommand[];
    officerTasks?: OfficerTaskState[];
    playerThreatDecisionTimings?: PlayerThreatDecisionTimingSnapshot;
};

export function mapDefenseTurretThreatsToBridgePayload(
    input: DefenseTurretThreatsMapperInput,
): BridgeDefenseTurretThreatsUpdatedPayload {
    return [...input.incomingMissiles]
        .sort((left, right) => {
            return left.timeToImpactMs - right.timeToImpactMs;
        })
        .map((missile) => {
            const interceptMissile = findInterceptCommand(input.availableWeaponsCommands, missile.id);

            const interceptMissileTaskId = (input.officerTasks ?? []).find((task) => {
                return (
                    task.canBeCancelledByPlayer &&
                    task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE &&
                    "threatId" in task &&
                    task.threatId === missile.id
                );
            })?.id;

            return {
                projectileId: missile.id,
                designation: missile.designation,
                timeToImpactMs: missile.timeToImpactMs,
                initialTimeToImpactMs: missile.initialTimeToImpactMs,

                ...(input.playerThreatDecisionTimings
                    ? {
                          decisionTimings: {
                              interceptMissileMinRemainingMs:
                                  input.playerThreatDecisionTimings.missile.interceptMinRemainingMs,
                          },
                      }
                    : {}),

                actions: {
                    ...(interceptMissile
                        ? {
                              interceptMissile,
                          }
                        : {}),
                },

                ...(interceptMissileTaskId
                    ? {
                          activeTasks: {
                              interceptMissileTaskId,
                          },
                      }
                    : {}),
            };
        });
}

function findInterceptCommand(
    commands: AvailableOfficerCommand[],
    threatId: string,
): BridgeOfficerCommandSelectedPayload | undefined {
    const matchingCommands = commands.filter((command) => {
        return (
            command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE &&
            command.target.kind === OFFICER_COMMAND_TARGET_KIND.THREAT &&
            command.target.threatId === threatId
        );
    });

    if (matchingCommands.length > 1) {
        throw new Error("Defense Turret received multiple intercept commands for threat " + threatId);
    }

    const command = matchingCommands[0];

    if (!command) {
        return undefined;
    }

    return {
        role: OFFICER_ROLE.WEAPONS,
        commandId: command.commandId,
        target: command.target,
    };
}
