// src/app/scenes/game/bridge/view/interior/BridgeInteriorView.ts

import { BRIDGE_INTERIOR_ID, BRIDGE_INTERIOR_SPRITES } from "../../../../../manifests/bridge/interior";
import type BridgeScene from "../../BridgeScene";

// View статичного bridge interior overlay.
// Отвечает только за Phaser image в bridge layer.
export default class BridgeInteriorView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly interiorImage: Phaser.GameObjects.Image;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get("bridge").add(this.root);

        const interior = BRIDGE_INTERIOR_SPRITES[BRIDGE_INTERIOR_ID.GENERIC_01];

        this.interiorImage = this.scene.add.image(0, 0, interior.atlasKey, interior.frameKey).setOrigin(0, 0);

        this.root.add(this.interiorImage);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
