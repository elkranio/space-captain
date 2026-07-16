// src/app/scenes/game/bridge/events/bridge_event.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../engine/defs/officer';
import type { SpriteEntry } from '../../../../manifests/types';
import type { EncounterOfficerCommandId } from '../../../../../engine/encounter/model/command';
import type { CharacterPortraitId } from '../../../../../engine/defs/character';

export const BRIDGE_EVENT = {
    CREW_LOADED: 'crew_loaded',
    OFFICER_SEAT_CLICKED: 'officer_seat_clicked',
    OFFICER_BARK_REQUESTED: 'officer_bark_requested',

    ENCOUNTER_OBJECTS_PREPARED: 'encounter_objects_prepared',
    ENCOUNTER_OBJECTS_SYNCED: 'encounter_objects_synced',

    ENCOUNTER_ARRIVAL_STARTED: 'encounter_arrival_started',
    ENCOUNTER_ARRIVAL_COMPLETED: 'encounter_arrival_completed',

    OFFICER_COMMAND_MENU_SYNCED: 'officer_command_menu_synced',
    OFFICER_COMMAND_SELECTED: 'officer_command_selected',

    CONTACT_STARTED: 'contact_started',
    CONTACT_MESSAGE_ADDED: 'contact_message_added',
    CONTACT_ENDED: 'contact_ended',

    DOCKING_STARTED: 'docking_started',
    DOCKING_ANIMATION_COMPLETED: 'docking_animation_completed',
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

export type BridgeContactStartedViewState = {
    contactName: string;
    contactPortraitId: CharacterPortraitId;
};

export type BridgeContactMessageViewState = {
    speakerName: string;
    text: string;
};

export type BridgeDockingStartedViewState = {
    targetId: string;
};

export type BridgeOfficerBarkViewState = {
    role: OfficerRole;
    text: string;
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
    [BRIDGE_EVENT.OFFICER_COMMAND_SELECTED]: {
        role: OfficerRole;
        commandId: EncounterOfficerCommandId;
        targetId?: string;
    };
    [BRIDGE_EVENT.CONTACT_STARTED]: BridgeContactStartedViewState;
    [BRIDGE_EVENT.CONTACT_MESSAGE_ADDED]: BridgeContactMessageViewState;
    [BRIDGE_EVENT.CONTACT_ENDED]: undefined;
    [BRIDGE_EVENT.DOCKING_STARTED]: BridgeDockingStartedViewState;
    [BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED]: undefined;
    [BRIDGE_EVENT.OFFICER_BARK_REQUESTED]: BridgeOfficerBarkViewState;
};
