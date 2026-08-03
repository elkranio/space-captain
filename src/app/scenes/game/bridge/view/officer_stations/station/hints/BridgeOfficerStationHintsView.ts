import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

const HINT_LAYOUT = {
    x: -60,
    firstY: -74,
    rowGapY: 17,
    maxRows: 2,
} as const;

const HINT_BLINK = {
    brightAlpha: 1,
    dimAlpha: 0.4,
    intervalMs: 480,
} as const;

// Idle combat actions shown directly on the station monitor.
// They remain informational: the station still opens the regular command menu.
export default class BridgeOfficerStationHintsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly rows: Phaser.GameObjects.BitmapText[];

    private blinkTimer?: Phaser.Time.TimerEvent;

    private isDimmed = false;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);

        this.rows = Array.from({
            length: HINT_LAYOUT.maxRows,
        }).map((_, index) => {
            return this.scene.add
                .bitmapText(
                    HINT_LAYOUT.x,
                    HINT_LAYOUT.firstY + HINT_LAYOUT.rowGapY * index,
                    FONT_FAMILY.VGA_8X14,
                    '',
                    FONT_SIZE.PX_14,
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
        let hasVisibleHints = false;

        for (let index = 0; index < this.rows.length; index += 1) {
            const hint = hints[index];

            if (!hint) {
                this.rows[index].setText('').setVisible(false);

                continue;
            }

            hasVisibleHints = true;

            this.rows[index]
                .setText(`> ${hint}`)
                .setVisible(true);
        }

        if (hasVisibleHints) {
            this.startBlinking();

            return;
        }

        this.stopBlinking();
    }

    public clear(): void {
        this.setHints([]);
    }

    public destroy(): void {
        this.stopBlinking();

        this.root.destroy(true);
    }

    private startBlinking(): void {
        if (this.blinkTimer) {
            return;
        }

        this.isDimmed = false;
        this.root.setAlpha(HINT_BLINK.brightAlpha);

        this.blinkTimer = this.scene.time.addEvent({
            delay: HINT_BLINK.intervalMs,
            loop: true,
            callback: () => {
                this.isDimmed = !this.isDimmed;

                this.root.setAlpha(
                    this.isDimmed
                        ? HINT_BLINK.dimAlpha
                        : HINT_BLINK.brightAlpha,
                );
            },
        });
    }

    private stopBlinking(): void {
        this.blinkTimer?.remove(false);
        this.blinkTimer = undefined;

        this.isDimmed = false;
        this.root.setAlpha(HINT_BLINK.brightAlpha);
    }
}
