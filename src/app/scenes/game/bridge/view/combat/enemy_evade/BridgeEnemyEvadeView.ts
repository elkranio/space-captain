// src/app/scenes/game/bridge/view/combat/enemy_evade/BridgeEnemyEvadeView.ts

import { SHIP_EVADE_PHASE, type ShipEvadePhase } from "../../../../../../../engine/defs/ship_evade";
import type BridgeScene from "../../../BridgeScene";
import { BRIDGE_EVENT, type BridgeEnemyEvadesUpdatedPayload } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import { BRIDGE_ENEMY_EVADE_PRESENTATION } from "./bridge_enemy_evade_presentation";

type EnemyEvadePresentationState = {
    actorId: string;

    phase: ShipEvadePhase;

    phaseElapsedMs: number;

    evadeDurationMs: number;

    direction: -1 | 1;

    hasChosenDirection: boolean;

    accumulatedOffsetX: number;

    activeStartOffsetX: number;

    spawnAccumulator: number;
};

type ThrusterParticle = {
    x: number;
    y: number;

    velocityX: number;
    velocityY: number;

    lifeMs: number;
    maxLifeMs: number;

    lengthPx: number;
    color: number;

    strength: number;
};

type GetObjectVisualBounds = (objectId: string) => Phaser.Geom.Rectangle | undefined;

type SetObjectPresentationOffsetX = (objectId: string, offsetX: number) => boolean;

// Enemy Evade presentation.
//
// Engine/read-model owns all phase/timing truth. This view only:
// - chooses a visual left/right maneuver direction per activation;
// - alternates that direction on later activations;
// - maps authoritative EVADING progress to a small accumulated render offset;
// - renders the accepted maneuver-thruster particles.
//
// The object presentation offset is deliberately excluded from canonical
// BridgeSpaceView object positions. Player weapon presentation therefore keeps
// aiming at the nominal ship position and can visibly miss the maneuvering hull.
export default class BridgeEnemyEvadeView {
    private readonly states = new Map<string, EnemyEvadePresentationState>();

    private readonly particles: ThrusterParticle[] = [];

    private readonly graphics: Phaser.GameObjects.Graphics;

    constructor(
        private readonly scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,

        private readonly getObjectVisualBounds: GetObjectVisualBounds,

        private readonly setObjectPresentationOffsetX: SetObjectPresentationOffsetX,
    ) {
        this.graphics = this.scene.add.graphics();

        this.scene.layers.get("vfx").add(this.graphics);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_EVADES_UPDATED,

            this.handleEvadesUpdated,
            this,
        );

        this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.ENEMY_EVADES_UPDATED,

