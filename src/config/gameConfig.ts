// src/config/gameConfig.ts
// import 'phaser/plugins/spine/dist/SpinePlugin'; // old version
import 'phaser/plugins/spine4.1/dist/SpinePlugin';

const spinePlugin = window.SpinePlugin;

const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    // base game size
    width: 1280,
    height: 720,

    // DOM container for possible UI integration
    parent: 'game-container',

    // Canvas rendering details
    pixelArt: true,
    transparent: false,

    // Scale mode
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,

        // optional boundaries
        // min: {width: 640, height: 360},
        // max: {width: 1920, height: 1080}
    },

    // Scene plugin: Spine 3.x (or 4.x if swapped)
    plugins: {
        scene: [
            {
                key: 'SpinePlugin',
                plugin: spinePlugin,
                mapping: 'spine',
            },
        ],
    },

    // Canvas background color
    backgroundColor: '#f9f6ef',

    // Physics config
    // physics: {
    //     default: 'arcade',
    //     arcade: {
    //         gravity: {x: 0, y: 0},
    //         debug: false
    //     }
    // }

    // DOM input system
    // dom: {
    //     createContainer: true
    // }

    // Canvas context settings
    // render: {
    //   pixelArt: false,
    //   antialias: true,
    //   roundPixels: false,
    //   clearBeforeRender: true,
    //   preserveDrawingBuffer: false,
    //   failIfMajorPerformanceCaveat: false,
    // },

    // Max number of touch points
    // input: {
    //   activePointers: 3,
    // },

    // Autofocus the canvas on game load
    // autoFocus: true,

    // Optional FPS control
    // fps: {
    //   target: 60,
    //   forceSetTimeOut: false,
    //   min: 10,
    //   deltaHistory: 10,
    // },
};

export default gameConfig;
