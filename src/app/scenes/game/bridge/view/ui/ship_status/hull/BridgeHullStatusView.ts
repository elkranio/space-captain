// src/app/scenes/game/bridge/view/ui/ship_status/hull/BridgeHullStatusView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

// Отображает только состояние hull.
//
// Не знает:
// - откуда пришли данные;
// - как устроена общая ship status panel;
// - какие другие ship resources существуют.
export default class BridgeHullStatusView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly label: Phaser.GameObjects.BitmapText;

    constructor(scene: BridgeScene) {
        this.root = scene.add.container(0, 0);

        this.label = scene.add.bitmapText(
            0,
            0,

            FONT_FAMILY.VGA_8X14,
            '',

            FONT_SIZE.PX_16,
        );

        this.label.setOrigin(0, 0);
        this.label.setTint(FONT_COLOR.PRIMARY);

        this.root.add(this.label);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setState(current: number, max: number): void {
        this.label.setText(`HULL  ${current}/${max}`);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
