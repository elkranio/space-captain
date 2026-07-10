// src\app\scenes\game\bridge\view\crew\BridgeCrewView.ts

import { OFFICER_ROLE, OfficerDefinition, type OfficerRole } from '../../../../../../engine/defs/officer';
import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { BRIDGE_CREW_POSITIONS } from './bridge_crew_layout';
import BridgeSeatView from './seat/BridgeSeatView';

const BRIDGE_CREW_ROLE_ORDER = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;

export default class BridgeCrewView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly seats: BridgeSeatView[] = [];

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('bridge').add(this.root);

        this.createSeats();

        this.eventBus.on(BRIDGE_EVENT.CREW_LOADED, this.setCrew, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.CREW_LOADED, this.setCrew, this);

        for (const seat of this.seats) {
            seat.destroy();
        }

        this.seats.length = 0;
        this.root.destroy(true);
    }

    private createSeats(): void {
        for (const position of BRIDGE_CREW_POSITIONS) {
            this.seats.push(new BridgeSeatView(this.scene, this.root, position));
        }
    }

    private setCrew(officers: Record<OfficerRole, OfficerDefinition>): void {
        for (let index = 0; index < this.seats.length; index += 1) {
            const role = BRIDGE_CREW_ROLE_ORDER[index];

            if (!role) {
                this.seats[index].clearRole();
                continue;
            }

            this.seats[index].setOfficer(officers[role]);
        }
    }
}
