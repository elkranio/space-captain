// src/app/scenes/game/bridge/view/combat/outgoing_spam/BridgeOutgoingSpamView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDestructionPayload,
    type BridgeOutgoingSpamChannelEndedPayload,
    type BridgeOutgoingSpamChannelStartedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import {
    getBridgePlayerWeaponSourcePosition,
} from '../bridge_player_weapon_layout';
import {
    createTaperedBeamPolygon,
    type BeamPoint,
    type TaperedBeamPolygon,
} from './bridge_outgoing_spam_geometry';

type GetObjectPosition = (
    objectId: string,
) => Phaser.Math.Vector2 | undefined;

type OutgoingSpamChannelEntry = {
    targetActorId: string;
    phaseOffsetMs: number;
};

const OUTGOING_SPAM_PALETTE = [
    0x53e9ff,
    0xff4cd8,
    0xa4ff4d,
] as const;

const OUTGOING_SPAM_VFX = {
    tintFrameMs: 120,

    outerSourceHalfWidth: 2,
    outerTargetHalfWidth: 8,

    coreSourceHalfWidth: 0.75,
    coreTargetHalfWidth: 2.75,

    breathPeriodMs: 520,
    breathAmplitude: 1.25,

    impactRadius: 5,
    impactBreathAmplitude: 1.5,
} as const;

