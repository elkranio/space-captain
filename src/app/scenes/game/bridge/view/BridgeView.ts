// src/app/scenes/game/bridge/view/BridgeView.ts

import type BridgeScene from '../BridgeScene';
import type BridgeEventBus from '../events/BridgeEventBus';
import BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';
import BridgeCaptainDashboardView from './captain_dashboard/BridgeCaptainDashboardView';
import BridgeCombatView from './combat/BridgeCombatView';
import BridgeTargetingWarningView from './indicators/targeting_warning/BridgeTargetingWarningView';
import BridgeInteriorView from './interior/BridgeInteriorView';
import BridgeOfficerStationsView from './officer_stations/BridgeOfficerStationsView';
import BridgeSpaceView from './space/BridgeSpaceView';

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

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public prepare(): void {
        const spaceView = new BridgeSpaceView(
            this.scene,
            this.eventBus,

            (offsetX) => {
                this.combatView
                    ?.setCameraTurnOffsetX(
                        offsetX,
                    );
            },
        );

        this.spaceView = spaceView;

        this.combatView = new BridgeCombatView(
            this.scene,
            this.eventBus,
            spaceView,
        );

        this.combatView.prepare();

        this.interiorView = new BridgeInteriorView(this.scene);

        this.targetingWarningView = new BridgeTargetingWarningView(this.scene, this.eventBus);

        this.officerStationsView = new BridgeOfficerStationsView(this.scene, this.eventBus);

        this.captainDashboardView = new BridgeCaptainDashboardView(this.scene);

        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.officerBarksView?.destroy();
        this.captainDashboardView?.destroy();
        this.officerStationsView?.destroy();
        this.targetingWarningView?.destroy();
        this.interiorView?.destroy();
        this.combatView?.destroy();
        this.spaceView?.destroy();

        this.officerBarksView = undefined;
        this.captainDashboardView = undefined;
        this.officerStationsView = undefined;
        this.targetingWarningView = undefined;
        this.interiorView = undefined;
        this.combatView = undefined;
        this.spaceView = undefined;
    }
}
