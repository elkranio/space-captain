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

type OutgoingSpamChannelEntry = {
    targetActorId: string;
    phaseOffsetMs: number;
};

const OUTGOING_SPAM_PALETTE = [
    0x53e9ff,
    0xff4cd8,
    0xa4ff4d,
    0xffdf61,
] as const;

const OUTGOING_SPAM_FLICKER = [
    1,
    0.72,
    0.91,
    0.64,
    0.84,
] as const;

const OUTGOING_SPAM_VFX = {
    tintFrameMs: 135,
    flickerFrameMs: 95,

    // Short local projection. We aim toward the hostile ship's presented
    // visual bounds center, but stop far short of it.
    lengthPx: 72,

    outerSourceHalfWidth: 2,
    outerEndHalfWidth: 28,

    coreSourceHalfWidth: 0.75,
    coreEndHalfWidth: 14,

    breathPeriodMs: 520,
    breathAmplitudePx: 1.4,

    sourceGlowRadius: 4.5,
    sourceCoreRadius: 1.5,
} as const;

type GetObjectVisualBounds = (
    objectId: string,
) => Phaser.Geom.Rectangle | undefined;

type ProjectionPoint = {
    x: number;
    y: number;
};

// Procedural outgoing player SPAM projector.
//
// Unlike a physical Beam, the visible signal exists only near the player:
// a short translucent projection cone leaves the ship, changes color in
// discrete VGA-like steps and softly flickers/fades into space.
//
// Target actor identity is retained only so destruction can clear a channel.
// Enemy position / Evade presentation is intentionally irrelevant to geometry.
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

        private readonly getObjectVisualBounds:
            GetObjectVisualBounds,
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
            Math.max(
                0,
                deltaMs,
            );

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
            this.drawProjection(
                source,
                channel.targetActorId,
                channel.phaseOffsetMs,
            );
        }
    }

    private drawProjection(
        source:
            Phaser.Math.Vector2,

        targetActorId:
            string,

        phaseOffsetMs:
            number,
    ): void {
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
            secondaryTint ===
                undefined
        ) {
            throw new Error(
                'Outgoing spam tint palette is empty',
            );
        }

        const flickerIndex =
            Math.floor(
                animationMs /
                    OUTGOING_SPAM_VFX
                        .flickerFrameMs,
            ) %
            OUTGOING_SPAM_FLICKER
                .length;

        const flicker =
            OUTGOING_SPAM_FLICKER[
                flickerIndex
            ];

        if (
            flicker === undefined
        ) {
            throw new Error(
                'Outgoing spam flicker table is empty',
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

        const targetVisualBounds =
            this.getObjectVisualBounds(
                targetActorId,
            );

        if (!targetVisualBounds) {
            return;
        }

        const targetCenter:
            ProjectionPoint = {
                x:
                    targetVisualBounds.centerX,

                y:
                    targetVisualBounds.centerY,
            };

        const fullDx =
            targetCenter.x -
            source.x;

        const fullDy =
            targetCenter.y -
            source.y;

        const fullDistance =
            Math.hypot(
                fullDx,
                fullDy,
            );

        if (
            fullDistance <
            1
        ) {
            return;
        }

        const directionX =
            fullDx /
            fullDistance;

        const directionY =
            fullDy /
            fullDistance;

        const end:
            ProjectionPoint = {
                x:
                    source.x +
                    directionX *
                        OUTGOING_SPAM_VFX
                            .lengthPx,

                y:
                    source.y +
                    directionY *
                        OUTGOING_SPAM_VFX
                            .lengthPx,
            };

        const dx =
            end.x -
            source.x;

        const dy =
            end.y -
            source.y;

        const distance =
            Math.hypot(
                dx,
                dy,
            );

        if (
            distance <
            1
        ) {
            return;
        }

        const normalX =
            -dy /
            distance;

        const normalY =
            dx /
            distance;

        const outerEndHalfWidth =
            OUTGOING_SPAM_VFX
                .outerEndHalfWidth +
            breath *
                OUTGOING_SPAM_VFX
                    .breathAmplitudePx;

        const coreEndHalfWidth =
            OUTGOING_SPAM_VFX
                .coreEndHalfWidth +
            breath *
                OUTGOING_SPAM_VFX
                    .breathAmplitudePx *
                0.45;

        // Three translucent sections fake the soft falloff of a projector
        // without introducing textures/gradients into this temporary VFX.
        this.drawConeBand({
            source,
            end,
            normalX,
            normalY,

            startT: 0,
            endT: 0.44,

            sourceHalfWidth:
                OUTGOING_SPAM_VFX
                    .outerSourceHalfWidth,

            endHalfWidth:
                outerEndHalfWidth,

            tint:
                secondaryTint,

            alpha:
                0.22 *
                flicker,
        });

        this.drawConeBand({
            source,
            end,
            normalX,
            normalY,

            startT: 0.44,
            endT: 0.74,

            sourceHalfWidth:
                OUTGOING_SPAM_VFX
                    .outerSourceHalfWidth,

            endHalfWidth:
                outerEndHalfWidth,

            tint:
                secondaryTint,

            alpha:
                0.14 *
                flicker,
        });

        this.drawConeBand({
            source,
            end,
            normalX,
            normalY,

            startT: 0.74,
            endT: 1,

            sourceHalfWidth:
                OUTGOING_SPAM_VFX
                    .outerSourceHalfWidth,

            endHalfWidth:
                outerEndHalfWidth,

            tint:
                secondaryTint,

            alpha:
                0.065 *
                flicker,
        });

        this.drawConeBand({
            source,
            end,
            normalX,
            normalY,

            startT: 0,
            endT: 0.46,

            sourceHalfWidth:
                OUTGOING_SPAM_VFX
                    .coreSourceHalfWidth,

            endHalfWidth:
                coreEndHalfWidth,

            tint,

            alpha:
                0.52 *
                flicker,
        });

        this.drawConeBand({
            source,
            end,
            normalX,
            normalY,

            startT: 0.46,
            endT: 0.76,

            sourceHalfWidth:
                OUTGOING_SPAM_VFX
                    .coreSourceHalfWidth,

            endHalfWidth:
                coreEndHalfWidth,

            tint,

            alpha:
                0.31 *
                flicker,
        });

        this.drawConeBand({
            source,
            end,
            normalX,
            normalY,

            startT: 0.76,
            endT: 1,

            sourceHalfWidth:
                OUTGOING_SPAM_VFX
                    .coreSourceHalfWidth,

            endHalfWidth:
                coreEndHalfWidth,

            tint,

            alpha:
                0.11 *
                flicker,
        });

        // Tiny source glow reads as the projector lens/emitter.
        this.graphics
            .fillStyle(
                secondaryTint,
                0.28 *
                    flicker,
            )
            .fillCircle(
                source.x,
                source.y,

                OUTGOING_SPAM_VFX
                    .sourceGlowRadius,
            );

        this.graphics
            .fillStyle(
                tint,
                0.9,
            )
            .fillCircle(
                source.x,
                source.y,

                OUTGOING_SPAM_VFX
                    .sourceCoreRadius,
            );
    }

    private drawConeBand({
        source,
        end,
        normalX,
        normalY,
        startT,
        endT,
        sourceHalfWidth,
        endHalfWidth,
        tint,
        alpha,
    }: {
        source:
            ProjectionPoint;

        end:
            ProjectionPoint;

        normalX: number;
        normalY: number;

        startT: number;
        endT: number;

        sourceHalfWidth: number;
        endHalfWidth: number;

        tint: number;
        alpha: number;
    }): void {
        const startCenter =
            this.lerpPoint(
                source,
                end,
                startT,
            );

        const endCenter =
            this.lerpPoint(
                source,
                end,
                endT,
            );

        const startWidth =
            Phaser.Math.Linear(
                sourceHalfWidth,
                endHalfWidth,
                startT,
            );

        const endWidth =
            Phaser.Math.Linear(
                sourceHalfWidth,
                endHalfWidth,
                endT,
            );

        this.graphics
            .fillStyle(
                tint,
                alpha,
            )
            .beginPath()
            .moveTo(
                startCenter.x +
                    normalX *
                        startWidth,

                startCenter.y +
                    normalY *
                        startWidth,
            )
            .lineTo(
                endCenter.x +
                    normalX *
                        endWidth,

                endCenter.y +
                    normalY *
                        endWidth,
            )
            .lineTo(
                endCenter.x -
                    normalX *
                        endWidth,

                endCenter.y -
                    normalY *
                        endWidth,
            )
            .lineTo(
                startCenter.x -
                    normalX *
                        startWidth,

                startCenter.y -
                    normalY *
                        startWidth,
            )
            .closePath()
            .fillPath();
    }

    private lerpPoint(
        start:
            ProjectionPoint,

        end:
            ProjectionPoint,

        progress:
            number,
    ): ProjectionPoint {
        return {
            x:
                Phaser.Math.Linear(
                    start.x,
                    end.x,
                    progress,
                ),

            y:
                Phaser.Math.Linear(
                    start.y,
                    end.y,
                    progress,
                ),
        };
    }
}
