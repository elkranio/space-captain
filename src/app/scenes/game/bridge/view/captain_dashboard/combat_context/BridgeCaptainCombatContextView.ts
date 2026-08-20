import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../theme/font";
import type BridgeScene from "../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../captain_dashboard_style";
import {
    BRIDGE_EVENT,
    type BridgeCaptainCombatContextUpdatedPayload,
    type BridgeOfficerCommandSelectedPayload,
} from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgeCaptainShieldTargetingView from "./shield/BridgeCaptainShieldTargetingView";
import BridgeCaptainThreatsView from "./threats/BridgeCaptainThreatsView";

const PANEL = {
    width: 536,
    height: 204,

    padding: 8,
    sectionGap: 6,
} as const;

const STATUS_HEIGHT = 38;

const STATUS_CELL = {
    textPaddingX: 10,
    textY: 8,
} as const;

const DEF_BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,
} as const;

// Правая contextual часть captain dashboard.
//
// Пока она намеренно знает только:
// - HULL/DEF текущего enemy ship;
// - incoming missile rows;
// - incoming beamCannon rows;
// - attached sticky-mine rows;
// - active hostile spam-channel rows.
//
// Другие threat-типы будут добавляться в этот же органичный экран,
// а не отдельными popup/menu системами.
export default class BridgeCaptainCombatContextView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullText: Phaser.GameObjects.BitmapText;

    private readonly defenseText: Phaser.GameObjects.BitmapText;

    private readonly defenseTrack: Phaser.GameObjects.Rectangle;

    private readonly defenseFill: Phaser.GameObjects.Rectangle;

    private readonly threatsView: BridgeCaptainThreatsView;

    private readonly shieldTargetingView: BridgeCaptainShieldTargetingView;

    private latestPayload?: BridgeCaptainCombatContextUpdatedPayload;

    private shieldTargetingOpen = false;

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);

        const innerWidth = PANEL.width - PANEL.padding * 2;

        const cellWidth = innerWidth / 2;

        const hullX = PANEL.padding;

        const defenseX = PANEL.padding + cellWidth;

        this.createStatusCell(hullX, PANEL.padding, cellWidth, STATUS_HEIGHT);

        this.createStatusCell(defenseX, PANEL.padding, cellWidth, STATUS_HEIGHT);

        this.hullText = this.createStatusText(
            hullX + STATUS_CELL.textPaddingX,

            PANEL.padding + STATUS_CELL.textY,

            "HULL --/--",
        );

        this.defenseText = this.createStatusText(
            defenseX + STATUS_CELL.textPaddingX,

            PANEL.padding + STATUS_CELL.textY,

            "DEF --/--",
        );

        const defenseBarWidth = Math.max(1, cellWidth - DEF_BAR.sidePadding * 2);

        const defenseBarY = PANEL.padding + STATUS_HEIGHT - DEF_BAR.bottomPadding - DEF_BAR.height;

        this.defenseTrack = this.scene.add
            .rectangle(
                defenseX + DEF_BAR.sidePadding,

                defenseBarY,

                defenseBarWidth,
                DEF_BAR.height,

                CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.trackColor,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        this.defenseFill = this.scene.add
            .rectangle(
                defenseX + DEF_BAR.sidePadding,

                defenseBarY,

                defenseBarWidth,
                DEF_BAR.height,

                CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.fillColor,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        const contextY = PANEL.padding + STATUS_HEIGHT + PANEL.sectionGap;
        const contextHeight = PANEL.height - contextY - PANEL.padding;

        this.threatsView = new BridgeCaptainThreatsView(
            this.scene,
            this.eventBus,

            innerWidth,

            {
                onOpenShieldTargeting: () => {
                    this.openShieldTargeting();
                },
            },
        );

        this.threatsView.setPosition(PANEL.padding, contextY);

        this.shieldTargetingView = new BridgeCaptainShieldTargetingView(
            this.scene,

            innerWidth,
            contextHeight,

            {
                onSelectTarget: (command) => {
                    this.selectShieldTarget(command);
                },

                onCancel: () => {
                    this.closeShieldTargeting();
                },
            },
        );

        this.shieldTargetingView.setPosition(PANEL.padding, contextY);
        this.shieldTargetingView.setVisible(false);

        this.root.add([
            this.hullText,
            this.defenseText,
            this.defenseTrack,
            this.defenseFill,
            this.threatsView.getRoot(),
            this.shieldTargetingView.getRoot(),
        ]);

        this.eventBus.on(
            BRIDGE_EVENT.CAPTAIN_COMBAT_CONTEXT_UPDATED,

            this.handleContextUpdated,
            this,
        );
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public getSize(): { width: number; height: number } {
        return {
            width: PANEL.width,
            height: PANEL.height,
        };
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.CAPTAIN_COMBAT_CONTEXT_UPDATED,

            this.handleContextUpdated,
            this,
        );

        this.threatsView.destroy();
        this.shieldTargetingView.destroy();

        this.root.destroy(true);
    }

    private createStatusCell(x: number, y: number, width: number, height: number): void {
        const cell = this.scene.add
            .rectangle(
                x,
                y,

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

        this.root.add(cell);
    }

    private createStatusText(x: number, y: number, text: string): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                x,
                y,

                FONT_FAMILY.VGA_8X14,
                text,
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);
    }

    private handleContextUpdated(payload: BridgeCaptainCombatContextUpdatedPayload): void {
        this.latestPayload = payload;

        this.updateEnemyStatus(payload.enemyShip);
        this.threatsView.update(payload);

        if (!this.shieldTargetingOpen) {
            return;
        }

        if (!payload.shieldTargeting || payload.incomingBeamCannons.length === 0) {
            this.closeShieldTargeting();
            return;
        }

        this.shieldTargetingView.update(
            payload.shieldTargeting.targets,
            payload.incomingBeamCannons,
        );
    }

    private openShieldTargeting(): void {
        const payload = this.latestPayload;

        if (!payload?.shieldTargeting || payload.incomingBeamCannons.length === 0) {
            return;
        }

        this.shieldTargetingOpen = true;

        this.threatsView.getRoot().setVisible(false);
        this.shieldTargetingView.setVisible(true);

        this.shieldTargetingView.update(
            payload.shieldTargeting.targets,
            payload.incomingBeamCannons,
        );
    }

    private closeShieldTargeting(): void {
        this.shieldTargetingOpen = false;

        this.shieldTargetingView.setVisible(false);
        this.threatsView.getRoot().setVisible(true);
    }

    private selectShieldTarget(command: BridgeOfficerCommandSelectedPayload): void {
        this.closeShieldTargeting();

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_COMMAND_SELECTED,

            command,
        );
    }

    private updateEnemyStatus(enemyShip: BridgeCaptainCombatContextUpdatedPayload["enemyShip"]): void {
        if (!enemyShip) {
            this.hullText.setText("HULL --/--");

            this.defenseText.setText("DEF --/--");

            this.defenseTrack.setVisible(false);

            this.defenseFill.setVisible(false);

            return;
        }

        this.hullText.setText("HULL " + enemyShip.hull.current + "/" + enemyShip.hull.max);

        const defense = enemyShip.powerCore;

        if (!defense) {
            this.defenseText.setText("DEF --/--");

            this.defenseTrack.setVisible(false);

            this.defenseFill.setVisible(false);

            return;
        }

        this.defenseText.setText("DEF " + defense.current + "/" + defense.max);

        const progress = defense.rechargeProgress;

        const isRecharging = progress !== undefined;

        this.defenseTrack.setVisible(isRecharging);

        this.defenseFill.setVisible(isRecharging).setScale(isRecharging ? progress : 0, 1);
    }
}
