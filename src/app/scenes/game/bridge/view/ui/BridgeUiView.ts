// src/app/scenes/game/bridge/view/ui/BridgeUiView.ts

import {
    DEBUG_SETTINGS,
} from '../../../../../debug/debug_settings';
import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeEnemyDebugPanelView from './enemy_debug/BridgeEnemyDebugPanelView';
import BridgeEnemyTelemetryView from './enemy_telemetry/BridgeEnemyTelemetryView';
import BridgeOfficerContextMenuView from './officer_context_menu/BridgeOfficerContextMenuView';
import BridgeShipStatusView from './ship_status/BridgeShipStatusView';

// Root view для bridge UI layer.
//
// Собирает самостоятельные UI-модули:
// - player ship status;
// - enemy telemetry;
// - optional enemy debug panel;
// - officer context menu.
export default class BridgeUiView {
    private readonly shipStatusView:
        BridgeShipStatusView;

    private readonly enemyTelemetryView:
        BridgeEnemyTelemetryView;

    private readonly enemyDebugPanelView?:
        BridgeEnemyDebugPanelView;

    private readonly officerContextMenuView:
        BridgeOfficerContextMenuView;

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

        if (
            DEBUG_SETTINGS.bridge
                .encounter
                .showEnemyDebugPanel
        ) {
            this.enemyDebugPanelView =
                new BridgeEnemyDebugPanelView(
                    this.scene,
                    this.eventBus,
                );
        }

        this.officerContextMenuView =
            new BridgeOfficerContextMenuView(
                this.scene,
                this.eventBus,
            );
    }

    public destroy(): void {
        this.officerContextMenuView.destroy();

        this.enemyDebugPanelView
            ?.destroy();

        this.enemyTelemetryView.destroy();

        this.shipStatusView.destroy();
    }
}
