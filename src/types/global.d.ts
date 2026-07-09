export {};

declare global {
    interface Window {
        SpinePlugin: any;
    }

    namespace Phaser.Loader {
        interface LoaderPlugin {
            spine(key: string, jsonURL: string, atlasURL: string, preMultipliedAlpha?: boolean): void;
        }
    }

    namespace Phaser.GameObjects {
        interface GameObjectFactory {
            spine(x: number, y: number, key: string, animationName?: string, loop?: boolean): any;
        }
    }

    /** Type used to distinguish SFX and music audio categories. */
    type AudioType = 'sfx' | 'music';
}
