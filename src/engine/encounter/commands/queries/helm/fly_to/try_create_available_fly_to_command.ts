// src/engine/encounter/commands/queries/helm/fly_to/try_create_available_fly_to_command.ts

import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../../../defs/player_location';
import { ENCOUNTER_OFFICER_COMMAND_ID, type AvailableOfficerCommand } from '../../../../model/command';
import type { EncounterState } from '../../../../model/state';
import type { EncounterObjectState } from '../../../../objects/encounter_object';
import { createTargetedOfficerCommand } from '../../shared/create_targeted_officer_command';

// Создаёт FLY_TO-команду только для объекта,
// возле которого корабль сейчас не находится.
export function tryCreateAvailableFlyToCommand(
    state: EncounterState,
    object: EncounterObjectState,
): AvailableOfficerCommand | undefined {
    const navigation = state.navigation;

    if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
        return undefined;
    }

    if (object.id === navigation.anchorObjectId) {
        return undefined;
    }

    return createTargetedOfficerCommand({
        commandId: ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO,
        label: 'FLY TO',
        target: object,
    });
}
