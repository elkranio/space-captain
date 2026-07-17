// src/app/scenes/game/bridge/view/ui/contact/portrait/BridgeContactPortraitView.ts

import type { CharacterPortraitId } from '../../../../../../../../engine/defs/character';
import { CHARACTER_PORTRAIT_SPRITES } from '../../../../../../../manifests/characters/character_portrait';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import { BRIDGE_CONTACT_LAYOUT } from '../bridge_contact_layout';

// View портрета и имени текущего comms contact.
// Владеет только visual content внутри portrait-зоны contact panel.
export default class BridgeContactPortraitView {
    private readonly root: Phaser.GameObjects.Container;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public render(contactName: string, portraitId: CharacterPortraitId): void {
        this.clear();

        this.root.add([this.createPortrait(portraitId), this.createNameLabel(contactName)]);
    }

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

    private clear(): void {
        this.root.removeAll(true);
    }
}
