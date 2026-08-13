import { OFFICER_ROLE, type OfficerRole } from '../../../../../../engine/defs/officer';
import type {
    EnemyShipPresentationSnapshot,
} from '../../../../../../engine/encounter/snapshots/combat_presentation_snapshot';
import type {
    LaserThreatSnapshot,
} from '../../../../../../engine/encounter/combat/queries/get_laser_threat_snapshots';
import type {
    StickyMineSnapshot,
} from '../../../../../../engine/encounter/combat/queries/get_sticky_mine_snapshots';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../../../../../engine/encounter/model/command';
import {
    THREAT_IDENTIFICATION_STATUS,
    type CombatProjectileState,
    type SpamChannelState,
} from '../../../../../../engine/encounter/model/combat';
import type {
    BridgeCaptainCombatContextUpdatedPayload,
    BridgeOfficerCommandSelectedPayload,
} from '../../events/bridge_event';

type CaptainCombatContextMapperInput = {
    enemyShips:
        EnemyShipPresentationSnapshot[];

    incomingMissiles:
        CombatProjectileState[];

    laserThreats:
        LaserThreatSnapshot[];

    stickyMineSnapshots:
        StickyMineSnapshot[];

    spamChannels:
        SpamChannelState[];

    availableScienceCommands:
        AvailableOfficerCommand[];

    availableHelmCommands:
        AvailableOfficerCommand[];

    availableWeaponsCommands:
        AvailableOfficerCommand[];

    availableEngineeringCommands:
        AvailableOfficerCommand[];
};

