import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeCaptainCombatContextUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeCaptainMissileThreatsView from './threats/BridgeCaptainMissileThreatsView';

const PANEL = {
    width: 824,
    height: 204,

    padding: 8,
    sectionGap: 6,

    backgroundColor: 0x0b1018,
    backgroundAlpha: 0.94,

    borderColor: 0x40546a,
    borderThickness: 2,
} as const;

const STATUS_HEIGHT = 38;
const THREATS_HEIGHT = 144;

const STATUS_CELL = {
    backgroundColor: 0x101923,
    backgroundAlpha: 0.96,

    borderColor: 0x31465b,
    borderThickness: 1,

    textPaddingX: 10,
    textY: 8,
} as const;

const DEF_BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,

    trackColor: 0x26384a,
    fillColor: 0xb69a45,
} as const;

// Правая contextual часть captain dashboard.
//
// Пока она намеренно знает только:
// - HULL/DEF текущего enemy ship;
// - incoming missile rows.
//
// Другие threat-типы будут добавляться в этот же органичный экран,
// а не отдельными popup/menu системами.
export default class BridgeCaptainCombatContextView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly background:
        Phaser.GameObjects.Rectangle;

    private readonly hullText:
        Phaser.GameObjects.BitmapText;

    private readonly defenseText:
        Phaser.GameObjects.BitmapText;

    private readonly defenseTrack:
        Phaser.GameObjects.Rectangle;

    private readonly defenseFill:
        Phaser.GameObjects.Rectangle;

    private readonly defenseBarWidth:
        number;

    private readonly missileThreatsView:
        BridgeCaptainMissileThreatsView;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.background =
            this.scene.add
                .rectangle(
                    0,
                    0,

                    PANEL.width,
                    PANEL.height,

                    PANEL.backgroundColor,
                    PANEL.backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    PANEL.borderThickness,
                    PANEL.borderColor,
                );

        const innerWidth =
            PANEL.width -
            PANEL.padding * 2;

        const cellWidth =
            innerWidth / 2;

        const hullX =
            PANEL.padding;

        const defenseX =
            PANEL.padding +
            cellWidth;

        this.createStatusCell(
            hullX,
            PANEL.padding,
            cellWidth,
            STATUS_HEIGHT,
        );

        this.createStatusCell(
            defenseX,
            PANEL.padding,
            cellWidth,
            STATUS_HEIGHT,
        );

        this.hullText =
            this.createStatusText(
                hullX +
                    STATUS_CELL
                        .textPaddingX,

                PANEL.padding +
                    STATUS_CELL
                        .textY,

                'HULL --/--',
            );

        this.defenseText =
            this.createStatusText(
                defenseX +
                    STATUS_CELL
                        .textPaddingX,

                PANEL.padding +
                    STATUS_CELL
                        .textY,

                'DEF --/--',
            );

        this.defenseBarWidth =
            Math.max(
                1,
                cellWidth -
                    DEF_BAR.sidePadding *
                        2,
            );

        const defenseBarY =
            PANEL.padding +
            STATUS_HEIGHT -
            DEF_BAR.bottomPadding -
            DEF_BAR.height;

        this.defenseTrack =
            this.scene.add
                .rectangle(
                    defenseX +
                        DEF_BAR
                            .sidePadding,

                    defenseBarY,

                    this.defenseBarWidth,
                    DEF_BAR.height,

                    DEF_BAR.trackColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

        this.defenseFill =
            this.scene.add
                .rectangle(
                    defenseX +
                        DEF_BAR
                            .sidePadding,

                    defenseBarY,

                    this.defenseBarWidth,
                    DEF_BAR.height,

                    DEF_BAR.fillColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

        this.missileThreatsView =
            new BridgeCaptainMissileThreatsView(
                this.scene,
                this.eventBus,

                innerWidth,
                THREATS_HEIGHT,
            );

        this.missileThreatsView
            .setPosition(
                PANEL.padding,

                PANEL.padding +
                    STATUS_HEIGHT +
                    PANEL.sectionGap,
            );

        this.root.add([
            this.background,
            this.hullText,
            this.defenseText,
            this.defenseTrack,
            this.defenseFill,
            this.missileThreatsView
                .getRoot(),
        ]);

        this.eventBus.on(
            BRIDGE_EVENT
                .CAPTAIN_COMBAT_CONTEXT_UPDATED,

            this.handleContextUpdated,
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
                .CAPTAIN_COMBAT_CONTEXT_UPDATED,

            this.handleContextUpdated,
            this,
        );

        this.missileThreatsView
            .destroy();

        this.root.destroy(true);
    }

    private createStatusCell(
        x: number,
        y: number,
        width: number,
        height: number,
    ): void {
        const cell =
            this.scene.add
                .rectangle(
                    x,
                    y,

                    width,
                    height,

                    STATUS_CELL
                        .backgroundColor,

                    STATUS_CELL
                        .backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    STATUS_CELL
                        .borderThickness,

                    STATUS_CELL
                        .borderColor,
                );

        this.root.add(
            cell,
        );
    }

    private createStatusText(
        x: number,
        y: number,
        text: string,
    ): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                x,
                y,

                FONT_FAMILY.VGA_8X14,
                text,
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(
                FONT_COLOR.PRIMARY,
            );
    }

    private handleContextUpdated(
        payload:
            BridgeCaptainCombatContextUpdatedPayload,
    ): void {
        this.updateEnemyStatus(
            payload.enemyShip,
        );

        this.missileThreatsView
            .update(
                payload.incomingMissiles,
            );
    }

    private updateEnemyStatus(
        enemyShip:
            BridgeCaptainCombatContextUpdatedPayload[
                'enemyShip'
            ],
    ): void {
        if (!enemyShip) {
            this.hullText.setText(
                'HULL --/--',
            );

            this.defenseText.setText(
                'DEF --/--',
            );

            this.defenseTrack
                .setVisible(false);

            this.defenseFill
                .setVisible(false);

            return;
        }

        this.hullText.setText(
            'HULL ' +
                enemyShip.hull.current +
                '/' +
                enemyShip.hull.max,
        );

        const defense =
            enemyShip.defenseCapacitor;

        if (!defense) {
            this.defenseText.setText(
                'DEF --/--',
            );

            this.defenseTrack
                .setVisible(false);

            this.defenseFill
                .setVisible(false);

            return;
        }

        this.defenseText.setText(
            'DEF ' +
                defense.current +
                '/' +
                defense.max,
        );

        const progress =
            defense.rechargeProgress;

        const isRecharging =
            progress !== undefined;

        this.defenseTrack
            .setVisible(
                isRecharging,
            );

        this.defenseFill
            .setVisible(
                isRecharging,
            )
            .setScale(
                isRecharging
                    ? progress
                    : 0,
                1,
            );
    }
}
