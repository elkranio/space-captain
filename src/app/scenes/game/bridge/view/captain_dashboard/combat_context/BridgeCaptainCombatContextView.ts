// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/BridgeCaptainCombatContextView.ts
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../theme/font";
import type BridgeScene from "../../../BridgeScene";
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
} as const;

const HEADER = {
    textY: 11,

    dividerY: 31,
    dividerHeight: 2,

    contextY: 38,

    statusGap: 8,
    groupGap: 18,
} as const;

const CORE_CHARGE = {
    y: 10,

    width: 8,
    height: 16,
    gap: 3,

    emptyColor: 0x304353,
    fillColor: 0x78bde8,
} as const;

type CoreChargeSlot = {
    track: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
};

// Правая contextual часть captain dashboard.
//
// Пока она намеренно знает только:
// - HULL/CORE текущего enemy ship;
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

    private readonly coreText: Phaser.GameObjects.BitmapText;

    private readonly coreChargeSlots: CoreChargeSlot[] = [];

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

        const titleText = this.createHeaderText(
            PANEL.padding,

            HEADER.textY,

            "THREATS",
        );

        this.hullText = this.createHeaderText(
            0,

            HEADER.textY,

            "HULL --/--",
        );

        this.coreText = this.createHeaderText(
            0,

            HEADER.textY,

            "CORE --",
        );

        const headerDivider = this.scene.add
            .rectangle(
                PANEL.padding,
                HEADER.dividerY,

                innerWidth,
                HEADER.dividerHeight,

                FONT_COLOR.PRIMARY,
                1,
            )
            .setOrigin(0, 0);

        const contextY = HEADER.contextY;
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
            titleText,
            this.hullText,
            this.coreText,
            headerDivider,
            this.threatsView.getRoot(),
            this.shieldTargetingView.getRoot(),
        ]);

        this.layoutHeaderStatus();

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

    private createHeaderText(x: number, y: number, text: string): Phaser.GameObjects.BitmapText {
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

        this.shieldTargetingView.update(payload.shieldTargeting.targets, payload.incomingBeamCannons);
    }

    private openShieldTargeting(): void {
        const payload = this.latestPayload;

        if (!payload?.shieldTargeting || payload.incomingBeamCannons.length === 0) {
            return;
        }

        this.shieldTargetingOpen = true;

        this.threatsView.getRoot().setVisible(false);
        this.shieldTargetingView.setVisible(true);

        this.shieldTargetingView.update(payload.shieldTargeting.targets, payload.incomingBeamCannons);
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
            this.coreText.setText("CORE --");

            this.ensureCoreChargeSlots(0);
            this.layoutHeaderStatus();

            return;
        }

        this.hullText.setText("HULL " + enemyShip.hull.current + "/" + enemyShip.hull.max);

        const core = enemyShip.powerCore;

        if (!core) {
            this.coreText.setText("CORE --");

            this.ensureCoreChargeSlots(0);
            this.layoutHeaderStatus();

            return;
        }

        this.coreText.setText("CORE");

        const maxCharges = Math.max(0, Math.floor(core.max));
        const currentCharges = Math.max(0, Math.min(maxCharges, Math.floor(core.current)));
        const rechargeProgress = Math.max(0, Math.min(1, core.rechargeProgress ?? 0));

        this.ensureCoreChargeSlots(maxCharges);

        this.coreChargeSlots.forEach((slot, index) => {
            if (index < currentCharges) {
                slot.fill.setVisible(true).setScale(1, 1);
                return;
            }

            if (index === currentCharges && currentCharges < maxCharges && rechargeProgress > 0) {
                slot.fill.setVisible(true).setScale(1, rechargeProgress);
                return;
            }

            slot.fill.setVisible(false).setScale(1, 0);
        });

        this.layoutHeaderStatus();
    }

    private ensureCoreChargeSlots(count: number): void {
        while (this.coreChargeSlots.length < count) {
            const track = this.scene.add
                .rectangle(
                    0,
                    CORE_CHARGE.y,

                    CORE_CHARGE.width,
                    CORE_CHARGE.height,

                    CORE_CHARGE.emptyColor,
                    1,
                )
                .setOrigin(0, 0);

            const fill = this.scene.add
                .rectangle(
                    0,
                    CORE_CHARGE.y + CORE_CHARGE.height,

                    CORE_CHARGE.width,
                    CORE_CHARGE.height,

                    CORE_CHARGE.fillColor,
                    1,
                )
                .setOrigin(0, 1)
                .setVisible(false);

            this.root.add([track, fill]);
            this.coreChargeSlots.push({ track, fill });
        }

        while (this.coreChargeSlots.length > count) {
            const slot = this.coreChargeSlots.pop();

            slot?.track.destroy();
            slot?.fill.destroy();
        }
    }

    private layoutHeaderStatus(): void {
        let cursorX = PANEL.width - PANEL.padding;

        if (this.coreChargeSlots.length > 0) {
            const slotsWidth =
                this.coreChargeSlots.length * CORE_CHARGE.width + (this.coreChargeSlots.length - 1) * CORE_CHARGE.gap;
            const slotsX = cursorX - slotsWidth;

            this.coreChargeSlots.forEach((slot, index) => {
                const x = slotsX + index * (CORE_CHARGE.width + CORE_CHARGE.gap);

                slot.track.setPosition(x, CORE_CHARGE.y);
                slot.fill.setPosition(x, CORE_CHARGE.y + CORE_CHARGE.height);
            });

            cursorX = slotsX - HEADER.statusGap;
        }

        this.coreText.setPosition(cursorX - this.coreText.width, HEADER.textY);

        cursorX = this.coreText.x - HEADER.groupGap;

        this.hullText.setPosition(cursorX - this.hullText.width, HEADER.textY);
    }
}
