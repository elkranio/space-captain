// src/app/scenes/game/bridge/events/bridge_event.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { SpriteEntry } from '../../../../manifests/types';
import type { EncounterOfficerCommandId } from '../../../../../engine/encounter/encounter_command';

export const BRIDGE_EVENT = {
    CREW_LOADED: 'crew_loaded',
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',

    OFFICER_COMMAND_MENU_SYNCED: 'officer_command_menu_synced',

    ENCOUNTER_OBJECTS_PREPARED: 'encounter_objects_prepared',
    ENCOUNTER_OBJECTS_SYNCED: 'encounter_objects_synced',

    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',
} as const;

export type BridgeEncounterObjectViewState = {
    id: string;
    sprite: SpriteEntry;
    position: Phaser.Math.Vector2;
};

export type BridgeOfficerCommandMenuItemViewState = {
    commandId: EncounterOfficerCommandId;
    label: string;
    targetId?: string;
};

export type BridgeOfficerCommandMenuGroupViewState = {
    label: string;
    items: BridgeOfficerCommandMenuItemViewState[];
};

export type BridgeOfficerCommandMenuViewState = {
    role: OfficerRole;
    groups: BridgeOfficerCommandMenuGroupViewState[];
};

export type BridgeEventPayloadMap = {
    [BRIDGE_EVENT.CREW_LOADED]: Record<OfficerRole, OfficerDefinition>;
    [BRIDGE_EVENT.OFFICER_SEAT_CLICKED]: {
        role: OfficerRole;
    };
    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED]: BridgeEncounterObjectViewState[];
    [BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED]: BridgeEncounterObjectViewState[];
    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED]: undefined;
    [BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED]: undefined;
    [BRIDGE_EVENT.OFFICER_COMMAND_MENU_SYNCED]: BridgeOfficerCommandMenuViewState;
};
