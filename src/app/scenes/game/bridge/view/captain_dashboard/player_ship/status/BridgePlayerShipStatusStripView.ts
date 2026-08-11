import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

type StatusCell = {
    label: string;
};

const STATUS_CELLS: StatusCell[] = [
    {
        label: 'HULL',
    },
    {
        label: 'PD',
    },
    {
        label: 'SHD',
    },
    {
        label: 'ENGINE',
    },
];

const CELL = {
    backgroundColor: 0x101923,
    backgroundAlpha: 0.96,

    borderColor: 0x31465b,
    borderThickness: 1,

    textPaddingX: 10,
    textY: 11,
} as const;

// Layout-only status strip.
//
// Значения состояния здесь намеренно не показываются:
// runtime snapshot подключим после принятия геометрии.
export default class BridgePlayerShipStatusStripView {
    private readonly root:
        Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        const cellWidth =
            width /
            STATUS_CELLS.length;

        for (
            let index = 0;
            index < STATUS_CELLS.length;
            index += 1
        ) {
            const cell =
                STATUS_CELLS[index];

            if (!cell) {
                continue;
            }

            const x =
                cellWidth *
                index;

            const background =
                this.scene.add
                    .rectangle(
                        x,
                        0,

                        cellWidth,
                        height,

                        CELL.backgroundColor,
                        CELL.backgroundAlpha,
                    )
                    .setOrigin(0, 0)
                    .setStrokeStyle(
                        CELL.borderThickness,
                        CELL.borderColor,
                    );

            const label =
                this.scene.add
                    .bitmapText(
                        x +
                            CELL.textPaddingX,

                        CELL.textY,

                        FONT_FAMILY.VGA_8X14,
                        cell.label,
                        FONT_SIZE.PX_16,
                    )
                    .setOrigin(0, 0)
                    .setTint(
                        FONT_COLOR.PRIMARY,
                    );

            this.root.add([
                background,
                label,
            ]);
        }
    }

    public getRoot():
        Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(
        x: number,
        y: number,
    ): void {
        this.root.setPosition(
            x,
            y,
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
