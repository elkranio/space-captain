// src/app/scenes/BaseScene.ts
import LayerManager from "../../system/LayerManager";

/**
 * Generic base scene class with built-in layer support and deferred startup.
 * Extend this when creating a new Phaser scene.
 */
export default abstract class BaseScene<TLayer extends string = "default"> extends Phaser.Scene {
    /** Layer manager instance holding named rendering layers */
    public layers!: LayerManager<TLayer>;

    constructor(key: string) {
        super(key);
    }

    /**
     * Called by Phaser once the scene is created.
     * Waits for one frame before calling `start()`, to avoid weird lifecycle edge cases.
     */
    create(): void {
        this.layers = this.createLayerManager();
        this.time.delayedCall(0, () => this.start());
    }

    /**
     * Override this in your scene to define the actual logic after bootstrapping.
     */
    protected abstract start(): void;

    /**
     * Override this method if you want to define custom layer names.
     * Must return a LayerManager instance with all your layer keys.
     *
     * @returns LayerManager instance
     */
    protected createLayerManager(): LayerManager<TLayer> {
        // If you forget to override this and define layer names, this gives a default one
        return new LayerManager<TLayer>(this, ["default" as TLayer] as readonly TLayer[]);
    }
}
