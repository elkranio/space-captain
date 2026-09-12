import {
    BRIDGE_OFFICER_PORTRAIT_SPRITES,
    BRIDGE_OFFICER_PORTRAIT_STATE,
    type BridgeOfficerPortraitState,
} from "../../../../../../manifests/bridge/officer_portraits";
import type { OfficerRole } from "../../../../../../../engine/defs/officer";
import type BridgeScene from "../../../BridgeScene";

export default class BridgeOfficerPortraitView {
    private readonly image: Phaser.GameObjects.Image;

    constructor(
        scene: BridgeScene,
        private readonly role: OfficerRole,
        parent: Phaser.GameObjects.Container,
        flipX: boolean,
    ) {
        const sprite = BRIDGE_OFFICER_PORTRAIT_SPRITES[this.role][BRIDGE_OFFICER_PORTRAIT_STATE.IDLE];

        this.image = scene.add.image(0, 0, sprite.atlasKey, sprite.frameKey).setOrigin(0.5, 0.5).setFlipX(flipX);
        parent.add(this.image);
    }

    public setState(state: BridgeOfficerPortraitState): void {
        const sprite = BRIDGE_OFFICER_PORTRAIT_SPRITES[this.role][state];

        this.image.setTexture(sprite.atlasKey, sprite.frameKey);
    }

    public destroy(): void {
        this.image.destroy();
    }
}
