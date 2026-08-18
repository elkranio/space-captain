// src/app/scenes/game/bridge/view/barks/BridgeOfficerBarksView.ts

import type { OfficerRole } from "../../../../../../engine/defs/officer";
import type BridgeScene from "../../BridgeScene";
import { BRIDGE_EVENT, type BridgeOfficerBarkRequestedPayload } from "../../events/bridge_event";
import type BridgeEventBus from "../../events/BridgeEventBus";
import { OFFICER_BARK_POSITION_BY_ROLE } from "./bridge_officer_bark_layout";
import BridgeOfficerBarkQueueView from "./queue/BridgeOfficerBarkQueueView";

// Root view bark layer.
// Держит отдельную очередь bark-ов для каждого officer-а.
export default class BridgeOfficerBarksView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly queueViewByRole = new Map<OfficerRole, BridgeOfficerBarkQueueView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get("barks").add(this.root);

        this.createQueueViews();

        this.eventBus.on(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, this.handleOfficerBarkRequested, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, this.handleOfficerBarkRequested, this);

        for (const queueView of this.queueViewByRole.values()) {
            queueView.destroy();
        }

        this.queueViewByRole.clear();
        this.root.destroy(false);
    }

    private createQueueViews(): void {
        for (const role of Object.keys(OFFICER_BARK_POSITION_BY_ROLE) as OfficerRole[]) {
            const position = OFFICER_BARK_POSITION_BY_ROLE[role];

            const queueView = new BridgeOfficerBarkQueueView(this.scene, this.root, position);

            this.queueViewByRole.set(role, queueView);
        }
    }

    private handleOfficerBarkRequested(payload: BridgeOfficerBarkRequestedPayload): void {
        const queueView = this.queueViewByRole.get(payload.role);

        if (!queueView) {
            return;
        }

        queueView.enqueue(payload.text);
    }
}
