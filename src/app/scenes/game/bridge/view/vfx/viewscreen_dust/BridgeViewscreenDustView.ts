// src/app/scenes/game/bridge/view/vfx/viewscreen_dust/BridgeViewscreenDustView.ts

import type BridgeScene from "../../../BridgeScene";
import { BRIDGE_VIEWSCREEN_RECT } from "../../bridge_viewscreen_layout";

const DUST_PARTICLE_COUNT = 42;
const DUST_TICK_MS = 45;
const DUST_COLOR = 0xc8d8ff;

type ViewscreenDustParticle = {
    view: Phaser.GameObjects.Rectangle;
    angle: number;
    distance: number;
    speed: number;
};

// View эффекта dust/speed particles поверх bridge viewscreen.
// Эффект не привязан к конкретному flow: его можно запускать для arrival, approach или jump visuals.
export default class BridgeViewscreenDustView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly particles: ViewscreenDustParticle[] = [];

    private timer?: Phaser.Time.TimerEvent;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.root.setVisible(false);

        parent.add(this.root);

        this.createParticles();
    }

    public start(): void {
        this.stop();

        this.root.setVisible(true);

        for (const particle of this.particles) {
            this.resetParticle(particle, true);
        }

        this.timer = this.scene.time.addEvent({
            delay: DUST_TICK_MS,
            loop: true,
            callback: this.updateParticles,
            callbackScope: this,
        });
    }

    public stop(): void {
        this.timer?.remove(false);
        this.timer = undefined;

        this.root.setVisible(false);
    }

    public destroy(): void {
        this.stop();
        this.root.destroy(true);
    }

    private createParticles(): void {
        for (let index = 0; index < DUST_PARTICLE_COUNT; index += 1) {
            const size = Phaser.Math.Between(1, 3);

            const view = this.scene.add.rectangle(0, 0, size, size, DUST_COLOR, 0.75).setOrigin(0.5, 0.5);

            this.root.add(view);

            const particle = {
                view,
                angle: 0,
                distance: 0,
                speed: 0,
            };

            this.resetParticle(particle, true);
            this.particles.push(particle);
        }
    }

    private updateParticles(): void {
        const centerX = BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width * 0.5;
        const centerY = BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height * 0.5;
        const maxDistance = BRIDGE_VIEWSCREEN_RECT.width * 0.58;

        for (const particle of this.particles) {
            particle.distance += particle.speed;

            if (particle.distance > maxDistance) {
                this.resetParticle(particle, false);
            }

            const progress = particle.distance / maxDistance;

            particle.view.setPosition(
                Math.round(centerX + Math.cos(particle.angle) * particle.distance),
                Math.round(centerY + Math.sin(particle.angle) * particle.distance * 0.42),
            );

            particle.view.setAlpha(0.2 + progress * 0.75);
        }
    }

    private resetParticle(particle: ViewscreenDustParticle, scattered: boolean): void {
        particle.angle = Math.random() * Math.PI * 2;
        particle.distance = scattered ? Math.random() * BRIDGE_VIEWSCREEN_RECT.width * 0.45 : 0;
        particle.speed = Phaser.Math.Between(8, 18);

        particle.view.setAlpha(0);
    }
}
