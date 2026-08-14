// src/app/scenes/game/bridge/view/combat/beam_cannon_threats/beam_cannon/BridgeBeamCannonThreatView.ts

import {
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import BridgeBeamCannonChargeView from '../../beam_cannon_charge/BridgeBeamCannonChargeView';

type BridgeBeamCannonThreatViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    designation: string;

    weaponOrigin:
        Phaser.Math.Vector2;
};

const TARGETING_FRAME = {
    color: 0xea9e3e,

    halfWidth: 46,
    halfHeight: 32,

    cornerLength: 10,
    thickness: 2,

    labelGap: 3,
} as const;

// Enemy beamCannon HUD вокруг общего
// beamCannon charge leaf-view.
export default class BridgeBeamCannonThreatView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly chargeView:
        BridgeBeamCannonChargeView;

    private readonly targetingFrame:
        Phaser.GameObjects.Graphics;

    private readonly statusLabel:
        Phaser.GameObjects.BitmapText;

    private timeToFireMs?: number;

    private initialTimeToFireMs?:
        number;

    constructor({
        scene,
        parent,

        designation,

        weaponOrigin,
    }: BridgeBeamCannonThreatViewOptions) {
        this.root = scene.add.container(
            Math.round(weaponOrigin.x),
            Math.round(weaponOrigin.y),
        );

        parent.add(this.root);

        this.chargeView =
            BridgeBeamCannonChargeView.create({
                scene,
                parent:
                    this.root,
            });

        this.targetingFrame =
            scene.add.graphics();

        this.statusLabel = scene.add
            .bitmapText(
                0,

                TARGETING_FRAME
                        .halfHeight +
                    TARGETING_FRAME
                        .labelGap,

                FONT_FAMILY.VGA_8X14,
                designation,

                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0)
            .setTint(
                TARGETING_FRAME.color,
            );

        this.root.add([
            this.targetingFrame,
            this.statusLabel,
        ]);

        this.drawTargetingFrame();

        this.designation =
            designation;
    }

    private readonly designation:
        string;

    public update(
        timeToFireMs: number,
        initialTimeToFireMs: number,
    ): void {
        if (
            !Number.isFinite(
                initialTimeToFireMs,
            ) ||
            initialTimeToFireMs <= 0
        ) {
            throw new Error(
                'BeamCannon threat initial ' +
                    'time must be positive: ' +
                    initialTimeToFireMs,
            );
        }

        if (
            !Number.isFinite(
                timeToFireMs,
            )
        ) {
            throw new Error(
                'BeamCannon threat remaining ' +
                    'time must be finite: ' +
                    timeToFireMs,
            );
        }

        this.timeToFireMs =
            Phaser.Math.Clamp(
                timeToFireMs,
                0,
                initialTimeToFireMs,
            );

        this.initialTimeToFireMs =
            initialTimeToFireMs;

        this.statusLabel.setText(
            this.formatStatusLabel(),
        );
    }

    public destroy(): void {
        this.chargeView.destroy();
        this.root.destroy(true);
    }

    private drawTargetingFrame():
        void {
        const left =
            -TARGETING_FRAME.halfWidth;

        const right =
            TARGETING_FRAME.halfWidth;

        const top =
            -TARGETING_FRAME.halfHeight;

        const bottom =
            TARGETING_FRAME.halfHeight;

        const length =
            TARGETING_FRAME.cornerLength;

        const thickness =
            TARGETING_FRAME.thickness;

        this.targetingFrame.clear();

        this.targetingFrame.fillStyle(
            TARGETING_FRAME.color,
            1,
        );

        this.drawCorner(
            left,
            top,
            1,
            1,
            length,
            thickness,
        );

        this.drawCorner(
            right,
            top,
            -1,
            1,
            length,
            thickness,
        );

        this.drawCorner(
            left,
            bottom,
            1,
            -1,
            length,
            thickness,
        );

        this.drawCorner(
            right,
            bottom,
            -1,
            -1,
            length,
            thickness,
        );
    }

    private drawCorner(
        x: number,
        y: number,

        xDirection: 1 | -1,
        yDirection: 1 | -1,

        length: number,
        thickness: number,
    ): void {
        const horizontalX =
            xDirection === 1
                ? x
                : x - length;

        const horizontalY =
            yDirection === 1
                ? y
                : y - thickness;

        const verticalX =
            xDirection === 1
                ? x
                : x - thickness;

        const verticalY =
            yDirection === 1
                ? y
                : y - length;

        this.targetingFrame.fillRect(
            horizontalX,
            horizontalY,
            length,
            thickness,
        );

        this.targetingFrame.fillRect(
            verticalX,
            verticalY,
            thickness,
            length,
        );
    }

    private formatStatusLabel():
        string {
        if (
            this.timeToFireMs ===
                undefined ||
            this.initialTimeToFireMs ===
                undefined
        ) {
            return this.designation;
        }

        return (
            this.designation +
            ' ' +
            this.formatTimeToFire(
                this.timeToFireMs,
            )
        );
    }

    private formatTimeToFire(
        timeToFireMs: number,
    ): string {
        const remainingTenths =
            Math.max(
                0,
                Math.ceil(
                    timeToFireMs /
                        100,
                ),
            );

        const seconds =
            Math.floor(
                remainingTenths /
                    10,
            );

        const tenth =
            remainingTenths % 10;

        return (
            String(seconds)
                .padStart(2, '0') +
            ':' +
            String(tenth)
        );
    }
}
