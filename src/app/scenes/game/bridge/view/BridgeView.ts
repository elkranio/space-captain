// src/app/scenes/game/bridge/view/BridgeView.ts

import type BridgeScene from "../BridgeScene";
import type BridgeEventBus from "../events/BridgeEventBus";
import BridgeCaptainDashboardView from "./captain_dashboard/BridgeCaptainDashboardView";
import BridgeCombatView from "./combat/BridgeCombatView";
import BridgeTargetingWarningView from "./indicators/targeting_warning/BridgeTargetingWarningView";
import BridgeInteriorView from "./interior/BridgeInteriorView";
import BridgeOfficerStationsView from "./officer_stations/BridgeOfficerStationsView";
import BridgeSpaceView from "./space/BridgeSpaceView";

// Root view bridge scene.
// Собирает верхнеуровневые визуальные модули
// и отвечает только за их lifecycle.
export default class BridgeView {
    private readonly interiorView: BridgeInteriorView;

    private readonly captainDashboardView: BridgeCaptainDashboardView;

    private readonly targetingWarningView: BridgeTargetingWarningView;

    private readonly combatView: BridgeCombatView;

    private readonly officerStationsView: BridgeOfficerStationsView;

    private readonly spaceView: BridgeSpaceView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        const spaceView = new BridgeSpaceView(
            scene,
            eventBus,

            (offsetX) => {
                this.combatView.setCameraTurnOffsetX(offsetX);
            },
        );

        this.spaceView = spaceView;

        this.combatView = new BridgeCombatView(scene, eventBus, spaceView);

        this.interiorView = new BridgeInteriorView(scene);

        this.targetingWarningView = new BridgeTargetingWarningView(scene, eventBus);

        this.officerStationsView = new BridgeOfficerStationsView(scene);

        this.captainDashboardView = new BridgeCaptainDashboardView(scene, eventBus);
    }

    public destroy(): void {
        this.captainDashboardView.destroy();
        this.officerStationsView.destroy();
        this.targetingWarningView.destroy();
        this.interiorView.destroy();
        this.combatView.destroy();
        this.spaceView.destroy();
    }
}
