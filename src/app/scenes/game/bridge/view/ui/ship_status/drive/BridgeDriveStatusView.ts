// src/app/scenes/game/bridge/view/ui/ship_status/drive/BridgeDriveStatusView.ts

import {
    SHIP_DRIVE_STATUS,
    type ShipDriveStatus,
} from '../../../../../../../../engine/defs/ship_drive';
import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

// Отображает только состояние main drive.
//
// ONLINE — обычный белый status.
// DISABLED — красный warning.
export default class BridgeDriveStatusView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly label: Phaser.GameObjects.BitmapText;

    constructor(scene: BridgeScene) {
        this.root = scene.add.container(0, 0);

        this.label = scene.add.bitmapText(
            0,
            0,

            FONT_FAMILY.VGA_8X14,
            'ENGINE',

            FONT_SIZE.PX_16,
        );

        this.label.setOrigin(0, 0);
        this.label.setTint(FONT_COLOR.WHITE);

        this.root.add(this.label);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setState(status: ShipDriveStatus): void {
        switch (status) {
            case SHIP_DRIVE_STATUS.ONLINE:
                this.label.setTint(FONT_COLOR.WHITE);
                return;

            case SHIP_DRIVE_STATUS.DISABLED:
                this.label.setTint(FONT_COLOR.DANGER);
                return;

            default:
                return this.assertNever(status);
        }
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private assertNever(value: never): never {
        throw new Error(
            `Unhandled ship drive status: ${String(value)}`,
        );
    }
}
