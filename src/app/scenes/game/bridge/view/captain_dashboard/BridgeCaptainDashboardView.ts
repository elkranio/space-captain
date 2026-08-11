import type BridgeScene from '../../BridgeScene';
import BridgePlayerShipDashboardView from './player_ship/BridgePlayerShipDashboardView';

const PLAYER_SHIP_POSITION = {
    x: 16,
    y: 500,
} as const;

// Root view капитанского dashboard.
//
// Пока dashboard содержит только стабильную левую часть:
// состояние и системы корабля игрока.
// Внешний context/right side добавим только когда начнём
// соответствующий реальный vertical slice.
export default class BridgeCaptainDashboardView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly playerShipView:
        BridgePlayerShipDashboardView;

    constructor(
        private readonly scene: BridgeScene,
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
            );

        this.playerShipView.setPosition(
            PLAYER_SHIP_POSITION.x,
            PLAYER_SHIP_POSITION.y,
        );

        this.root.add(
            this.playerShipView.getRoot(),
        );
    }

    public destroy(): void {
        this.playerShipView.destroy();
        this.root.destroy(false);
    }
}