// App-side projection encounter combat state → captain context dashboard.
//
// Engine остаётся владельцем availability:
// mapper только связывает уже разрешённые команды
// с конкретной threat row по threatId.
export function mapCaptainCombatContextToBridgePayload(
    input:
        CaptainCombatContextMapperInput,
): BridgeCaptainCombatContextUpdatedPayload {
    const enemyShip =
        mapEnemyShip(
            input.enemyShips,
        );

    const deployShield =
        findUntargetedCommand({
            commands:
                input
                    .availableEngineeringCommands,

            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .ENGINEER_DEPLOY_SHIELD,

            role:
                OFFICER_ROLE.ENGINEER,

            label:
                'deploy shield',
        });

    return {
        ...(enemyShip
            ? {
                  enemyShip,
              }
            : {}),

        incomingMissiles:
            [...input.incomingMissiles]
                .sort((left, right) => {
                    return (
                        left.timeToImpactMs -
                        right.timeToImpactMs
                    );
                })
                .map((missile) => {
                    const identifyThreat =
                        findThreatCommand({
                            commands:
                                input
                                    .availableScienceCommands,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .SCIENCE_IDENTIFY_THREAT,

                            threatId:
                                missile.id,

                            role:
                                OFFICER_ROLE.SCIENCE,

                            label:
                                'identify threat',
                        });

                    const fireRedBeam =
                        findThreatCommand({
                            commands:
                                input
                                    .availableWeaponsCommands,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_SIGNATURE_A,

                            threatId:
                                missile.id,

                            role:
                                OFFICER_ROLE.WEAPONS,

                            label:
                                'red defense-turret',
                        });

                    const fireBlueBeam =
                        findThreatCommand({
                            commands:
                                input
                                    .availableWeaponsCommands,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_SIGNATURE_B,

                            threatId:
                                missile.id,

                            role:
                                OFFICER_ROLE.WEAPONS,

                            label:
                                'blue defense-turret',
                        });

                    return {
                        projectileId:
                            missile.id,

                        designation:
                            missile.designation,

                        timeToImpactMs:
                            missile.timeToImpactMs,

                        initialTimeToImpactMs:
                            missile.initialTimeToImpactMs,

                        ...(missile
                            .identification
                            .status ===
                        THREAT_IDENTIFICATION_STATUS
                            .IDENTIFIED
                            ? {
                                  signature:
                                      missile
                                          .identification
                                          .signature,
                              }
                            : {}),

                        actions: {
                            ...(identifyThreat
                                ? {
                                      identifyThreat,
                                  }
                                : {}),

                            ...(fireRedBeam
                                ? {
                                      fireRedBeam,
                                  }
                                : {}),

                            ...(fireBlueBeam
                                ? {
                                      fireBlueBeam,
                                  }
                                : {}),
                        },
                    };
                }),

        incomingStickyMines:
            [...input.stickyMineSnapshots]
                .sort((left, right) => {
                    return (
                        left.mine.timeToDetonationMs -
                        right.mine.timeToDetonationMs
                    );
                })
                .map((snapshot) => {
                    const canClear =
                        snapshot.isNextClearTarget;

                    const scienceClear =
                        canClear
                            ? findUntargetedCommand({
                                  commands:
                                      input
                                          .availableScienceCommands,

                                  commandId:
                                      ENCOUNTER_OFFICER_COMMAND_ID
                                          .CLEAR_STICKY_MINE,

                                  role:
                                      OFFICER_ROLE.SCIENCE,

                                  label:
                                      'Science clear mine',
                              })
                            : undefined;

                    const helmClear =
                        canClear
                            ? findUntargetedCommand({
                                  commands:
                                      input
                                          .availableHelmCommands,

                                  commandId:
                                      ENCOUNTER_OFFICER_COMMAND_ID
                                          .CLEAR_STICKY_MINE,

                                  role:
                                      OFFICER_ROLE.HELM,

                                  label:
                                      'Helm clear mine',
                              })
                            : undefined;

                    const weaponsClear =
                        canClear
                            ? findUntargetedCommand({
                                  commands:
                                      input
                                          .availableWeaponsCommands,

                                  commandId:
                                      ENCOUNTER_OFFICER_COMMAND_ID
                                          .CLEAR_STICKY_MINE,

                                  role:
                                      OFFICER_ROLE.WEAPONS,

                                  label:
                                      'Weapons clear mine',
                              })
                            : undefined;

                    const engineerClear =
                        canClear
                            ? findUntargetedCommand({
                                  commands:
                                      input
                                          .availableEngineeringCommands,

                                  commandId:
                                      ENCOUNTER_OFFICER_COMMAND_ID
                                          .CLEAR_STICKY_MINE,

                                  role:
                                      OFFICER_ROLE.ENGINEER,

                                  label:
                                      'Engineer clear mine',
                              })
                            : undefined;

                    return {
                        mineId:
                            snapshot.mine.id,

                        timeToDetonationMs:
                            snapshot.mine
                                .timeToDetonationMs,

                        initialTimeToDetonationMs:
                            snapshot.mine
                                .initialTimeToDetonationMs,

                        isBeingCleared:
                            snapshot.isBeingCleared,

                        isNextClearTarget:
                            snapshot.isNextClearTarget,

                        actions: {
                            ...(scienceClear
                                ? {
                                      scienceClear,
                                  }
                                : {}),

                            ...(helmClear
                                ? {
                                      helmClear,
                                  }
                                : {}),

                            ...(weaponsClear
                                ? {
                                      weaponsClear,
                                  }
                                : {}),

                            ...(engineerClear
                                ? {
                                      engineerClear,
                                  }
                                : {}),
                        },
                    };
                }),

        activeSpamChannels:
            input.spamChannels
                .map((channel) => {
                    const purgeSpam =
                        findThreatCommand({
                            commands:
                                input
                                    .availableScienceCommands,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .SCIENCE_PURGE_SPAM,

                            threatId:
                                channel.id,

                            role:
                                OFFICER_ROLE.SCIENCE,

                            label:
                                'purge spam',
                        });

                    return {
                        channelId:
                            channel.id,

                        remainingDurationMs:
                            Math.max(
                                0,

                                channel.durationMs -
                                    channel.elapsedMs,
                            ),

                        initialDurationMs:
                            channel.durationMs,

                        actions: {
                            ...(purgeSpam
                                ? {
                                      purgeSpam,
                                  }
                                : {}),
                        },
                    };
                }),

        incomingLasers:
            [...input.laserThreats]
                .sort((left, right) => {
                    return (
                        left.timeToFireMs -
                        right.timeToFireMs
                    );
                })
                .map((snapshot) => {
                    return {
                        attackId:
                            snapshot.attack.id,

                        designation:
                            snapshot.attack
                                .designation,

                        timeToFireMs:
                            snapshot.timeToFireMs,

                        initialTimeToFireMs:
                            snapshot
                                .initialTimeToFireMs,

                        actions: {
                            ...(deployShield
                                ? {
                                      deployShield,
                                  }
                                : {}),
                        },
                    };
                }),
    };
}

