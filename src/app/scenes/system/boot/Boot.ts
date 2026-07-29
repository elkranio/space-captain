// src/app/scenes/system/boot/Boot.ts

import Phaser from 'phaser';
import { SCENE_KEY } from '../../scene_key';

export default class Boot extends Phaser.Scene {
    constructor() {
        super(SCENE_KEY.BOOT);
    }

    preload(): void {
        this.load.image('preload_logo', 'assets/images/boot/preload_logo.png');
    }

    create(): void {
        this.scene.start(SCENE_KEY.PRELOAD);
    }
}
