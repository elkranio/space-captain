// src/engine/encounter/commands/handlers/science_identify_threat_command_handler.ts

import { SHIP_WEAPONS } from '../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import { OFFICER_ROLE } from '../../../defs/officer';
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE } from '../../../defs/ship_weapon';
import { ENCOUNTER_ACTOR_KIND } from '../../actors/encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    COMBAT_THREAT_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type CombatThreatKind,
    type LaserAttackState,
} from '../../model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { EncounterState } from '../../model/state';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import { createScienceIdentifyThreatTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

const COMMAND_ID = ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;

const COMMAND_DEF = {
    availableToRoles: [OFFICER_ROLE.SCIENCE],
    label: 'IDENTIFY THREAT',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresOnlineDrive: false,


    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

type AvailableThreat = {
    kind: CombatThreatKind;

    id: string;
    designation: string;

    timeRemainingMs: number;
};

export const scienceIdentifyThreatCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return getUnknownEnemyThreats(state)
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

function getUnknownEnemyThreats(state: EncounterState): AvailableThreat[] {
    const threats: AvailableThreat[] = [];

    for (const projectile of state.combat.projectiles) {
        if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            continue;
        }

        if (projectile.identification.status !== THREAT_IDENTIFICATION_STATUS.UNKNOWN) {
            continue;
        }

        if (
            projectile.source.kind !==
                COMBAT_SOURCE_KIND.ACTOR ||
            !isEnemyThreatSource(
                state,
                projectile.source.actorId,
            )
        ) {
            continue;
        }

        threats.push({
            kind: COMBAT_THREAT_KIND.MISSILE,

            id: projectile.id,
            designation: projectile.designation,

            timeRemainingMs: projectile.timeToImpactMs,
        });
    }

    for (const attack of state.combat.laserAttacks) {
        if (attack.identification.status !== THREAT_IDENTIFICATION_STATUS.UNKNOWN) {
            continue;
        }

        const timeRemainingMs = getLaserTimeRemainingMs(state, attack);

        if (timeRemainingMs === undefined) {
            continue;
        }

        threats.push({
            kind: COMBAT_THREAT_KIND.LASER,

            id: attack.id,
            designation: attack.designation,

            timeRemainingMs,
        });
    }

    return threats;
}

function isEnemyThreatSource(state: EncounterState, sourceActorId: string): boolean {
    const sourceActor = state.actors.find((actor) => {
        return actor.id === sourceActorId;
    });

    return sourceActor?.team === ENCOUNTER_TEAM.ENEMY;
}

function getLaserTimeRemainingMs(state: EncounterState, attack: LaserAttackState): number | undefined {
    const sourceActor = state.actors.find((actor) => {
        return actor.id === attack.sourceActorId;
    });

    if (
        !sourceActor ||
        sourceActor.team !== ENCOUNTER_TEAM.ENEMY ||
        sourceActor.kind !== ENCOUNTER_ACTOR_KIND.SHIP
    ) {
        return undefined;
    }

    const sourceWeapon = sourceActor.weapons.find((weapon) => {
        return weapon.id === attack.sourceWeaponId;
    });

    if (
        !sourceWeapon ||
        sourceWeapon.kind !== SHIP_WEAPON_KIND.LASER ||
        sourceWeapon.phase !== SHIP_WEAPON_PHASE.CHARGING
    ) {
        return undefined;
    }

    const definition = SHIP_WEAPONS[sourceWeapon.weaponId];

    if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
        throw new Error(
            `Laser threat source does not match weapon definition: ` +
                `${attack.id}/${sourceActor.id}/${sourceWeapon.id}/${sourceWeapon.weaponId}`,
        );
    }

    return Math.max(0, definition.chargeDurationMs - sourceWeapon.phaseElapsedMs);
}

function getThreatLabel(threat: AvailableThreat): string {
    switch (threat.kind) {
        case COMBAT_THREAT_KIND.MISSILE:
            return `MISSILE ${threat.designation}`;

        case COMBAT_THREAT_KIND.LASER:
            return `LASER ${getLaserDesignationNumber(threat.designation)}`;
    }
}

function getLaserDesignationNumber(designation: string): string {
    if (!designation.startsWith('L')) {
        throw new Error(`Invalid laser threat designation: ${designation}`);
    }

    return designation.slice(1);
}
