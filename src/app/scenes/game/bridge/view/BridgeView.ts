// src/app/scenes/game/bridge/view/BridgeView.ts

import type BridgeScene from "../BridgeScene";
import type BridgeEventBus from "../events/BridgeEventBus";
import BridgeOfficerBarksView from "./barks/BridgeOfficerBarksView";
import BridgeCaptainDashboardView from "./captain_dashboard/BridgeCaptainDashboardView";
import BridgeCombatView from "./combat/BridgeCombatView";
import BridgeTargetingWarningView from "./indicators/targeting_warning/BridgeTargetingWarningView";
import BridgeInteriorView from "./interior/BridgeInteriorView";
import BridgeOfficerStationsView from "./officer_stations/BridgeOfficerStationsView";
import BridgeSpaceView from "./space/BridgeSpaceView";
import BridgeOfficerContextMenuView from "./ui/officer_context_menu/BridgeOfficerContextMenuView";

// Root view bridge scene.
// Собирает верхнеуровневые визуальные модули
// и отвечает только за их lifecycle.
export default class BridgeView {
    private interiorView?: BridgeInteriorView;

    private captainDashboardView?: BridgeCaptainDashboardView;

    private targetingWarningView?: BridgeTargetingWarningView;

    private combatView?: BridgeCombatView;

    private officerStationsView?: BridgeOfficerStationsView;

    private spaceView?: BridgeSpaceView;

    private officerBarksView?: BridgeOfficerBarksView;

    private officerContextMenuView?: BridgeOfficerContextMenuView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        const spaceView = new BridgeSpaceView(
            scene,
            eventBus,

            (offsetX) => {
                this.combatView?.setCameraTurnOffsetX(offsetX);
            },
        );

        this.spaceView = spaceView;

        this.combatView = new BridgeCombatView(scene, eventBus, spaceView);

        this.interiorView = new BridgeInteriorView(scene);

        this.targetingWarningView = new BridgeTargetingWarningView(scene, eventBus);

        this.officerStationsView = new BridgeOfficerStationsView(scene, eventBus);

        this.captainDashboardView = new BridgeCaptainDashboardView(scene, eventBus);

        this.officerBarksView = new BridgeOfficerBarksView(scene, eventBus);

        // Officer station clicks still use the command-menu flow.
        // The context menu belongs directly to the active BridgeView lifecycle.
        this.officerContextMenuView = new BridgeOfficerContextMenuView(scene, eventBus);
    }

    public destroy(): void {
        this.officerContextMenuView?.destroy();
        this.officerBarksView?.destroy();
        this.captainDashboardView?.destroy();
        this.officerStationsView?.destroy();
        this.targetingWarningView?.destroy();
        this.interiorView?.destroy();
        this.combatView?.destroy();
        this.spaceView?.destroy();

        this.officerContextMenuView = undefined;
        this.officerBarksView = undefined;
        this.captainDashboardView = undefined;
        this.officerStationsView = undefined;
        this.targetingWarningView = undefined;
        this.interiorView = undefined;
        this.combatView = undefined;
        this.spaceView = undefined;
    }
}
