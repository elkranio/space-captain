// src/app/scenes/game/bridge/view/ui/BridgeUiView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeOfficerContextMenuView from './officer_context_menu/BridgeOfficerContextMenuView';
import BridgeContactView from './contact/BridgeContactView';

export default class BridgeUiView {
    private readonly officerContextMenuView: BridgeOfficerContextMenuView;
    private contactView?: BridgeContactView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.officerContextMenuView = new BridgeOfficerContextMenuView(this.scene, this.eventBus);
        this.contactView = new BridgeContactView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.contactView?.destroy();
        this.contactView = undefined;
        this.officerContextMenuView.destroy();
    }
}
