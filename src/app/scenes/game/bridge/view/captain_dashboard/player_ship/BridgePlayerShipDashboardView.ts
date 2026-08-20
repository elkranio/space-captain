import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgePlayerShipStatusStripView from "./status/BridgePlayerShipStatusStripView";
import BridgePlayerShipSystemsView from "./systems/BridgePlayerShipSystemsView";

const PANEL = {
    width: 416,
    height: 204,

    padding: 8,
    sectionGap: 6,
} as const;

const STATUS_HEIGHT = 38;
const SYSTEMS_HEIGHT = 144;

// Стабильная левая часть captain dashboard.
//
// Этот view отвечает только за физическую композицию:
// status strip → список систем.
// Runtime presentation конкретных систем живёт ниже,
// в focused system views.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly statusStripView: BridgePlayerShipStatusStripView;

    private readonly systemsView: BridgePlayerShipSystemsView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        this.root = scene.add.container(0, 0);

        const innerWidth = PANEL.width - PANEL.padding * 2;

        this.statusStripView = new BridgePlayerShipStatusStripView(scene, eventBus, innerWidth, STATUS_HEIGHT);

        this.statusStripView.setPosition(PANEL.padding, PANEL.padding);

        this.systemsView = new BridgePlayerShipSystemsView(scene, eventBus, innerWidth, SYSTEMS_HEIGHT);

        this.systemsView.setPosition(
            PANEL.padding,

            PANEL.padding + STATUS_HEIGHT + PANEL.sectionGap,
        );

        this.root.add([this.statusStripView.getRoot(), this.systemsView.getRoot()]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public getSize(): { width: number; height: number } {
        return {
            width: PANEL.width,
            height: PANEL.height,
        };
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.systemsView.destroy();
        this.statusStripView.destroy();
        this.root.destroy(false);
    }
}
