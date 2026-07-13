// src/app/scenes/game/bridge/view/ui/BridgeUiView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeOfficerContextMenuView from './officer_context_menu/BridgeOfficerContextMenuView';

export default class BridgeUiView {
    private readonly officerContextMenuView: BridgeOfficerContextMenuView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.officerContextMenuView = new BridgeOfficerContextMenuView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.officerContextMenuView.destroy();
    }
}
