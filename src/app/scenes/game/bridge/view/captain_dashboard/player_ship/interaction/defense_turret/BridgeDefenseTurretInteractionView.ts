import {
    UI_BUTTON_SPRITE_ID,
    UI_BUTTON_SPRITES,
} from "../../../../../../../../manifests/ui/button";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../../theme/font";
import type BridgeScene from "../../../../../BridgeScene";

const VIEW = {
    titleX: 0,
    titleY: 0,

    closeRight: 0,
    closeY: 0,
} as const;

export default class BridgeDefenseTurretInteractionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly closeButton: Phaser.GameObjects.Image;

    constructor(
        scene: BridgeScene,
        width: number,
        onCloseRequested: () => void,
    ) {
        this.root = scene.add.container(0, 0);

        const title = scene.add
            .bitmapText(
                VIEW.titleX,
                VIEW.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "DEFENSE TURRET",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        const closeSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.CLOSE_00];

        this.closeButton = scene.add
            .image(
                width - VIEW.closeRight,
                VIEW.closeY,
                closeSprite.atlasKey,
                closeSprite.frameKey,
            )
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });

        this.closeButton.on("pointerup", onCloseRequested);

        this.root.add([
            title,
            this.closeButton,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
