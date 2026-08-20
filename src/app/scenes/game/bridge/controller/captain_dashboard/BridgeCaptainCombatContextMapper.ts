import { OFFICER_ROLE, type OfficerRole } from "../../../../../../engine/defs/officer";
import type {
    EnemyShipPresentationSnapshot,
    MissilePresentationSnapshot,
} from "../../../../../../engine/encounter/snapshots/combat_presentation_snapshot";
import type { BeamCannonThreatSnapshot } from "../../../../../../engine/encounter/combat/queries/get_beam_cannon_threat_snapshots";
import type { StickyMineSnapshot } from "../../../../../../engine/encounter/combat/queries/get_sticky_mine_snapshots";
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from "../../../../../../engine/encounter/model/command";
import type { SpamChannelState } from "../../../../../../engine/encounter/model/combat";
import type { OfficerTaskState } from "../../../../../../engine/encounter/model/officer_task";
import type {
    PlayerThreatDecisionTimingSnapshot,
} from "../../../../../../engine/encounter/snapshots/create_player_threat_decision_timing_snapshot";
import type {
    BridgeCaptainCombatContextUpdatedPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../events/bridge_event";

type CaptainCombatContextMapperInput = {
    enemyShips: EnemyShipPresentationSnapshot[];

    incomingMissiles: MissilePresentationSnapshot[];

    beamCannonThreats: BeamCannonThreatSnapshot[];

    stickyMineSnapshots: StickyMineSnapshot[];

    spamChannels: SpamChannelState[];

    playerThreatDecisionTimings?: PlayerThreatDecisionTimingSnapshot;

    officerTasks?: OfficerTaskState[];

    availableScienceCommands: AvailableOfficerCommand[];

    availableWeaponsCommands: AvailableOfficerCommand[];

    availableEngineeringCommands: AvailableOfficerCommand[];
};

// App-side projection encounter combat state → captain context dashboard.
//
// Engine остаётся владельцем availability:
// mapper только связывает уже разрешённые команды
// с конкретной threat row по threatId.
export function mapCaptainCombatContextToBridgePayload(
    input: CaptainCombatContextMapperInput,
): BridgeCaptainCombatContextUpdatedPayload {
    const enemyShip = mapEnemyShip(input.enemyShips);

    const deployShield = findUntargetedCommand({
        commands: input.availableEngineeringCommands,

        commandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,

        role: OFFICER_ROLE.ENGINEER,

        label: "deploy shield",
    });

    const deployShieldTaskId = (input.officerTasks ?? []).find((task) => {
        return (
            task.canBeCancelledByPlayer &&
            task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD
        );
    })?.id;

    return {
        ...(enemyShip
            ? {
                  enemyShip,
              }
            : {}),

        incomingMissiles: [...input.incomingMissiles]
            .sort((left, right) => {
                return left.timeToImpactMs - right.timeToImpactMs;
            })
            .map((missile) => {
                const identifyThreat = findThreatCommand({
                    commands: input.availableScienceCommands,

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                    threatId: missile.id,

                    role: OFFICER_ROLE.SCIENCE,

                    label: "identify threat",
                });

                const interceptMissile = findThreatCommand({
                    commands: input.availableWeaponsCommands,

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,

                    threatId: missile.id,

                    role: OFFICER_ROLE.WEAPONS,

                    label: "defense-turret intercept",
                });

                const identifyThreatTaskId = (input.officerTasks ?? []).find((task) => {
                    return (
                        task.canBeCancelledByPlayer &&
                        task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT &&
                        "threatId" in task &&
                        task.threatId === missile.id
                    );
                })?.id;

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

                    identificationStatus: missile.identificationStatus,

                    ...(input.playerThreatDecisionTimings
                        ? {
                              decisionTimings: {
                                  identifyThreatMinRemainingMs:
                                      input.playerThreatDecisionTimings.missile.trackAndInterceptMinRemainingMs,

                                  interceptMissileMinRemainingMs:
                                      input.playerThreatDecisionTimings.missile.interceptMinRemainingMs,
                              },
                          }
                        : {}),

                    actions: {
                        ...(identifyThreat
                            ? {
                                  identifyThreat,
                              }
                            : {}),

                        ...(interceptMissile
                            ? {
                                  interceptMissile,
                              }
                            : {}),
                    },

                    ...(identifyThreatTaskId || interceptMissileTaskId
                        ? {
                              activeTasks: {
                                  ...(identifyThreatTaskId
                                      ? {
                                            identifyThreatTaskId,
                                        }
                                      : {}),

                                  ...(interceptMissileTaskId
                                      ? {
                                            interceptMissileTaskId,
                                        }
                                      : {}),
                              },
                          }
                        : {}),
                };
            }),

        incomingStickyMines: [...input.stickyMineSnapshots]
            .sort((left, right) => {
                return left.mine.timeToDetonationMs - right.mine.timeToDetonationMs;
            })
            .map((snapshot) => {
                const engineerClear = findThreatCommand({
                    commands: input.availableEngineeringCommands,

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE,

                    threatId: snapshot.mine.id,

                    role: OFFICER_ROLE.ENGINEER,

                    label: "Engineer clear mine",
                });

                const engineerClearTaskId = (input.officerTasks ?? []).find((task) => {
                    return (
                        task.canBeCancelledByPlayer &&
                        task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE &&
                        "mineId" in task &&
                        task.mineId === snapshot.mine.id
                    );
                })?.id;

                return {
                    mineId: snapshot.mine.id,

                    timeToDetonationMs: snapshot.mine.timeToDetonationMs,

                    initialTimeToDetonationMs: snapshot.mine.initialTimeToDetonationMs,

                    isBeingCleared: snapshot.isBeingCleared,

                    isNextClearTarget: snapshot.isNextClearTarget,

                    actions: {
                        ...(engineerClear
                            ? {
                                  engineerClear,
                              }
                            : {}),
                    },

                    ...(engineerClearTaskId
                        ? {
                              activeTasks: {
                                  engineerClearTaskId,
                              },
                          }
                        : {}),
                };
            }),

        activeSpamChannels: input.spamChannels.map((channel) => {
            const purgeSpam = findThreatCommand({
                commands: input.availableScienceCommands,

                commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM,

                threatId: channel.id,

                role: OFFICER_ROLE.SCIENCE,

                label: "purge spam",
            });

            const purgeSpamTaskId = (input.officerTasks ?? []).find((task) => {
                return (
                    task.canBeCancelledByPlayer &&
                    task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM &&
                    "channelId" in task &&
                    task.channelId === channel.id
                );
            })?.id;

            return {
                channelId: channel.id,

                remainingDurationMs: Math.max(
                    0,

                    channel.durationMs - channel.elapsedMs,
                ),

                initialDurationMs: channel.durationMs,

                actions: {
                    ...(purgeSpam
                        ? {
                              purgeSpam,
                          }
                        : {}),
                },

                ...(purgeSpamTaskId
                    ? {
                          activeTasks: {
                              purgeSpamTaskId,
                          },
                      }
                    : {}),
            };
        }),

        incomingBeamCannons: [...input.beamCannonThreats]
            .sort((left, right) => {
                return left.timeToFireMs - right.timeToFireMs;
            })
            .map((snapshot) => {
                const trackTarget = findThreatCommand({
                    commands: input.availableScienceCommands,

                    commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

                    threatId: snapshot.attack.id,

                    role: OFFICER_ROLE.SCIENCE,

                    label: "beam target tracking",
                });

                const trackTargetTaskId = (input.officerTasks ?? []).find((task) => {
                    return (
                        task.canBeCancelledByPlayer &&
                        task.sourceCommandId === ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT &&
                        "threatId" in task &&
                        task.threatId === snapshot.attack.id
                    );
                })?.id;

                return {
                    attackId: snapshot.attack.id,

                    designation: snapshot.attack.designation,

                    targetIntel: snapshot.targetIntel,

                    timeToFireMs: snapshot.timeToFireMs,

                    initialTimeToFireMs: snapshot.initialTimeToFireMs,

                    actions: {
                        ...(trackTarget
                            ? {
                                  trackTarget,
                              }
                            : {}),

                        ...(deployShield
                            ? {
                                  deployShield,
                              }
                            : {}),
                    },

                    ...(trackTargetTaskId || deployShieldTaskId
                        ? {
                              activeTasks: {
                                  ...(trackTargetTaskId
                                      ? {
                                            trackTargetTaskId,
                                        }
                                      : {}),

                                  ...(deployShieldTaskId
                                      ? {
                                            deployShieldTaskId,
                                        }
                                      : {}),
                              },
                          }
                        : {}),
                };
            }),
    };
}

