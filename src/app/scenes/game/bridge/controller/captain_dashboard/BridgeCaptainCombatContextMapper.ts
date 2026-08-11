import {
    DEFENSE_CAPACITORS,
} from '../../../../../../engine/content/catalogs/defense_capacitors';
import { OFFICER_ROLE, type OfficerRole } from '../../../../../../engine/defs/officer';
import type {
    EnemyShipTelemetrySnapshot,
} from '../../../../../../engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../../../../../engine/encounter/model/command';
import {
    THREAT_IDENTIFICATION_STATUS,
    type CombatProjectileState,
} from '../../../../../../engine/encounter/model/combat';
import type {
    BridgeCaptainCombatContextUpdatedPayload,
    BridgeOfficerCommandSelectedPayload,
} from '../../events/bridge_event';

type CaptainCombatContextMapperInput = {
    enemyShips:
        EnemyShipTelemetrySnapshot[];

    incomingMissiles:
        CombatProjectileState[];

    availableScienceCommands:
        AvailableOfficerCommand[];

    availableWeaponsCommands:
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
                                    .WEAPONS_FIRE_RED_BEAM,

                            threatId:
                                missile.id,

                            role:
                                OFFICER_ROLE.WEAPONS,

                            label:
                                'red point-defense',
                        });

                    const fireBlueBeam =
                        findThreatCommand({
                            commands:
                                input
                                    .availableWeaponsCommands,

                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_BLUE_BEAM,

                            threatId:
                                missile.id,

                            role:
                                OFFICER_ROLE.WEAPONS,

                            label:
                                'blue point-defense',
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
                                  spectralBand:
                                      missile
                                          .identification
                                          .spectralBand,
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
    };
}

function mapEnemyShip(
    enemyShips:
        EnemyShipTelemetrySnapshot[],
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

    const defenseCapacitor =
        enemyShip.defenseCapacitor;

    return {
        actorId:
            enemyShip.actorId,

        hull: {
            ...enemyShip.hull,
        },

        ...(defenseCapacitor
            ? {
                  defenseCapacitor:
                      mapDefenseCapacitor(
                          defenseCapacitor,
                      ),
              }
            : {}),
    };
}

function mapDefenseCapacitor(
    state:
        NonNullable<
            EnemyShipTelemetrySnapshot[
                'defenseCapacitor'
            ]
        >,
): NonNullable<
    NonNullable<
        BridgeCaptainCombatContextUpdatedPayload[
            'enemyShip'
        ]
    >[
        'defenseCapacitor'
    ]
> {
    const definition =
        DEFENSE_CAPACITORS[
            state.defenseCapacitorId
        ];

    const rechargeProgress =
        state.charges <
        definition.capacity
            ? Math.max(
                  0,
                  Math.min(
                      1,
                      state.rechargeElapsedMs /
                          definition
                              .rechargeDurationMs,
                  ),
              )
            : undefined;

    return {
        current:
            state.charges,

        max:
            definition.capacity,

        ...(rechargeProgress !==
        undefined
            ? {
                  rechargeProgress,
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
