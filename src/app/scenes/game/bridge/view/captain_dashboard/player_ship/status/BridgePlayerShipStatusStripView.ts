import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import {
    BRIDGE_EVENT,
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgeOfficerCommandSelectedPayload,
    type BridgePlayerShipDashboardUpdatedPayload,
    type BridgePlayerSystemActionState,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";

const CELL = {
    textPaddingX: 10,
    textY: 8,
} as const;

const ENGINE_INTEGRITY = {
    width: 7,
    height: 10,
    gap: 4,
    y: 24,
} as const;

const BAR = {
    sidePadding: 10,
    bottomPadding: 6,
    height: 4,
} as const;

const ACTION = {
    width: 84,
    height: 28,
    marginRight: 6,
    y: 4,
} as const;

const WIDTH_RATIO = {
    hull: 0.25,
    power: 0.35,
    engine: 0.4,
} as const;

// Temporary compact captain dashboard strip:
//
// HULL x/x | PWR x/x | ENGINE [EVADE]
//
// EVADE is a normal engine-resolved officer command. The view never rebuilds
// legality from Power/drive/cooldown/task state.
export default class BridgePlayerShipStatusStripView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullText: Phaser.GameObjects.BitmapText;

    private readonly powerText: Phaser.GameObjects.BitmapText;

    private readonly engineLabel: Phaser.GameObjects.BitmapText;

    private readonly engineIntegrityLeft: Phaser.GameObjects.Rectangle;

    private readonly engineIntegrityRight: Phaser.GameObjects.Rectangle;

    private readonly evadeButton: Phaser.GameObjects.Rectangle;

    private readonly evadeLabel: Phaser.GameObjects.BitmapText;

    private readonly powerTrack: Phaser.GameObjects.Rectangle;

    private readonly powerFill: Phaser.GameObjects.Rectangle;

    private evadeCommand?: BridgeOfficerCommandSelectedPayload;

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const hullWidth = width * WIDTH_RATIO.hull;

        const powerWidth = width * WIDTH_RATIO.power;

        const engineWidth = width - hullWidth - powerWidth;

        const hullX = 0;
        const powerX = hullWidth;
        const engineX = hullWidth + powerWidth;

        this.createCell(hullX, hullWidth, height);

        this.createCell(powerX, powerWidth, height);

        this.createCell(engineX, engineWidth, height);

        this.hullText = this.createText(hullX + CELL.textPaddingX, "HULL --/--");

        this.powerText = this.createText(powerX + CELL.textPaddingX, "PWR --/--");

        const engineContentX = engineX + CELL.textPaddingX;

        this.engineLabel = this.createText(engineContentX, "ENGINE");

        this.engineIntegrityLeft = this.scene.add
            .rectangle(
                engineContentX,
                ENGINE_INTEGRITY.y,
                ENGINE_INTEGRITY.width,
                ENGINE_INTEGRITY.height,
                FONT_COLOR.WHITE,
                0,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, FONT_COLOR.WHITE);

        this.engineIntegrityRight = this.scene.add
            .rectangle(
                engineContentX + ENGINE_INTEGRITY.width + ENGINE_INTEGRITY.gap,
                ENGINE_INTEGRITY.y,
                ENGINE_INTEGRITY.width,
                ENGINE_INTEGRITY.height,
                FONT_COLOR.WHITE,
                0,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, FONT_COLOR.WHITE);

        const evadeButtonX = engineX + engineWidth - ACTION.marginRight - ACTION.width;

        this.evadeButton = this.scene.add
            .rectangle(
                evadeButtonX,
                ACTION.y,

                ACTION.width,
                ACTION.height,

                CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor,
                1,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor);

        this.evadeLabel = this.scene.add
            .bitmapText(
                evadeButtonX + ACTION.width / 2,

                ACTION.y + ACTION.height / 2,

                FONT_FAMILY.VGA_8X14,
                "EVADE",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0.5);

        this.evadeButton.on("pointerdown", this.handleEvadePointerDown, this);

        const powerBarWidth = Math.max(1, powerWidth - BAR.sidePadding * 2);

        const barY = height - BAR.bottomPadding - BAR.height;

        this.powerTrack = this.scene.add
            .rectangle(
                powerX + BAR.sidePadding,
                barY,

                powerBarWidth,
                BAR.height,

                CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.trackColor,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        this.powerFill = this.scene.add
            .rectangle(
                powerX + BAR.sidePadding,
                barY,

                powerBarWidth,
                BAR.height,

                CAPTAIN_DASHBOARD_STYLE.defenseRechargeBar.fillColor,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        this.root.add([
            this.hullText,
            this.powerText,
            this.engineLabel,
            this.engineIntegrityLeft,
            this.engineIntegrityRight,
            this.evadeButton,
            this.evadeLabel,
            this.powerTrack,
            this.powerFill,
        ]);

        this.applyEvadeActionVisualState(BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM);

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,

            this.handleDashboardUpdated,
            this,
        );
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,

            this.handleDashboardUpdated,
            this,
        );

        this.evadeButton.off("pointerdown", this.handleEvadePointerDown, this);

        this.evadeCommand = undefined;

        this.root.destroy(true);
    }

    private createCell(x: number, width: number, height: number): void {
        const background = this.scene.add
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

        this.root.add(background);
    }

    private createText(x: number, text: string): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                x,
                CELL.textY,

                FONT_FAMILY.VGA_8X14,
                text,
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);
    }

    private handleDashboardUpdated(payload: BridgePlayerShipDashboardUpdatedPayload): void {
        const status = payload.status;

        if (!status) {
            return;
        }

        this.hullText.setText("HULL " + status.hull.current + "/" + status.hull.max);

        this.powerText.setText("PWR " + status.powerCore.current + "/" + status.powerCore.max);

        this.engineLabel.setTint(status.drive.integrity === 0 ? FONT_COLOR.DANGER : FONT_COLOR.WHITE);

        this.setEngineIntegrityPip(this.engineIntegrityLeft, status.drive.integrity >= 1);
        this.setEngineIntegrityPip(this.engineIntegrityRight, status.drive.integrity >= 2);

        this.setEvadeAction(status.evadeAction.state, status.evadeAction.command);

        const progress = status.powerCore.rechargeProgress;

        const isRecharging = progress !== undefined;

        this.powerTrack.setVisible(isRecharging);

        this.powerFill.setVisible(isRecharging);

        this.powerFill.setScale(isRecharging ? progress : 0, 1);
    }

    private setEngineIntegrityPip(pip: Phaser.GameObjects.Rectangle, filled: boolean): void {
        pip
            .setFillStyle(FONT_COLOR.WHITE, filled ? 1 : 0)
            .setStrokeStyle(1, FONT_COLOR.WHITE);
    }

    private setEvadeAction(
        state: BridgePlayerSystemActionState,

        command: BridgeOfficerCommandSelectedPayload | undefined,
    ): void {
        if (state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE && !command) {
            throw new Error("Active EVADE dashboard action requires command");
        }

        this.evadeCommand = state === BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE ? command : undefined;

        this.applyEvadeActionVisualState(state);
    }

    private handleEvadePointerDown(): void {
        if (!this.evadeCommand) {
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.evadeCommand);
    }

    private applyEvadeActionVisualState(state: BridgePlayerSystemActionState): void {
        this.evadeButton.disableInteractive();

        switch (state) {
            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ACTIVE:
                this.evadeButton
                    .setFillStyle(CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor, 1)
                    .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor)
                    .setInteractive({
                        useHandCursor: true,
                    });

                this.evadeLabel.setTint(FONT_COLOR.WHITE);

                return;

            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_SYSTEM:
            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE.DISABLED_OFFICER_BUSY:
            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE.ENGAGED_CURRENT_WORK:
                this.evadeButton
                    .setFillStyle(CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor, 1)
                    .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor);

                this.evadeLabel.setTint(CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor);

                return;

            default: {
                const exhaustiveState: never = state;

                return exhaustiveState;
            }
        }
    }
}
