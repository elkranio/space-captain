// src/app/scenes/game/bridge/view/interior/BridgeInteriorView.ts

import { BRIDGE_INTERIOR_ID, BRIDGE_INTERIOR_SPRITES } from "../../../../../manifests/bridge/interior";
import type BridgeScene from "../../BridgeScene";

// View статичного bridge interior overlay.
// Отвечает только за Phaser image в bridge layer.
export default class BridgeInteriorView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(scene: BridgeScene) {
        this.root = scene.add.container(0, 0);
        scene.layers.get("bridge").add(this.root);

        const interior = BRIDGE_INTERIOR_SPRITES[BRIDGE_INTERIOR_ID.GENERIC_01];

        const interiorImage = scene.add.image(0, 0, interior.atlasKey, interior.frameKey).setOrigin(0, 0);

        this.root.add(interiorImage);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
