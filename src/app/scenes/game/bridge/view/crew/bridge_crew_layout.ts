// src/app/scenes/game/bridge/view/crew/bridge_crew_layout.ts

import { OFFICER_ROLE, type OfficerRole } from '../../../../../../engine/defs/officer';

export type BridgeCrewSeatLayoutEntry = {
    officerRole: OfficerRole | null;
    position: Phaser.Math.Vector2;
};

export const BRIDGE_CREW_SEAT_LAYOUT = [
    // Левый ряд: верх / середина / низ
    {
        officerRole: OFFICER_ROLE.COMMS,
        position: new Phaser.Math.Vector2(125, 135),
    },
    {
        officerRole: OFFICER_ROLE.SCIENCE,
        position: new Phaser.Math.Vector2(125, 350),
    },
    {
        officerRole: OFFICER_ROLE.HELM,
        position: new Phaser.Math.Vector2(125, 565),
    },

    // Правый ряд: верх / середина / низ
    {
        officerRole: OFFICER_ROLE.WEAPONS,
        position: new Phaser.Math.Vector2(1155, 135),
    },
    {
        officerRole: OFFICER_ROLE.ENGINEER,
        position: new Phaser.Math.Vector2(1155, 350),
    },

    // Зарезервированное VIP-кресло.
    {
        officerRole: null,
        position: new Phaser.Math.Vector2(1155, 565),
    },
] as const satisfies readonly BridgeCrewSeatLayoutEntry[];
