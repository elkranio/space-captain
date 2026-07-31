// src/engine/encounter/commands/handlers/science_purge_spam_command_handler.ts

import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import { OFFICER_ROLE } from '../../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import { ENCOUNTER_ACTOR_KIND } from '../../actors/encounter_actor';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type { OfficerCommandHandler } from '../../model/officer_command_handler';
import type { EncounterState } from '../../model/state';
import { createSciencePurgeSpamTask } from '../../officer_tasks/create_officer_task_draft';
import { requireThreatTargetId } from './command_handler_helpers';

const COMMAND_ID =
    ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;

const COMMAND_DEF = {
    role: OFFICER_ROLE.SCIENCE,
    label: 'PURGE SPAM',

    targeting: {
        kind: OFFICER_COMMAND_TARGET_KIND.THREAT,
    },

    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const sciencePurgeSpamCommandHandler = {
    commandId: COMMAND_ID,
    def: COMMAND_DEF,

    getAvailableCommands(state) {
        return getActiveEnemySpamChannelIds(state).map(
            (channelId) => ({
                commandId: COMMAND_ID,
                label: COMMAND_DEF.label,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND.THREAT,
                    threatId: channelId,
                },

                targetLabel: 'SPAM CHANNEL',
            }),
        );
    },

    execute(context, input) {
        context.startOfficerTask(
            createSciencePurgeSpamTask(
                requireThreatTargetId(input),
            ),
        );
    },
} satisfies OfficerCommandHandler;

function getActiveEnemySpamChannelIds(
    state: EncounterState,
): string[] {
    const channelIds: string[] = [];

    for (const actor of state.actors) {
        if (
            actor.kind !== ENCOUNTER_ACTOR_KIND.SHIP ||
            actor.team !== ENCOUNTER_TEAM.ENEMY
        ) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (
                weapon.kind ===
                    SHIP_WEAPON_KIND.SPAM_PROJECTOR &&
                weapon.phase ===
                    SHIP_WEAPON_PHASE.CHANNELING &&
                weapon.activeChannelId !== null
            ) {
                channelIds.push(
                    weapon.activeChannelId,
                );
            }
        }
    }

    return channelIds;
}
