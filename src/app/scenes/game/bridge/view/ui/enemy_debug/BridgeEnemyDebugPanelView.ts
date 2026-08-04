// src/app/scenes/game/bridge/view/ui/enemy_debug/BridgeEnemyDebugPanelView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT, type BridgeEnemyDebugUpdatedPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { ENEMY_TELEMETRY_PANEL } from '../enemy_telemetry/BridgeEnemyTelemetryView';
import { formatEnemyDebugPanel } from './format_enemy_debug_panel';

const ENEMY_DEBUG_PANEL = {
    gapFromTelemetry: 6,

    height: 122,

    backgroundColor: 0x0b0d14,
    backgroundAlpha: 0.92,

    borderColor: 0x58677a,
    borderThickness: 2,

    leftX: 12,
    rightX: 300,

    headerY: 6,
    bodyY: 22,

    systemsHeaderY: 84,
    systemsBodyY: 100,
} as const;

// Dev-only bitmap-text X-ray under enemy telemetry.
//
// This is intentionally dense and utilitarian.
// It is a behavior debugging tool, not player-facing UI.
export default class BridgeEnemyDebugPanelView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly crewLabel: Phaser.GameObjects.BitmapText;

    private readonly systemsLabel: Phaser.GameObjects.BitmapText;

    private readonly threatsLabel: Phaser.GameObjects.BitmapText;

    constructor(
        scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = scene.add.container(
            scene.cameras.main.centerX - ENEMY_TELEMETRY_PANEL.width / 2,

            ENEMY_TELEMETRY_PANEL.y + ENEMY_TELEMETRY_PANEL.height + ENEMY_DEBUG_PANEL.gapFromTelemetry,
        );

        scene.layers.get('ui').add(this.root);

        const background = scene.add
            .rectangle(
                0,
                0,

                ENEMY_TELEMETRY_PANEL.width,

                ENEMY_DEBUG_PANEL.height,

                ENEMY_DEBUG_PANEL.backgroundColor,

                ENEMY_DEBUG_PANEL.backgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                ENEMY_DEBUG_PANEL.borderThickness,

                ENEMY_DEBUG_PANEL.borderColor,
            );

        const crewHeader = this.createLabel(
            scene,

            ENEMY_DEBUG_PANEL.leftX,
            ENEMY_DEBUG_PANEL.headerY,

            'CREW',
            FONT_COLOR.ACTIVITY,
        );

        this.crewLabel = this.createLabel(
            scene,

            ENEMY_DEBUG_PANEL.leftX,
            ENEMY_DEBUG_PANEL.bodyY,

            '',
            FONT_COLOR.PRIMARY,
        );

        const systemsHeader = this.createLabel(
            scene,

            ENEMY_DEBUG_PANEL.leftX,
            ENEMY_DEBUG_PANEL.systemsHeaderY,

            'SYSTEMS',
            FONT_COLOR.ACTIVITY,
        );

        this.systemsLabel = this.createLabel(
            scene,

            ENEMY_DEBUG_PANEL.leftX,
            ENEMY_DEBUG_PANEL.systemsBodyY,

            '',
            FONT_COLOR.SECONDARY,
        );

        const threatsHeader = this.createLabel(
            scene,

            ENEMY_DEBUG_PANEL.rightX,
            ENEMY_DEBUG_PANEL.headerY,

            'THREATS',
            FONT_COLOR.ACTIVITY,
        );

        this.threatsLabel = this.createLabel(
            scene,

            ENEMY_DEBUG_PANEL.rightX,
            ENEMY_DEBUG_PANEL.bodyY,

            '',
            FONT_COLOR.SECONDARY,
        );

        this.root.add([
            background,

            crewHeader,
            this.crewLabel,

            systemsHeader,
            this.systemsLabel,

            threatsHeader,
            this.threatsLabel,
        ]);

        this.root.setVisible(false);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_DEBUG_UPDATED,

            this.handleUpdated,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_DEBUG_UPDATED,

            this.handleUpdated,
            this,
        );

        this.root.destroy(true);
    }

    private handleUpdated(payload: BridgeEnemyDebugUpdatedPayload): void {
        if (!payload) {
            this.root.setVisible(false);
            return;
        }

        const text = formatEnemyDebugPanel(payload);

        this.crewLabel.setText(text.crew);

        this.systemsLabel.setText(text.systems);

        this.threatsLabel.setText(text.threats);

        this.root.setVisible(true);
    }

    private createLabel(
        scene: BridgeScene,

        x: number,
        y: number,

        text: string,
        tint: number,
    ): Phaser.GameObjects.BitmapText {
        return scene.add
            .bitmapText(
                x,
                y,

                FONT_FAMILY.VGA_8X14,
                text,

                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(tint);
    }
}