function mapEnemyShip(
    enemyShips: EnemyShipPresentationSnapshot[],
): NonNullable<BridgeCaptainCombatContextUpdatedPayload["enemyShip"]> | undefined {
    if (enemyShips.length > 1) {
        throw new Error("Captain combat context supports one current enemy ship");
    }

    const enemyShip = enemyShips[0];

    if (!enemyShip) {
        return undefined;
    }

    const powerCore = enemyShip.powerCore;

    return {
        actorId: enemyShip.actorId,

        hull: {
            ...enemyShip.hull,
        },

        ...(powerCore
            ? {
                  powerCore: mapPowerCore(powerCore),
              }
            : {}),
    };
}

function mapPowerCore(
    snapshot: NonNullable<EnemyShipPresentationSnapshot["powerCore"]>,
): NonNullable<NonNullable<BridgeCaptainCombatContextUpdatedPayload["enemyShip"]>["powerCore"]> {
    return {
        current: snapshot.state.charges,

        max: snapshot.capacity,

        ...(snapshot.rechargeProgress !== undefined
            ? {
                  rechargeProgress: snapshot.rechargeProgress,
              }
            : {}),
    };
}

type FindThreatCommandInput = {
    commands: AvailableOfficerCommand[];

    commandId: EncounterOfficerCommandId;

    threatId: string;

    role: OfficerRole;

    label: string;
};

