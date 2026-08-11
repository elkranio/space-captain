import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeCaptainCombatContextView from './combat_context/BridgeCaptainCombatContextView';
import BridgePlayerShipDashboardView from './player_ship/BridgePlayerShipDashboardView';

const PLAYER_SHIP_POSITION = {
    x: 16,
    y: 500,
} as const;

const COMBAT_CONTEXT_POSITION = {
    x: 440,
    y: 500,
} as const;

// Root view капитанского dashboard.
//
// Левая часть стабильна: player ship.
// Правая часть context-driven и сейчас содержит
// первый реальный combat slice: enemy status + missiles.
export default class BridgeCaptainDashboardView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly playerShipView:
        BridgePlayerShipDashboardView;

    private readonly combatContextView:
        BridgeCaptainCombatContextView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.scene.layers
            .get('ui')
            .add(this.root);

        this.playerShipView =
            new BridgePlayerShipDashboardView(
                this.scene,
                this.eventBus,
            );

        this.playerShipView.setPosition(
            PLAYER_SHIP_POSITION.x,
            PLAYER_SHIP_POSITION.y,
        );

        this.combatContextView =
            new BridgeCaptainCombatContextView(
                this.scene,
                this.eventBus,
            );

        this.combatContextView.setPosition(
            COMBAT_CONTEXT_POSITION.x,
            COMBAT_CONTEXT_POSITION.y,
        );

        this.root.add([
            this.playerShipView.getRoot(),
            this.combatContextView.getRoot(),
        ]);
    }

    public destroy(): void {
        this.combatContextView.destroy();
        this.playerShipView.destroy();

        this.root.destroy(false);
    }
}
