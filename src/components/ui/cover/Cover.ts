/**
 * A transparent full-screen overlay that blocks all input.
 * Useful for temporarily disabling interaction during transitions or popups.
 */
export default class Cover extends Phaser.GameObjects.Rectangle {
    constructor(scene: Phaser.Scene) {
        const { width, height } = scene.scale;
        super(scene, 0, 0, width, height, 0x000000, 0.01);

        this.setOrigin(0);
        this.setScrollFactor(0);
        this.setInteractive();
        this.setVisible(false);
        this.setActive(false);
    }

    /**
     * Makes the cover visible and active, blocking input.
     */
    public show(): void {
        this.setVisible(true);
        this.setActive(true);
    }

    /**
     * Hides the cover and deactivates input blocking.
     */
    public hide(): void {
        this.setVisible(false);
        this.setActive(false);
    }
}
