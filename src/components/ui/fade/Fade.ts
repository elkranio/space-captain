import { DEFAULT_FADE_CONFIG, FadeConfig } from "./fadeConfig";

/**
 * A full-screen fade overlay that animates in and out using alpha tweens.
 * Can be used for scene transitions, modal overlays, or dramatic effects.
 */
export default class Fade extends Phaser.GameObjects.Rectangle {
    private config: FadeConfig;

    /**
     * Creates a new Fade instance.
     * @param scene - The scene this fade belongs to.
     * @param config - Optional config to override default color, alpha, and durations.
     */
    constructor(scene: Phaser.Scene, config: Partial<FadeConfig> = {}) {
        const merged: FadeConfig = { ...DEFAULT_FADE_CONFIG, ...config };
        super(scene, 0, 0, scene.scale.width, scene.scale.height, merged.color, merged.alpha);

        this.setOrigin(0);
        this.setAlpha(0);
        this.setScrollFactor(0);
        this.setInteractive();

        this.config = merged;
    }

    /**
     * Fades the overlay in to the configured alpha.
     * @returns Promise that resolves when the fade-in is complete.
     */
    show(): Promise<void> {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                alpha: this.config.alpha,
                duration: this.config.showDuration,
                onComplete: () => resolve(),
            });
        });
    }

    /**
     * Fades the overlay out to full transparency.
     * @returns Promise that resolves when the fade-out is complete.
     */
    hide(): Promise<void> {
        return new Promise((resolve) => {
            this.scene.tweens.add({
                targets: this,
                alpha: 0,
                duration: this.config.hideDuration,
                onComplete: () => resolve(),
            });
        });
    }
}
