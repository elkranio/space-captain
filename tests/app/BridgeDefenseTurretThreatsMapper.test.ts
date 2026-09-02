import { describe, expect, it } from "vitest";
import { OFFICER_ROLE } from "../../src/engine/defs/officer";
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from "../../src/engine/encounter/model/combat";
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
} from "../../src/engine/encounter/model/command";
import type {
    MissilePresentationSnapshot,
} from "../../src/engine/encounter/snapshots/combat_presentation_snapshot";
import {
    mapDefenseTurretThreatsToBridgePayload,
} from "../../src/app/scenes/game/bridge/controller/captain_dashboard/defense_turret/BridgeDefenseTurretThreatsMapper";

describe("BridgeDefenseTurretThreatsMapper", () => {
    it("maps incoming missiles nearest-first with exact intercept commands", () => {
        const near = createMissile({
            id: "missile_near",
            designation: "M2",
            timeToImpactMs: 400,
            initialTimeToImpactMs: 1200,
        });

        const far = createMissile({
            id: "missile_far",
            designation: "M1",
            timeToImpactMs: 900,
            initialTimeToImpactMs: 1400,
        });

        expect(
            mapDefenseTurretThreatsToBridgePayload({
                incomingMissiles: [far, near],
                availableWeaponsCommands: [
                    createThreatCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,
                        far.id,
                    ),
                    createThreatCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,
                        near.id,
                    ),
                ],
            }),
        ).toEqual([
            {
                projectileId: near.id,
                designation: "M2",
                timeToImpactMs: 400,
                initialTimeToImpactMs: 1200,
                actions: {
                    interceptMissile: {
                        role: OFFICER_ROLE.WEAPONS,
                        commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,
                        target: {
                            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                            threatId: near.id,
                        },
                    },
                },
            },
            {
                projectileId: far.id,
                designation: "M1",
                timeToImpactMs: 900,
                initialTimeToImpactMs: 1400,
                actions: {
                    interceptMissile: {
                        role: OFFICER_ROLE.WEAPONS,
                        commandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,
                        target: {
                            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
                            threatId: far.id,
                        },
                    },
                },
            },
        ]);
    });

    it("rejects duplicate resolved intercept commands for one threat", () => {
        const missile = createMissile({
            id: "missile_1",
            designation: "M1",
            timeToImpactMs: 800,
            initialTimeToImpactMs: 1200,
        });

        const duplicate = createThreatCommand(
            ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE,
            missile.id,
        );

        expect(() => {
            mapDefenseTurretThreatsToBridgePayload({
                incomingMissiles: [missile],
                availableWeaponsCommands: [
                    duplicate,
                    {
                        ...duplicate,
                        target: {
                            ...duplicate.target,
                        },
                    },
                ],
            });
        }).toThrow("Defense Turret received multiple intercept commands for threat " + missile.id);
    });
});

function createMissile({
    id,
    designation,
    timeToImpactMs,
    initialTimeToImpactMs,
}: {
    id: string;
    designation: string;
    timeToImpactMs: number;
    initialTimeToImpactMs: number;
}): MissilePresentationSnapshot {
    return {
        id,
        designation,
        kind: COMBAT_PROJECTILE_KIND.MISSILE,
        source: {
            kind: COMBAT_SOURCE_KIND.ACTOR,
            actorId: "enemy_ship_00",
        },
        sourceWeaponId: "missile_launcher_00",
        target: {
            kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
        },
        timeToImpactMs,
        initialTimeToImpactMs,
    };
}

function createThreatCommand(
    commandId: AvailableOfficerCommand["commandId"],
    threatId: string,
): AvailableOfficerCommand {
    return {
        commandId,
        label: String(commandId),
        target: {
            kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
            threatId,
        },
    };
}
