import Phaser from 'phaser';

export default class Utils {
    /**
     * Fixes floating-point rounding issues.
     * @param value - The number to round.
     * @param precision - Decimal places (default: 2).
     * @returns Rounded number.
     */
    public static fixRounding(value: number, precision: number = 2): number {
        const power = Math.pow(10, precision);
        return Math.round((value + Number.EPSILON) * power) / power;
    }

    /**
     * Returns a Promise that resolves after a delay.
     * @param scene - The current Phaser.Scene.
     * @param delay - Time in milliseconds.
     * @returns A Promise that resolves after the delay.
     */
    public static wait(scene: Phaser.Scene, delay: number): Promise<void> {
        return new Promise((resolve) => {
            scene.time.addEvent({
                delay,
                callback: () => resolve(),
            });
        });
    }

    /**
     * Gets the currently active scene (from any scene context).
     * @param scene - Any reference scene.
     * @returns The active Phaser.Scene.
     */
    public static getActiveScene(scene: Phaser.Scene): Phaser.Scene {
        return scene.scene.manager.getScenes(true)[0];
    }
}
