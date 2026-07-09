// src\app\scenes\system\boot\Boot.ts
import Phaser from 'phaser';
import { SCENE_KEY } from '../../scene_key';

export default class Boot extends Phaser.Scene {
    constructor() {
        super(SCENE_KEY.BOOT);
    }

    preload() {
        // load images for our preload scene
        this.load.image('preload_logo', 'assets/images/boot/preload_logo.png');

        // load images for orientation lock
        // this.load.image('play_landscape', 'assets/images/boot/play_landscape.png');
        // this.load.image('play_portrait', 'assets/images/boot/play_portrait.png');
    }

    create() {
        console.log('boot scene loaded');
        this.scene.start(SCENE_KEY.PRELOAD);
    }
}
