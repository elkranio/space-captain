import type BridgeScene from '../../../../BridgeScene';
import type { BridgeOfficerStationIndicatorState } from '../../../../events/bridge_event';

const INDICATOR_POSITIONS = [
    {
        x: -77,
        y: -5,
    },
    {
        x: 77,
        y: -5,
    },
] as const;

const INDICATOR_SIZE = {
    width: 12,
    height: 4,
} as const;

const INDICATOR_COLOR = {
    ready: 0x67d98b,
    busy: 0xe5b84f,
    blocked: 0xe45b5b,
} as const;

type VisibleIndicatorState = Exclude<BridgeOfficerStationIndicatorState, 'off'>;

// A mirrored pair intentionally repeats one availability state.
// Left and right lights do not represent separate systems.
export default class BridgeOfficerStationIndicatorsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly indicators: Phaser.GameObjects.Rectangle[];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);

        this.indicators = INDICATOR_POSITIONS.map((position) => {
            return this.scene.add
                .rectangle(
                    position.x,
                    position.y,
                    INDICATOR_SIZE.width,
                    INDICATOR_SIZE.height,
                    INDICATOR_COLOR.ready,
                )
                .setOrigin(0.5, 0.5)
                .setVisible(false);
        });

        this.root.add(this.indicators);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setState(state: BridgeOfficerStationIndicatorState): void {
        if (state === 'off') {
            this.setVisible(false);

            return;
        }

        const color = this.getColor(state);

        for (const indicator of this.indicators) {
            indicator.setFillStyle(color).setVisible(true);
        }
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private setVisible(visible: boolean): void {
        for (const indicator of this.indicators) {
            indicator.setVisible(visible);
        }
    }

    private getColor(state: VisibleIndicatorState): number {
        switch (state) {
            case 'ready':
                return INDICATOR_COLOR.ready;

            case 'busy':
                return INDICATOR_COLOR.busy;

            case 'blocked':
                return INDICATOR_COLOR.blocked;

            default:
                return assertNever(state);
        }
    }
}

function assertNever(value: never): never {
    throw new Error(`Unknown officer station indicator state: ${value}`);
}
