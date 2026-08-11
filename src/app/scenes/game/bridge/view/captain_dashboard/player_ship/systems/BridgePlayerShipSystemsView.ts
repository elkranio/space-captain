import type BridgeScene from '../../../../BridgeScene';
import BridgePlayerShipSystemRowView, {
    type BridgePlayerShipSystemRowLayout,
} from './BridgePlayerShipSystemRowView';

const SYSTEM_ROWS:
    BridgePlayerShipSystemRowLayout[] = [
        {
            iconLabel: 'MSL',
            label: 'MISSILE --/--',
            roleLabel: 'WPN',
        },
        {
            iconLabel: 'LAS',
            label: 'LASER',
            roleLabel: 'WPN',
        },
        {
            iconLabel: 'MIN',
            label: 'MINES --/--',
            roleLabel: 'WPN',
        },
        {
            iconLabel: 'EW',
            label: 'SPAM',
            roleLabel: 'SCI',
        },
    ];

// Layout-only list player ship systems.
//
// Четыре строки уже являются реальным текущим content,
// поэтому повторяемый row component здесь не speculative.
export default class BridgePlayerShipSystemsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly rowViews:
        BridgePlayerShipSystemRowView[] = [];

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

        const rowHeight =
            height /
            SYSTEM_ROWS.length;

        for (
            let index = 0;
            index < SYSTEM_ROWS.length;
            index += 1
        ) {
            const row =
                SYSTEM_ROWS[index];

            if (!row) {
                continue;
            }

            const rowView =
                new BridgePlayerShipSystemRowView(
                    this.scene,
                    width,
                    rowHeight,
                    row,
                );

            rowView.setPosition(
                0,
                rowHeight *
                    index,
            );

            this.rowViews.push(
                rowView,
            );

            this.root.add(
                rowView.getRoot(),
            );
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
        for (
            const rowView
            of this.rowViews
        ) {
            rowView.destroy();
        }

        this.rowViews.length = 0;
        this.root.destroy(false);
    }
}
