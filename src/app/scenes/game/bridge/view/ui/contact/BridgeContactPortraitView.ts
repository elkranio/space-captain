// src/app/scenes/game/bridge/view/ui/contact/BridgeContactPortraitView.ts

import type { CharacterPortraitId } from '../../../../../../../engine/defs/character';
import { CHARACTER_PORTRAIT_SPRITES } from '../../../../../../manifests/characters/character_portrait';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_CONTACT_LAYOUT } from './bridge_contact_layout';

export default class BridgeContactPortraitView {
    // #region Fields
    private readonly root: Phaser.GameObjects.Container;

    private portrait?: Phaser.GameObjects.Image;
    private nameLabel?: Phaser.GameObjects.BitmapText;
    // #endregion

    // #region Lifecycle
    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
    // #endregion

    // #region Public API
    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public render(contactName: string, portraitId: CharacterPortraitId): void {
        this.clear();

        this.portrait = this.createPortrait(portraitId);
        this.nameLabel = this.createNameLabel(contactName);

        this.root.add([this.portrait, this.nameLabel]);
    }
    // #endregion

    // #region Rendering
    private createPortrait(portraitId: CharacterPortraitId): Phaser.GameObjects.Image {
        const sprite = CHARACTER_PORTRAIT_SPRITES[portraitId];

        return this.scene.add
            .image(
                BRIDGE_CONTACT_LAYOUT.portrait.image.x,
                BRIDGE_CONTACT_LAYOUT.portrait.image.y,
                sprite.atlasKey,
                sprite.frameKey,
            )
            .setOrigin(BRIDGE_CONTACT_LAYOUT.portrait.image.originX, BRIDGE_CONTACT_LAYOUT.portrait.image.originY);
    }

    private createNameLabel(contactName: string): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                BRIDGE_CONTACT_LAYOUT.portrait.nameLabel.x,
                BRIDGE_CONTACT_LAYOUT.portrait.nameLabel.y,
                FONT_FAMILY.VGA_8X14,
                contactName,
                FONT_SIZE.PX_16,
            )
            .setOrigin(
                BRIDGE_CONTACT_LAYOUT.portrait.nameLabel.originX,
                BRIDGE_CONTACT_LAYOUT.portrait.nameLabel.originY,
            )
            .setTint(FONT_COLOR.PRIMARY);
    }
    // #endregion

    // #region State
    private clear(): void {
        this.root.removeAll(true);

        this.portrait = undefined;
        this.nameLabel = undefined;
    }
    // #endregion
}
