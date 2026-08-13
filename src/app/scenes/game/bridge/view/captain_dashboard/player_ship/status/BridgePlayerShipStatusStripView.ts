import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../../captain_dashboard_style';
import {
    BRIDGE_EVENT,
    type BridgePlayerShipDashboardUpdatedPayload,
} from '../../../../events/bridge_event';
import type BridgeEventBus from '../../../../events/BridgeEventBus';

const CELL = {
    textPaddingX: 10,
    textY: 8,
} as const;

const BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,
} as const;

const WIDTH_RATIO = {
    hull: 0.25,
    defense: 0.35,
    engine: 0.40,
} as const;

// Captain dashboard top strip.
//
// The old separate turret/shield resource cells are deliberately gone:
// both defensive actions now consume the one shared POWER CORE.
// The DEF bar shows only progress toward the next sequential charge.
export default class BridgePlayerShipStatusStripView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly hullText:
        Phaser.GameObjects.BitmapText;

    private readonly defenseText:
        Phaser.GameObjects.BitmapText;

    private readonly engineText:
        Phaser.GameObjects.BitmapText;

    private readonly defenseTrack:
        Phaser.GameObjects.Rectangle;

    private readonly defenseFill:
        Phaser.GameObjects.Rectangle;

    private readonly defenseBarWidth:
        number;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,

        width: number,
        height: number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        const hullWidth =
            width *
            WIDTH_RATIO.hull;

        const defenseWidth =
            width *
            WIDTH_RATIO.defense;

        const engineWidth =
            width -
            hullWidth -
            defenseWidth;

        const hullX = 0;
        const defenseX =
            hullWidth;
        const engineX =
            hullWidth +
            defenseWidth;

        this.createCell(
            hullX,
            hullWidth,
            height,
        );

        this.createCell(
            defenseX,
            defenseWidth,
            height,
        );

        this.createCell(
            engineX,
            engineWidth,
            height,
        );

        this.hullText =
            this.createText(
                hullX +
                    CELL.textPaddingX,
                'HULL --/--',
            );

        this.defenseText =
            this.createText(
                defenseX +
                    CELL.textPaddingX,
                'DEF --/--',
            );

        this.engineText =
            this.createText(
                engineX +
                    CELL.textPaddingX,
                'ENGINE --',
            );

        this.defenseBarWidth =
            Math.max(
                1,
                defenseWidth -
                    BAR.sidePadding * 2,
            );

        const barY =
            height -
            BAR.bottomPadding -
            BAR.height;

        this.defenseTrack =
            this.scene.add
                .rectangle(
                    defenseX +
                        BAR.sidePadding,
                    barY,

                    this.defenseBarWidth,
                    BAR.height,

                    CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.trackColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

        this.defenseFill =
            this.scene.add
                .rectangle(
                    defenseX +
                        BAR.sidePadding,
                    barY,

                    this.defenseBarWidth,
                    BAR.height,

                    CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.fillColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

        this.root.add([
            this.hullText,
            this.defenseText,
            this.engineText,
            this.defenseTrack,
            this.defenseFill,
        ]);

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_SHIP_DASHBOARD_UPDATED,

            this.handleDashboardUpdated,
            this,
        );
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
        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_SHIP_DASHBOARD_UPDATED,

            this.handleDashboardUpdated,
            this,
        );

        this.root.destroy(true);
    }

    private createCell(
        x: number,
        width: number,
        height: number,
    ): void {
        const background =
            this.scene.add
                .rectangle(
                    x,
                    0,

                    width,
                    height,

                    CAPTAIN_DASHBOARD_STYLE.statusCell.backgroundColor,
                    CAPTAIN_DASHBOARD_STYLE.statusCell.backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    CAPTAIN_DASHBOARD_STYLE.statusCell.borderThickness,
                    CAPTAIN_DASHBOARD_STYLE.statusCell.borderColor,
                );

        this.root.add(
            background,
        );
    }

    private createText(
        x: number,
        text: string,
    ): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                x,
                CELL.textY,

                FONT_FAMILY.VGA_8X14,
                text,
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(
                FONT_COLOR.PRIMARY,
            );
    }

    private handleDashboardUpdated(
        payload:
            BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const status =
            payload.status;

        if (!status) {
            return;
        }

        this.hullText.setText(
            'HULL ' +
                status.hull.current +
                '/' +
                status.hull.max,
        );

        const blindInterceptChance =
            status
                .defenseTurret
                ?.blindInterceptChance;

        this.defenseText.setText(
            'DEF ' +
                status
                    .powerCore
                    .current +
                '/' +
                status
                    .powerCore
                    .max +
                (blindInterceptChance !==
                undefined
                    ? '  TURRET ' +
                      Math.round(
                          blindInterceptChance *
                              100,
                      ) +
                      '%'
                    : ''),
        );

        this.engineText.setText(
            'ENGINE ' +
                status.drive.status
                    .toUpperCase(),
        );

        const progress =
            status
                .powerCore
                .rechargeProgress;

        const isRecharging =
            progress !== undefined;

        this.defenseTrack
            .setVisible(
                isRecharging,
            );

        this.defenseFill
            .setVisible(
                isRecharging,
            );

        this.defenseFill.setScale(
            isRecharging
                ? progress
                : 0,
            1,
        );
    }
}
