// src/engine/encounter/combat/queries/get_active_player_spam_channels.ts

import {
    SHIP_WEAPONS,
} from '../../../content/catalogs/ship_weapons';
import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import {
    ENCOUNTER_ACTOR_KIND,
} from '../../actors/encounter_actor';
import {
    OFFICER_TASK_KIND,
} from '../../model/officer_task';
import type {
    EncounterState,
} from '../../model/state';

export type ActivePlayerSpamChannel = {
    id: string;

    sourceWeaponId: string;
    targetActorId: string;

    officerTaskProgressMultiplier:
        number;
};

// Derived query for the one currently supported player Science channel.
//
// The authoritative mutable lifecycle remains:
// - SCIENCE_FIRE_SPAM officer task owns target identity;
// - installed spam projector owns phase and active channel id.
//
// Returning a detached channel view avoids duplicating mutable state and gives
// enemy behavior one stable query seam for slowdown and the later purge atom.
export function getActivePlayerSpamChannels(
    state: EncounterState,
): ActivePlayerSpamChannel[] {
    const task =
        state.officerTasks[
            OFFICER_ROLE.SCIENCE
        ];

    if (
        !task ||
        task.kind !==
            OFFICER_TASK_KIND
                .SCIENCE_FIRE_SPAM
    ) {
        return [];
    }

    const target =
        state.actors.find(
            (actor) => {
                return (
                    actor.id ===
                    task.targetActorId
                );
            },
        );

    if (
        !target ||
        target.kind !==
            ENCOUNTER_ACTOR_KIND.SHIP ||
        target.team !==
            ENCOUNTER_TEAM.ENEMY ||
        target.hull <= 0
    ) {
        return [];
    }

    const weapon =
        state.combat
            .playerWeapons
            .find((candidate) => {
                return (
                    candidate.id ===
                    task.weaponId
                );
            });

    if (!weapon) {
        return [];
    }

    if (
        weapon.kind !==
        SHIP_WEAPON_KIND
            .SPAM_PROJECTOR
    ) {
        throw new Error(
            'Player spam task references ' +
                'non-projector weapon: ' +
                task.id +
                '/' +
                weapon.id +
                '/' +
                weapon.kind,
        );
    }

    if (
        weapon.phase !==
            SHIP_WEAPON_PHASE
                .CHANNELING ||
        weapon.activeChannelId ===
            null
    ) {
        return [];
    }

    const definition =
        SHIP_WEAPONS[
            weapon.weaponId
        ];

    if (
        definition.kind !==
        SHIP_WEAPON_KIND
            .SPAM_PROJECTOR
    ) {
        throw new Error(
            'Player spam projector ' +
                'definition mismatch: ' +
                weapon.id +
                '/' +
                weapon.weaponId,
        );
    }

    return [
        {
            id:
                weapon.activeChannelId,

            sourceWeaponId:
                weapon.id,

            targetActorId:
                task.targetActorId,

            officerTaskProgressMultiplier:
                definition
                    .officerTaskProgressMultiplier,
        },
    ];
}
