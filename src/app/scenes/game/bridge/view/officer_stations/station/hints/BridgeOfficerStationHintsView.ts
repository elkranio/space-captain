import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

const HINT_ROW = {
    x: -57,
    firstY: -77,
    gapY: 15,
} as const;

const MAX_HINT_ROWS = 2;

// Idle combat actions shown directly on the station monitor.
// They remain informational: the station still opens the regular command menu.
export default class BridgeOfficerStationHintsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly rows: Phaser.GameObjects.BitmapText[];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);

        this.rows = Array.from({
            length: MAX_HINT_ROWS,
        }).map((_, index) => {
            return this.scene.add
                .bitmapText(
                    HINT_ROW.x,
                    HINT_ROW.firstY + HINT_ROW.gapY * index,
                    FONT_FAMILY.VGA_8X14,
                    '',
                    FONT_SIZE.PX_12,
                )
                .setOrigin(0, 0.5)
                .setTint(FONT_COLOR.SECONDARY)
                .setVisible(false);
        });

        this.root.add(this.rows);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setHints(hints: readonly string[]): void {
        for (let index = 0; index < this.rows.length; index += 1) {
            const hint = hints[index];

            if (!hint) {
                this.rows[index].setText('').setVisible(false);

                continue;
            }

            this.rows[index]
                .setText(`> ${hint}`)
                .setVisible(true);
        }
    }

    public clear(): void {
        this.setHints([]);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
