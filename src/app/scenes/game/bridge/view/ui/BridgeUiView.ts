// src/app/scenes/game/bridge/view/ui/BridgeUiView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeContactView from './contact/BridgeContactView';
import BridgeEnemyTelemetryView from './enemy_telemetry/BridgeEnemyTelemetryView';
import BridgeOfficerContextMenuView from './officer_context_menu/BridgeOfficerContextMenuView';
import BridgeShipStatusView from './ship_status/BridgeShipStatusView';

// Root view для bridge UI layer.
//
// Собирает самостоятельные UI-модули:
// - player ship status;
// - enemy telemetry;
// - contact panel;
// - officer context menu.
export default class BridgeUiView {
    private readonly shipStatusView:
        BridgeShipStatusView;

    private readonly enemyTelemetryView:
        BridgeEnemyTelemetryView;

    private readonly officerContextMenuView:
        BridgeOfficerContextMenuView;

    private readonly contactView:
        BridgeContactView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.shipStatusView =
            new BridgeShipStatusView(
                this.scene,
                this.eventBus,
            );

        this.enemyTelemetryView =
            new BridgeEnemyTelemetryView(
                this.scene,
                this.eventBus,
            );

        this.officerContextMenuView =
            new BridgeOfficerContextMenuView(
                this.scene,
                this.eventBus,
            );

        this.contactView =
            new BridgeContactView(
                this.scene,
                this.eventBus,
            );
    }

    public destroy(): void {
        this.contactView.destroy();

        this.officerContextMenuView.destroy();

        this.enemyTelemetryView.destroy();

        this.shipStatusView.destroy();
    }
}
