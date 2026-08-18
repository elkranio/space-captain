// src/app/scenes/system/preload/Preload.ts

import P34TOptions from "../../../../config/p34t.options";
import { DEFAULT_ATLAS_KEY } from "../../../manifests/types";
import { SCENE_KEY } from "../../scene_key";

export default class Preload extends Phaser.Scene {
    constructor() {
        super(SCENE_KEY.PRELOAD);
    }

    init(): void {
        const { width, height } = this.scale;

        this.add.image(width / 2, height / 2 - 100, "preload_logo");

        const barBg = this.add.graphics();

        barBg.fillStyle(0x5a1200, 1);
        barBg.fillRect(width / 2 - 150, height / 2 + 100, 300, 30);

        const barFill = this.add.graphics();

        this.load.on("progress", (value: number) => {
            barFill.clear();
            barFill.fillStyle(0xff950a);

            barFill.fillRect(width / 2 - 148, height / 2 + 102, 296 * value, 26);
        });
    }

    preload(): void {
        this.load.setPath("assets/images");
        this.load.multiatlas(DEFAULT_ATLAS_KEY, `atlas.json?v=${Math.random()}`);
        this.load.setPath("");

        this.load.audioSprite("sfx", "assets/sfx/sfx.json", ["assets/sfx/sfx.ogg", "assets/sfx/sfx.mp3"]);

        this.load.audio("ost", "assets/music/demo.ogg");

        for (const font of P34TOptions.fonts) {
            this.load.bitmapFont(font, `assets/fonts/${font}_0.png`, `assets/fonts/${font}.fnt`);
        }
    }

    create(): void {
        this.scene.start(SCENE_KEY.INIT);
    }
}