function mapEnemyShip(
    enemyShips:
        EnemyShipPresentationSnapshot[],
): NonNullable<
    BridgeCaptainCombatContextUpdatedPayload[
        'enemyShip'
    ]
> | undefined {
    if (enemyShips.length > 1) {
        throw new Error(
            'Captain combat context supports one current enemy ship',
        );
    }

    const enemyShip =
        enemyShips[0];

    if (!enemyShip) {
        return undefined;
    }

    const powerCore =
        enemyShip.powerCore;

    return {
        actorId:
            enemyShip.actorId,

        hull: {
            ...enemyShip.hull,
        },

        ...(powerCore
            ? {
                  powerCore:
                      mapPowerCore(
                          powerCore,
                      ),
              }
            : {}),
    };
}

function mapPowerCore(
    snapshot:
        NonNullable<
            EnemyShipPresentationSnapshot[
                'powerCore'
            ]
        >,
): NonNullable<
    NonNullable<
        BridgeCaptainCombatContextUpdatedPayload[
            'enemyShip'
        ]
    >[
        'powerCore'
    ]
> {
    return {
        current:
            snapshot.state
                .charges,

        max:
            snapshot.capacity,

        ...(snapshot
            .rechargeProgress !==
        undefined
            ? {
                  rechargeProgress:
                      snapshot
                          .rechargeProgress,
              }
            : {}),
    };
}

type FindThreatCommandInput = {
    commands:
        AvailableOfficerCommand[];

    commandId:
        EncounterOfficerCommandId;

    threatId: string;

    role:
        OfficerRole;

    label: string;
};

function findThreatCommand({
    commands,
    commandId,
    threatId,
    role,
    label,
}: FindThreatCommandInput):
    BridgeOfficerCommandSelectedPayload |
    undefined {
    const matchingCommands =
        commands.filter((command) => {
            return (
                command.commandId ===
                    commandId &&
                command.target.kind ===
                    OFFICER_COMMAND_TARGET_KIND
                        .THREAT &&
                command.target.threatId ===
                    threatId
            );
        });

    if (matchingCommands.length > 1) {
        throw new Error(
            'Captain combat context received multiple ' +
                label +
                ' commands for threat ' +
                threatId,
        );
    }

    const command =
        matchingCommands[0];

    if (!command) {
        return undefined;
    }

    return {
        role,

        commandId:
            command.commandId,

        target:
            command.target,
    };
}

type FindUntargetedCommandInput = {
    commands:
        AvailableOfficerCommand[];

    commandId:
        EncounterOfficerCommandId;

    role:
        OfficerRole;

    label: string;
};

function findUntargetedCommand({
    commands,
    commandId,
    role,
    label,
}: FindUntargetedCommandInput):
    BridgeOfficerCommandSelectedPayload |
    undefined {
    const matchingCommands =
        commands.filter((command) => {
            return (
                command.commandId ===
                    commandId &&
                command.target.kind ===
                    OFFICER_COMMAND_TARGET_KIND
                        .NONE
            );
        });

    if (matchingCommands.length > 1) {
        throw new Error(
            'Captain combat context received multiple ' +
                label +
                ' commands',
        );
    }

    const command =
        matchingCommands[0];

    if (!command) {
        return undefined;
    }

    return {
        role,

        commandId:
            command.commandId,

        target:
            command.target,
    };
}
