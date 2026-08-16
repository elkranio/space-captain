// src/engine/encounter/commands/handlers/science_fire_spam_command_handler.ts

import {
    OFFICER_ROLE,
} from '../../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
    type SpamProjectorState,
} from '../../../defs/ship_weapon';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type OfficerCommandDef,
} from '../../model/command';
import type {
    OfficerCommandHandler,
} from '../../model/officer_command_handler';
import type {
    EncounterState,
} from '../../model/state';
import {
    createScienceFireSpamTask,
} from '../../officer_tasks/create_officer_task_draft';
import {
    findCurrentEnemyShip,
} from '../queries/find_current_enemy_ship';

const def = {
    role: OFFICER_ROLE.SCIENCE,

    label: 'FIRE SPAM',

    targeting: {
        kind:
            OFFICER_COMMAND_TARGET_KIND
                .ACTOR_WEAPON,
    },

    requiresOnlineDrive: false,
    requiresIdleBridge: false,
} satisfies OfficerCommandDef;

export const scienceFireSpamCommandHandler:
    OfficerCommandHandler = {
        commandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_FIRE_SPAM,

        def,

        getAvailableCommands(state) {
            const targetActor =
                findCurrentEnemyShip(state);

            if (!targetActor) {
                return [];
            }

            return getReadySpamProjectors(
                state,
            ).map((projector) => {
                return {
                    commandId:
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .SCIENCE_FIRE_SPAM,

                    label: def.label,

                    target: {
                        kind:
                            OFFICER_COMMAND_TARGET_KIND
                                .ACTOR_WEAPON,

                        weaponId:
                            projector.id,

                        actorId:
                            targetActor.id,
                    },

                    targetLabel:
                        targetActor.displayName,
                };
            });
        },

        execute(context, input) {
            if (
                input.target.kind !==
                OFFICER_COMMAND_TARGET_KIND
                    .ACTOR_WEAPON
            ) {
                throw new Error(
                    'FIRE SPAM requires ' +
                        'an actor-weapon target',
                );
            }

            context.stateStore
                .startPlayerSpamChanneling(
                    input.target.weaponId,
                );

            context.startOfficerTask(
                createScienceFireSpamTask(
                    input.target.weaponId,
                    input.target.actorId,
                ),
            );
        },
    };

function getReadySpamProjectors(
    state: EncounterState,
): SpamProjectorState[] {
    return state.combat
        .playerWeapons
        .filter(
            isReadySpamProjector,
        );
}

function isReadySpamProjector(
    weapon: ShipWeaponState,
): weapon is SpamProjectorState {
    return (
        weapon.kind ===
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR &&
        weapon.phase ===
            SHIP_WEAPON_PHASE.READY
    );
}
