// src/app/scenes/game/bridge/view/ui/ship_status/weapons/BridgePlayerWeaponsStatusView.ts

import {
    SHIP_WEAPON_PHASE,
} from '../../../../../../../../engine/defs/ship_weapon';
import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import type {
    BridgePlayerWeaponStatusPayload,
    BridgePlayerWeaponsStatusUpdatedPayload,
} from '../../../../events/bridge_event';

const MISSILE_STATUS_X = 160;

// Временная строка состояния player weapons.
//
// Показывает только необходимое для V0:
// - готовность laser;
// - targeting / charging / cooldown;
// - количество ракет;
// - готовность missile launcher.
export default class BridgePlayerWeaponsStatusView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly laserLabel:
        Phaser.GameObjects.BitmapText;

    private readonly missileLabel:
        Phaser.GameObjects.BitmapText;

    constructor(scene: BridgeScene) {
        this.root =
            scene.add.container(
                0,
                0,
            );

        this.laserLabel =
            this.createLabel(
                scene,
                0,
            );

        this.missileLabel =
            this.createLabel(
                scene,
                MISSILE_STATUS_X,
            );

        this.root.add([
            this.laserLabel,
            this.missileLabel,
        ]);
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

    public setState(
        payload:
            BridgePlayerWeaponsStatusUpdatedPayload,
    ): void {
        this.laserLabel
            .setText(
                this.formatLaser(
                    payload.laser,
                ),
            )
            .setTint(
                this.getStatusTint(
                    payload.laser,
                ),
            );

        this.missileLabel
            .setText(
                this.formatMissileLauncher(
                    payload
                        .missileLauncher,
                ),
            )
            .setTint(
                this.getStatusTint(
                    payload
                        .missileLauncher,

                    payload
                        .missileLauncher
                        ?.ammo.current ===
                        0,
                ),
            );
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private createLabel(
        scene: BridgeScene,
        x: number,
    ): Phaser.GameObjects.BitmapText {
        return scene.add
            .bitmapText(
                x,
                0,

                FONT_FAMILY.VGA_8X14,
                '',
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(
                FONT_COLOR.PRIMARY,
            );
    }

    private formatLaser(
        status:
            BridgePlayerWeaponStatusPayload
            | undefined,
    ): string {
        if (!status) {
            return 'LASER --';
        }

        return (
            'LASER ' +
            this.formatPhase(
                status,
            )
        );
    }

    private formatMissileLauncher(
        status:
            BridgePlayerWeaponsStatusUpdatedPayload[
                'missileLauncher'
            ],
    ): string {
        if (!status) {
            return 'MISSILE --';
        }

        const ammo =
            String(
                status.ammo.current,
            ) +
            '/' +
            String(
                status.ammo.max,
            );

        if (
            status.phase ===
                SHIP_WEAPON_PHASE.READY &&
            status.ammo.current === 0
        ) {
            return (
                'MISSILE ' +
                ammo +
                ' EMPTY'
            );
        }

        return (
            'MISSILE ' +
            ammo +
            ' ' +
            this.formatPhase(
                status,
            )
        );
    }

    private formatPhase(
        status:
            BridgePlayerWeaponStatusPayload,
    ): string {
        switch (status.phase) {
            case SHIP_WEAPON_PHASE.READY:
                return 'READY';

            case SHIP_WEAPON_PHASE
                .TARGETING:
                return this.formatTimedStatus(
                    'AIM',
                    status,
                );

            case SHIP_WEAPON_PHASE
                .CHARGING:
                return this.formatTimedStatus(
                    'CHG',
                    status,
                );

            case SHIP_WEAPON_PHASE
                .COOLDOWN:
                return this.formatTimedStatus(
                    'CD',
                    status,
                );

            case SHIP_WEAPON_PHASE
                .CHANNELING:
                return this.formatTimedStatus(
                    'CHN',
                    status,
                );

            case SHIP_WEAPON_PHASE
                .DISPENSING:
                return this.formatTimedStatus(
                    'DSP',
                    status,
                );
        }
    }

    private formatTimedStatus(
        label: string,
        status:
            BridgePlayerWeaponStatusPayload,
    ): string {
        if (
            status.remainingPhaseMs ===
            undefined
        ) {
            return label;
        }

        return (
            label +
            ' ' +
            this.formatRemainingTime(
                status.remainingPhaseMs,
            )
        );
    }

    private formatRemainingTime(
        remainingMs: number,
    ): string {
        const remainingTenths =
            Math.max(
                0,
                Math.ceil(
                    remainingMs /
                        100,
                ),
            );

        const seconds =
            Math.floor(
                remainingTenths /
                    10,
            );

        const tenth =
            remainingTenths %
            10;

        return (
            String(seconds)
                .padStart(
                    2,
                    '0',
                ) +
            '.' +
            String(tenth)
        );
    }

    private getStatusTint(
        status:
            BridgePlayerWeaponStatusPayload
            | undefined,

        empty = false,
    ): number {
        if (!status) {
            return FONT_COLOR.SECONDARY;
        }

        if (
            empty &&
            status.phase ===
                SHIP_WEAPON_PHASE.READY
        ) {
            return FONT_COLOR.DANGER;
        }

        if (
            status.phase ===
            SHIP_WEAPON_PHASE.READY
        ) {
            return FONT_COLOR.PRIMARY;
        }

        return FONT_COLOR.ACTIVITY;
    }
}
