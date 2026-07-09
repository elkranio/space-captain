export default class LayerManager<T extends string> {
    private layers: Map<T, Phaser.GameObjects.Layer> = new Map();

    /**
     * Creates and registers named layers within a scene.
     *
     * @param scene - The Phaser scene to add layers to.
     * @param names - A readonly array of layer names (e.g. ['bg', 'game', 'ui']).
     */
    constructor(scene: Phaser.Scene, names: readonly T[]) {
        for (const name of names) {
            const layer = scene.add.layer();
            this.layers.set(name, layer);
        }
    }

    /**
     * Retrieves a layer by name.
     *
     * @param name - The name of the layer.
     * @returns The corresponding Phaser layer.
     * @throws If the layer doesn't exist.
     */
    get(name: T): Phaser.GameObjects.Layer {
        const layer = this.layers.get(name);
        if (!layer) throw new Error(`Layer ${name} does not exist`);
        return layer;
    }

    /**
     * Sets the visibility of a layer.
     *
     * @param name - The name of the layer.
     * @param visible - Whether the layer should be visible.
     */
    setVisible(name: T, visible: boolean): void {
        this.get(name).setVisible(visible);
    }

    /**
     * Sets the active state of a layer (affects input & updates).
     *
     * @param name - The name of the layer.
     * @param active - Whether the layer should be active.
     */
    setActive(name: T, active: boolean): void {
        this.get(name).setActive(active);
    }

    /**
     * Adds a game object to a specific layer.
     *
     * @param name - The name of the layer.
     * @param gameObject - The game object to add.
     */
    add(name: T, gameObject: Phaser.GameObjects.GameObject): void {
        this.get(name).add(gameObject);
    }

    /**
     * Removes a game object from a specific layer.
     *
     * @param name - The name of the layer.
     * @param gameObject - The game object to remove.
     */
    remove(name: T, gameObject: Phaser.GameObjects.GameObject): void {
        this.get(name).remove(gameObject);
    }

    /**
     * Brings a game object to the top of its layer.
     *
     * @param name - The name of the layer.
     * @param gameObject - The game object to bring to top.
     */
    bringToTop(name: T, gameObject: Phaser.GameObjects.GameObject): void {
        this.get(name).bringToTop(gameObject);
    }

    /**
     * Sends a game object to the bottom of its layer.
     *
     * @param name - The name of the layer.
     * @param gameObject - The game object to send to back.
     */
    sendToBack(name: T, gameObject: Phaser.GameObjects.GameObject): void {
        this.get(name).sendToBack(gameObject);
    }
}
