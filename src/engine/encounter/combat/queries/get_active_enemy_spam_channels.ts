// src/engine/encounter/combat/queries/get_active_enemy_spam_channels.ts

import { SHIP_WEAPONS } from '../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../defs/encounter_team';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import { ENCOUNTER_ACTOR_KIND } from '../../actors/encounter_actor';
import type { EncounterState } from '../../model/state';

export type ActiveEnemySpamChannel = {
    id: string;
    officerTaskProgressMultiplier: number;
};

export function getActiveEnemySpamChannels(
    state: EncounterState,
): ActiveEnemySpamChannel[] {
    const channels: ActiveEnemySpamChannel[] = [];

    for (const actor of state.actors) {
        if (
            actor.kind !== ENCOUNTER_ACTOR_KIND.SHIP ||
            actor.team !== ENCOUNTER_TEAM.ENEMY
        ) {
            continue;
        }

        for (const weapon of actor.weapons) {
            if (
                weapon.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR ||
                weapon.phase !== SHIP_WEAPON_PHASE.CHANNELING ||
                weapon.activeChannelId === null
            ) {
                continue;
            }

            const definition = SHIP_WEAPONS[weapon.weaponId];

            if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                throw new Error(
                    'Spam projector definition mismatch: ' +
                        actor.id +
                        '/' +
                        weapon.id +
                        '/' +
                        weapon.weaponId,
                );
            }

            channels.push({
                id: weapon.activeChannelId,
                officerTaskProgressMultiplier:
                    definition.officerTaskProgressMultiplier,
            });
        }
    }

    return channels;
}