function findThreatCommand({
    commands,
    commandId,
    threatId,
    role,
    label,
}: FindThreatCommandInput): BridgeOfficerCommandSelectedPayload | undefined {
    const matchingCommands = commands.filter((command) => {
        return (
            command.commandId === commandId &&
            command.target.kind === OFFICER_COMMAND_TARGET_KIND.THREAT &&
            command.target.threatId === threatId
        );
    });

    if (matchingCommands.length > 1) {
        throw new Error("Captain combat context received multiple " + label + " commands for threat " + threatId);
    }

    const command = matchingCommands[0];

    if (!command) {
        return undefined;
    }

    return {
        role,

        commandId: command.commandId,

        target: command.target,
    };
}

type FindUntargetedCommandInput = {
    commands: AvailableOfficerCommand[];

    commandId: EncounterOfficerCommandId;

    role: OfficerRole;

    label: string;
};

function findUntargetedCommand({
    commands,
    commandId,
    role,
    label,
}: FindUntargetedCommandInput): BridgeOfficerCommandSelectedPayload | undefined {
    const matchingCommands = commands.filter((command) => {
        return command.commandId === commandId && command.target.kind === OFFICER_COMMAND_TARGET_KIND.NONE;
    });

    if (matchingCommands.length > 1) {
        throw new Error("Captain combat context received multiple " + label + " commands");
    }

    const command = matchingCommands[0];

    if (!command) {
        return undefined;
    }

    return {
        role,

        commandId: command.commandId,

        target: command.target,
    };
}
