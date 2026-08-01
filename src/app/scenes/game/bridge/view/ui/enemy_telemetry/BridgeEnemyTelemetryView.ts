// src/app/scenes/game/bridge/view/ui/enemy_telemetry/BridgeEnemyTelemetryView.ts

import {
    SHIP_DRIVE_STATUS,
    type ShipDriveStatus,
} from '../../../../../../../engine/defs/ship_drive';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponKind,
    type ShipWeaponPhase,
} from '../../../../../../../engine/defs/ship_weapon';
import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipTelemetryUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

const ENEMY_TELEMETRY_PANEL = {
    y: 548,

    width: 600,
    height: 64,

    backgroundColor: 0x10131d,
    backgroundAlpha: 0.86,

    borderColor: 0x58677a,
    borderThickness: 2,
} as const;

const SYSTEMS_POSITION =
    new Phaser.Math.Vector2(12, 8);

const WEAPONS_POSITION =
    new Phaser.Math.Vector2(12, 36);

// Временная telemetry panel над captain desk.
//
// Это намеренно один простой view:
// финальная физическая dashboard-композиция
// будет сделана вместе с финальным bridge art.
export default class BridgeEnemyTelemetryView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly background:
        Phaser.GameObjects.Rectangle;

    private readonly systemsLabel:
        Phaser.GameObjects.BitmapText;

    private readonly weaponsLabel:
        Phaser.GameObjects.BitmapText;

    constructor(
        scene: BridgeScene,

        private readonly eventBus:
            BridgeEventBus,
    ) {
        this.root = scene.add.container(
            scene.cameras.main.centerX -
                ENEMY_TELEMETRY_PANEL.width / 2,

            ENEMY_TELEMETRY_PANEL.y,
        );

        scene.layers.get('ui').add(this.root);

        this.background = scene.add
            .rectangle(
                0,
                0,

                ENEMY_TELEMETRY_PANEL.width,
                ENEMY_TELEMETRY_PANEL.height,

                ENEMY_TELEMETRY_PANEL
                    .backgroundColor,

                ENEMY_TELEMETRY_PANEL
                    .backgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                ENEMY_TELEMETRY_PANEL
                    .borderThickness,

                ENEMY_TELEMETRY_PANEL
                    .borderColor,
            );

        this.systemsLabel =
            scene.add.bitmapText(
                SYSTEMS_POSITION.x,
                SYSTEMS_POSITION.y,

                FONT_FAMILY.VGA_8X14,
                '',

                FONT_SIZE.PX_16,
            );

        this.systemsLabel
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        this.weaponsLabel =
            scene.add.bitmapText(
                WEAPONS_POSITION.x,
                WEAPONS_POSITION.y,

                FONT_FAMILY.VGA_8X14,
                '',

                FONT_SIZE.PX_16,
            );

        this.weaponsLabel
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.SECONDARY);

        this.root.add([
            this.background,
            this.systemsLabel,
            this.weaponsLabel,
        ]);

        this.root.setVisible(false);

        this.eventBus.on(
            BRIDGE_EVENT
                .ENEMY_SHIP_TELEMETRY_UPDATED,

            this.handleTelemetryUpdated,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .ENEMY_SHIP_TELEMETRY_UPDATED,

            this.handleTelemetryUpdated,
            this,
        );

        this.root.destroy(true);
    }

    private handleTelemetryUpdated(
        payload:
            BridgeEnemyShipTelemetryUpdatedPayload,
    ): void {
        if (!payload) {
            this.root.setVisible(false);
            return;
        }

        this.systemsLabel.setText(
            `TARGET  ` +
                `HULL ${payload.hull.current}/${payload.hull.max}  ` +
                `SHD ${payload.shieldGenerator.current}/${payload.shieldGenerator.max}  ` +
                `ENG ${this.getDriveLabel(payload.drive.status)}`,
        );

        this.weaponsLabel.setText(
            payload.weapons.length > 0
                ? payload.weapons
                      .map((weapon) => {
                          return (
                              `${this.getWeaponKindLabel(weapon.kind)} ` +
                              `${this.getWeaponPhaseLabel(weapon.phase)}`
                          );
                      })
                      .join('   ')
                : 'WPN NONE',
        );

        this.root.setVisible(true);
    }

    private getDriveLabel(
        status: ShipDriveStatus,
    ): string {
        switch (status) {
            case SHIP_DRIVE_STATUS.ONLINE:
                return 'ON';

            case SHIP_DRIVE_STATUS.DISABLED:
                return 'OFF';

            default:
                return assertNever(status);
        }
    }

    private getWeaponKindLabel(
        kind: ShipWeaponKind,
    ): string {
        switch (kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return 'MSL';

            case SHIP_WEAPON_KIND.LASER:
                return 'LSR';

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return 'MIN';

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return 'EW';

            default:
                return assertNever(kind);
        }
    }

    private getWeaponPhaseLabel(
        phase: ShipWeaponPhase,
    ): string {
        switch (phase) {
            case SHIP_WEAPON_PHASE.READY:
                return 'RDY';

            case SHIP_WEAPON_PHASE.TARGETING:
                return 'AIM';

            case SHIP_WEAPON_PHASE.CHARGING:
                return 'CHG';

            case SHIP_WEAPON_PHASE.CHANNELING:
                return 'ACT';

            case SHIP_WEAPON_PHASE.DISPENSING:
                return 'BURST';

            case SHIP_WEAPON_PHASE.COOLDOWN:
                return 'CD';

            default:
                return assertNever(phase);
        }
    }
}

function assertNever(value: never): never {
    throw new Error(
        `Unhandled enemy telemetry value: ${String(value)}`,
    );
}