// Procedural outgoing player spam beam.
//
// The narrow source and restrained target flare preserve the feeling
// of distance between ships. Tint changes in discrete VGA-like steps,
// while width and target interference breathe continuously.
//
// The hostile popup projection remains owned by BridgeSpamView.
// This view represents only player -> enemy channels.
export default class BridgeOutgoingSpamView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly graphics:
        Phaser.GameObjects.Graphics;

    private readonly channels =
        new Map<
            string,
            OutgoingSpamChannelEntry
        >();

    private elapsedMs = 0;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,

        private readonly getObjectPosition:
            GetObjectPosition,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.graphics =
            this.scene.add.graphics();

        this.root.add(
            this.graphics,
        );

        // Above ships and combat objects, below bridge interior and UI.
        this.scene.layers
            .get('vfx')
            .add(this.root);

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_SPAM_CHANNEL_STARTED,

            this.startChannel,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .OUTGOING_SPAM_CHANNEL_ENDED,

            this.endChannel,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .ENEMY_SHIP_DESTRUCTION_STARTED,

            this.handleEnemyDestruction,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.clear,
            this,
        );

        this.scene.events.on(
            Phaser.Scenes.Events.UPDATE,

            this.handleSceneUpdate,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_SPAM_CHANNEL_STARTED,

            this.startChannel,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .OUTGOING_SPAM_CHANNEL_ENDED,

            this.endChannel,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .ENEMY_SHIP_DESTRUCTION_STARTED,

            this.handleEnemyDestruction,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .ENCOUNTER_TRAVEL_FLIGHT_STARTED,

            this.clear,
            this,
        );

        this.scene.events.off(
            Phaser.Scenes.Events.UPDATE,

            this.handleSceneUpdate,
            this,
        );

        this.channels.clear();

        this.graphics.destroy();
        this.root.destroy(false);
    }

    public setCameraTurnOffsetX(
        offsetX: number,
    ): void {
        this.root.x =
            Math.round(offsetX);
    }

    private startChannel(
        payload:
            BridgeOutgoingSpamChannelStartedPayload,
    ): void {
        if (
            this.channels.has(
                payload.channelId,
            )
        ) {
            throw new Error(
                'Outgoing spam channel ' +
                    'already exists: ' +
                    payload.channelId,
            );
        }

        this.channels.set(
            payload.channelId,
            {
                targetActorId:
                    payload.targetActorId,

                phaseOffsetMs:
                    this.channels.size *
                    71,
            },
        );

        this.redraw();
    }

    private endChannel(
        payload:
            BridgeOutgoingSpamChannelEndedPayload,
    ): void {
        // Enemy destruction/travel may have already cleared presentation.
        this.channels.delete(
            payload.channelId,
        );

        this.redraw();
    }

    private handleEnemyDestruction(
        payload:
            BridgeEnemyShipDestructionPayload,
    ): void {
        for (
            const [
                channelId,
                channel,
            ] of this.channels
        ) {
            if (
                channel.targetActorId !==
                payload.actorId
            ) {
                continue;
            }

            this.channels.delete(
                channelId,
            );
        }

        this.redraw();
    }

    private clear(): void {
        this.channels.clear();

        this.elapsedMs = 0;

        this.graphics.clear();
    }

    private handleSceneUpdate(
        _time: number,
        deltaMs: number,
    ): void {
        if (
            this.channels.size ===
            0
        ) {
            return;
        }

        this.elapsedMs +=
            deltaMs;

        this.redraw();
    }

    private redraw(): void {
        this.graphics.clear();

        if (
            this.channels.size ===
            0
        ) {
            return;
        }

        const source =
            getBridgePlayerWeaponSourcePosition();

        for (
            const channel of
            this.channels.values()
        ) {
            const target =
                this.getObjectPosition(
                    channel.targetActorId,
                );

            if (!target) {
                continue;
            }

            this.drawChannel(
                source,
                target,
                channel.phaseOffsetMs,
            );
        }
    }

    private drawChannel(
        source: Phaser.Math.Vector2,
        target: Phaser.Math.Vector2,
        phaseOffsetMs: number,
    ): void {
        if (
            Phaser.Math.Distance.Between(
                source.x,
                source.y,
                target.x,
                target.y,
            ) <
            1
        ) {
            return;
        }

        const animationMs =
            this.elapsedMs +
            phaseOffsetMs;

        const tintIndex =
            Math.floor(
                animationMs /
                OUTGOING_SPAM_VFX
                    .tintFrameMs,
            ) %
            OUTGOING_SPAM_PALETTE
                .length;

        const tint =
            OUTGOING_SPAM_PALETTE[
                tintIndex
            ];

        const secondaryTint =
            OUTGOING_SPAM_PALETTE[
                (
                    tintIndex +
                    1
                ) %
                OUTGOING_SPAM_PALETTE
                    .length
            ];

        if (
            tint === undefined ||
            secondaryTint === undefined
        ) {
            throw new Error(
                'Outgoing spam tint ' +
                    'palette is empty',
            );
        }

        const breath =
            Math.sin(
                animationMs /
                    OUTGOING_SPAM_VFX
                        .breathPeriodMs *
                    Math.PI *
                    2,
            );

        const targetExpansion =
            breath *
            OUTGOING_SPAM_VFX
                .breathAmplitude;

        const sourcePoint:
            BeamPoint = {
                x: source.x,
                y: source.y,
            };

        const targetPoint:
            BeamPoint = {
                x: target.x,
                y: target.y,
            };

        const outer =
            createTaperedBeamPolygon(
                sourcePoint,
                targetPoint,

                OUTGOING_SPAM_VFX
                    .outerSourceHalfWidth,

                OUTGOING_SPAM_VFX
                    .outerTargetHalfWidth +
                    targetExpansion,
            );

        const core =
            createTaperedBeamPolygon(
                sourcePoint,
                targetPoint,

                OUTGOING_SPAM_VFX
                    .coreSourceHalfWidth,

                OUTGOING_SPAM_VFX
                    .coreTargetHalfWidth +
                    targetExpansion *
                        0.35,
            );

        this.fillPolygon(
            outer,
            secondaryTint,
            0.13,
        );

        this.fillPolygon(
            core,
            tint,
            0.58,
        );

        this.graphics
            .lineStyle(
                1,
                secondaryTint,
                0.32,
            )
            .strokeCircle(
                target.x,
                target.y,

                OUTGOING_SPAM_VFX
                    .impactRadius +
                    breath *
                    OUTGOING_SPAM_VFX
                        .impactBreathAmplitude,
            );

        this.graphics
            .fillStyle(
                tint,
                0.68,
            )
            .fillCircle(
                target.x,
                target.y,
                2,
            );

        this.graphics
            .fillStyle(
                secondaryTint,
                0.4,
            )
            .fillCircle(
                source.x,
                source.y,
                1.5,
            );
    }

    private fillPolygon(
        polygon:
            TaperedBeamPolygon,

        tint: number,
        alpha: number,
    ): void {
        const [
            first,
            ...rest
        ] = polygon;

        this.graphics
            .fillStyle(
                tint,
                alpha,
            )
            .beginPath()
            .moveTo(
                first.x,
                first.y,
            );

        for (const point of rest) {
            this.graphics.lineTo(
                point.x,
                point.y,
            );
        }

        this.graphics
            .closePath()
            .fillPath();
    }
}
