import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgePipStripView, {
    type BridgePipStripGeometry,
    type BridgePipStripPalette,
} from "./BridgePipStripView";

const EQUIPMENT_INTEGRITY_PIP: BridgePipStripGeometry = {
    width: 6,
    height: 6,
    gap: 2,
};

const READY_PALETTE: BridgePipStripPalette = {
    filledColor: CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor,
    emptyColor: CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor,
    emptyAlpha: CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.emptyAlpha,
};

const BROKEN_PALETTE: BridgePipStripPalette = {
    filledColor: CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor,
    emptyColor: CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor,
    emptyAlpha: CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.emptyAlpha,
};

// Shared right-aligned equipment integrity strip.
// Equipment tiles own semantics; this view only owns pip geometry and broken coloring.
export default class BridgeEquipmentIntegrityView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly pipStrip: BridgePipStripView;

    private rightEdge = 0;

    private broken = false;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.pipStrip = new BridgePipStripView(
            this.scene,
            READY_PALETTE,
            EQUIPMENT_INTEGRITY_PIP,
        );
        this.root.add(this.pipStrip.getRoot());
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setRightEdge(x: number): void {
        this.rightEdge = x;
        this.layout();
    }

    public update(current: number, max: number, broken = max > 0 && current <= 0): void {
        if (this.broken !== broken) {
            this.broken = broken;
            this.pipStrip.setPalette(broken ? BROKEN_PALETTE : READY_PALETTE);
        }

        this.pipStrip.setValue(current, max);
        this.layout();
    }

    public destroy(): void {
        this.pipStrip.destroy();
        this.root.destroy(true);
    }

    private layout(): void {
        this.pipStrip.setPosition(this.rightEdge - this.pipStrip.getWidth(), 0);
    }
}