            this.handleEvadesUpdated,
            this,
        );

        this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);

        for (const state of this.states.values()) {
            this.setObjectPresentationOffsetX(state.actorId, 0);
        }

        this.states.clear();

        this.particles.length = 0;

        this.graphics.destroy();
    }

    private handleEvadesUpdated(payload: BridgeEnemyEvadesUpdatedPayload): void {
        const receivedActorIds = new Set<string>();

        for (const snapshot of payload) {
            receivedActorIds.add(snapshot.actorId);

            const state = this.getOrCreateState(snapshot);

            const previousPhase = state.phase;

            const wasManeuvering = isManeuverPhase(previousPhase);

            const isManeuvering = isManeuverPhase(snapshot.phase);

            if (!wasManeuvering && isManeuvering) {
                this.beginManeuver(state);
            }

            if (previousPhase === SHIP_EVADE_PHASE.WARMUP && snapshot.phase === SHIP_EVADE_PHASE.EVADING) {
                state.activeStartOffsetX = state.accumulatedOffsetX;

                state.spawnAccumulator = 0;
            }

            state.phase = snapshot.phase;

            state.phaseElapsedMs = Math.max(0, snapshot.phaseElapsedMs);

            state.evadeDurationMs = Math.max(1, snapshot.evadeDurationMs);

            if (state.phase === SHIP_EVADE_PHASE.EVADING) {
                this.updateActiveOffset(state);
            }

            if (!isManeuvering) {
                state.spawnAccumulator = 0;
            }

            this.setObjectPresentationOffsetX(state.actorId, state.accumulatedOffsetX);
        }

        for (const [actorId] of this.states) {
            if (receivedActorIds.has(actorId)) {
                continue;
            }

            this.setObjectPresentationOffsetX(actorId, 0);

            this.states.delete(actorId);
        }
    }

    private handleSceneUpdate(_time: number, deltaMs: number): void {
        const safeDeltaMs = Math.max(0, deltaMs);

        for (const state of this.states.values()) {
            this.spawnThrusterParticles(state, safeDeltaMs);
        }

        this.updateParticles(safeDeltaMs);

        this.renderParticles();
    }

    private getOrCreateState(snapshot: BridgeEnemyEvadesUpdatedPayload[number]): EnemyEvadePresentationState {
        const existing = this.states.get(snapshot.actorId);

        if (existing) {
            return existing;
        }

        const state: EnemyEvadePresentationState = {
            actorId: snapshot.actorId,

            phase: SHIP_EVADE_PHASE.READY,

            phaseElapsedMs: 0,

            evadeDurationMs: Math.max(1, snapshot.evadeDurationMs),

            direction: 1,

            hasChosenDirection: false,

            accumulatedOffsetX: 0,

            activeStartOffsetX: 0,

            spawnAccumulator: 0,
        };

        this.states.set(state.actorId, state);

        return state;
    }

    private beginManeuver(state: EnemyEvadePresentationState): void {
        if (!state.hasChosenDirection) {
            state.direction = Math.random() < 0.5 ? -1 : 1;

            state.hasChosenDirection = true;
        } else {
            state.direction = -state.direction as -1 | 1;
        }

        state.activeStartOffsetX = state.accumulatedOffsetX;

        state.spawnAccumulator = 0;
    }

    private updateActiveOffset(state: EnemyEvadePresentationState): void {
        const progress = Phaser.Math.Clamp(state.phaseElapsedMs / state.evadeDurationMs, 0, 1);

        const movement = BRIDGE_ENEMY_EVADE_PRESENTATION.movement;

        const targetOffset =
            state.activeStartOffsetX + state.direction * movement.distancePerFullEvadePx * smoothStep(progress);

        state.accumulatedOffsetX = Phaser.Math.Clamp(
            targetOffset,
            -movement.maxAccumulatedOffsetPx,
            movement.maxAccumulatedOffsetPx,
        );
    }

    private spawnThrusterParticles(
        state: EnemyEvadePresentationState,

        deltaMs: number,
    ): void {
        const strength = this.getThrusterStrength(state.phase);

        if (strength <= 0) {
            return;
        }

        const bounds = this.getObjectVisualBounds(state.actorId);

        if (!bounds) {
            return;
        }

        const config = BRIDGE_ENEMY_EVADE_PRESENTATION.thrusters;

        state.spawnAccumulator += (deltaMs / 1000) * config.activeSpawnPerSecond * strength;

        while (state.spawnAccumulator >= 1) {
            state.spawnAccumulator -= 1;

            this.spawnParticlePair(bounds, state.direction, strength);
        }
    }

    private getThrusterStrength(phase: ShipEvadePhase): number {
        const config = BRIDGE_ENEMY_EVADE_PRESENTATION.thrusters;

        switch (phase) {
            case SHIP_EVADE_PHASE.WARMUP:
                return config.warmupStrength;

            case SHIP_EVADE_PHASE.EVADING:
                return config.activeStrength;

            case SHIP_EVADE_PHASE.READY:
            case SHIP_EVADE_PHASE.COOLDOWN:
                return 0;

            default: {
                const exhaustivePhase: never = phase;

                return exhaustivePhase;
            }
        }
    }

    private spawnParticlePair(
        bounds: Phaser.Geom.Rectangle,

        direction: -1 | 1,

        strength: number,
    ): void {
        // To move right, fire the left-side maneuvering thruster.
        // To move left, fire the right-side thruster.
        const emitterX = direction > 0 ? bounds.left : bounds.right;

        const verticalOffset = bounds.height * BRIDGE_ENEMY_EVADE_PRESENTATION.thrusters.emitterVerticalOffsetRatio;

        this.spawnParticle(emitterX, bounds.centerY - verticalOffset, direction, strength);

        this.spawnParticle(emitterX, bounds.centerY + verticalOffset, direction, strength);
    }

    private spawnParticle(
        emitterX: number,
        emitterY: number,

        direction: -1 | 1,

        strength: number,
    ): void {
        const config = BRIDGE_ENEMY_EVADE_PRESENTATION.thrusters;

        const speed =
            Phaser.Math.FloatBetween(config.minSpeedPxPerSecond, config.maxSpeedPxPerSecond) *
            Phaser.Math.Linear(0.65, 1, strength);

        const maxLifeMs = Phaser.Math.Between(config.minLifeMs, config.maxLifeMs);

        const colors = config.colors;

        const color = colors[Phaser.Math.Between(0, colors.length - 1)] ?? 0xffffff;

        this.particles.push({
            x: emitterX,

            y: emitterY + Phaser.Math.FloatBetween(-config.yJitterPx, config.yJitterPx),

            // Exhaust travels opposite to the selected lateral maneuver.
            velocityX: -direction * speed,

            velocityY: Phaser.Math.FloatBetween(-15, 15),

            lifeMs: maxLifeMs,

            maxLifeMs,

            lengthPx: Math.max(
                1,
                Math.round(
                    Phaser.Math.Between(config.minLengthPx, config.maxLengthPx) * Phaser.Math.Linear(0.55, 1, strength),
                ),
            ),

            color,
            strength,
        });
    }

    private updateParticles(deltaMs: number): void {
        const deltaSeconds = deltaMs / 1000;

        for (let index = this.particles.length - 1; index >= 0; index -= 1) {
            const particle = this.particles[index];

            if (!particle) {
                continue;
            }

            particle.lifeMs -= deltaMs;

            if (particle.lifeMs <= 0) {
                this.particles.splice(index, 1);

                continue;
            }

            particle.x += particle.velocityX * deltaSeconds;

            particle.y += particle.velocityY * deltaSeconds;
        }
    }

    private renderParticles(): void {
        this.graphics.clear();

        for (const particle of this.particles) {
            const lifeProgress = Phaser.Math.Clamp(particle.lifeMs / particle.maxLifeMs, 0, 1);

            const alpha = smoothStep(lifeProgress) * Phaser.Math.Linear(0.55, 1, particle.strength);

            this.graphics.fillStyle(particle.color, alpha);

            const direction = Math.sign(particle.velocityX);

            const x = direction > 0 ? particle.x : particle.x - particle.lengthPx;

            this.graphics.fillRect(Math.round(x), Math.round(particle.y), particle.lengthPx, 2);
        }
    }
}

function isManeuverPhase(phase: ShipEvadePhase): boolean {
    return phase === SHIP_EVADE_PHASE.WARMUP || phase === SHIP_EVADE_PHASE.EVADING;
}

function smoothStep(value: number): number {
    return value * value * (3 - 2 * value);
}
