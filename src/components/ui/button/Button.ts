import Phaser from 'phaser';
import { ButtonConfig, DEFAULT_BUTTON_CONFIG } from './buttonConfig';

/**
 * A simple UI button composed of a background rectangle and bitmap text label.
 * Emits a `'click'` event when pressed.
 */
export default class Button extends Phaser.GameObjects.Container {
    private bg!: Phaser.GameObjects.Rectangle;
    private label!: Phaser.GameObjects.BitmapText;

    /**
     * Creates a new Button instance.
     * @param scene - The scene to which this button belongs.
     * @param config - Optional partial config object to customize appearance and label.
     */
    constructor(scene: Phaser.Scene, x: number, y: number, config: Partial<ButtonConfig> = {}) {
        super(scene, x, y);

        const merged: Required<ButtonConfig> = {
            bg: { ...DEFAULT_BUTTON_CONFIG.bg, ...config.bg },
            label: { ...DEFAULT_BUTTON_CONFIG.label, ...config.label },
        };

        this.setupBG(merged);
        this.setupLabel(merged);
    }

    /**
     * Creates and configures the button's background rectangle.
     * @param config - Fully merged configuration object.
     */
    private setupBG(config: Required<ButtonConfig>) {
        const { width, height, color } = config.bg;
        this.bg = this.scene.add.rectangle(0, 0, width, height, color);
        this.bg.setOrigin(0.5);
        this.bg.setInteractive({ useHandCursor: true });
        this.add(this.bg);

        this.bg.on('pointerdown', () => this.emit('click', this));
    }

    /**
     * Creates and configures the button's bitmap text label.
     * @param config - Fully merged configuration object.
     */
    private setupLabel(config: Required<ButtonConfig>) {
        const { font, size, text, color } = config.label;
        this.label = this.scene.add.bitmapText(0, 0, font, text, size);
        this.label.setOrigin(0.5);
        this.label.setTint(color);
        this.add(this.label);
    }

    /**
     * Sets the label text of the button.
     * @param value - The new text to display.
     */
    public setText(value: string): void {
        this.label.setText(value);
    }

    /**
     * Disables the button, making it non-interactive and visually dimmed.
     */
    public disable(): void {
        this.bg.disableInteractive();
        this.alpha = 0.5;
    }

    /**
     * Enables the button, restoring interactivity and full visibility.
     */
    public enable(): void {
        this.bg.setInteractive({ useHandCursor: true });
        this.alpha = 1;
    }
}
