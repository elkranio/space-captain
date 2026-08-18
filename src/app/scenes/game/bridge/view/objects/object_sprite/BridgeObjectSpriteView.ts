// src/app/scenes/game/bridge/view/objects/object_sprite/BridgeObjectSpriteView.ts

import type { Vec3 } from "../../../../../../../engine/defs/vector";
import type BridgeScene from "../../../BridgeScene";
import type { BridgeEncounterObjectPayload } from "../../../events/bridge_event";
import { getBridgeViewscreenPoint } from "../../bridge_viewscreen_layout";

// Leaf-view одного encounter object на bridge viewscreen.
//
// Хранит Phaser image, каноническую экранную позицию
// и metadata для псевдо-3D animation sequences.
export default class BridgeObjectSpriteView {
    private readonly root: Phaser.GameObjects.Container;

    // Render-only combat displacement. Canonical object queries intentionally
    // ignore this container so Evade does not move encounter truth.
    private readonly presentationRoot: Phaser.GameObjects.Container;

    private readonly visualRoot: Phaser.GameObjects.Container;
    private readonly objectImage: Phaser.GameObjects.Image;

    private idleDriftXTween?: Phaser.Tweens.Tween;
    private idleDriftYTween?: Phaser.Tweens.Tween;
    private idleDriftEnabled = false;

    private anchorObjectId = "";

    private localPosition: Vec3 = {
        x: 0,
        y: 0,
        z: 0,
    };

    private perspectiveDepth = 1;

    private readonly normalPosition = new Phaser.Math.Vector2();

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        payload: BridgeEncounterObjectPayload,
    ) {
        this.root = this.scene.add.container(0, 0);
        parent.add(this.root);

        this.presentationRoot = this.scene.add.container(0, 0);

        this.root.add(this.presentationRoot);

        this.visualRoot = this.scene.add.container(0, 0);

        this.presentationRoot.add(this.visualRoot);

        this.objectImage = this.scene.add
            .image(0, 0, payload.sprite.atlasKey, payload.sprite.frameKey)
            .setOrigin(0.5, 0.5);

        this.visualRoot.add(this.objectImage);

        this.update(payload);
    }

    public update(payload: BridgeEncounterObjectPayload): void {
        const point = getBridgeViewscreenPoint(payload.position);

        this.anchorObjectId = payload.anchorObjectId;

        this.localPosition = {
            ...payload.localPosition,
        };

        this.perspectiveDepth = payload.perspectiveDepth;

        this.normalPosition.set(point.x, point.y);

        this.restoreNormalPosition();
        this.objectImage.setTexture(payload.sprite.atlasKey, payload.sprite.frameKey);

        this.syncIdleDrift(payload.sprite.frameKey);
    }

    public prepareForArrival(): void {
        this.root.setVisible(false);
        this.restoreNormalPosition();
        this.setScale(0);
    }

    public showForArrival(): void {
        this.root.setVisible(true);
        this.restoreNormalPosition();
        this.setScale(0);
    }

    public setArrivalScale(scale: number): void {
        this.setScale(scale);
    }

    public showNormal(): void {
        this.root.setVisible(true);
        this.restoreNormalPosition();
        this.setScale(1);
    }

    public getAnchorObjectId(): string {
        return this.anchorObjectId;
    }

    public getLocalPosition(): Vec3 {
        return {
            ...this.localPosition,
        };
    }

    public getPerspectiveDepth(): number {
        return this.perspectiveDepth;
    }

    public getNormalPosition(): Phaser.Math.Vector2 {
        return this.normalPosition.clone();
    }

    public getX(): number {
        return this.root.x + this.visualRoot.x;
    }

    public getY(): number {
        return this.root.y + this.visualRoot.y;
    }

    public getScale(): number {
        return this.root.scaleX;
    }

    public getVisualBounds(): Phaser.Geom.Rectangle {
        return this.objectImage.getBounds();
    }

    public setPresentationOffsetX(offsetX: number): void {
        this.presentationRoot.x = offsetX;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setScale(scale: number): void {
        this.root.setScale(scale);
    }

    public destroy(): void {
        this.stopIdleDrift();
        this.root.destroy(true);
    }

    private syncIdleDrift(frameKey: string): void {
        const shouldDrift = frameKey.startsWith("ships/chassis/");

        if (shouldDrift === this.idleDriftEnabled) {
            return;
        }

        if (!shouldDrift) {
            this.stopIdleDrift();
            return;
        }

        this.idleDriftEnabled = true;

        this.idleDriftXTween = this.scene.tweens.add({
            targets: this.visualRoot,

            x: {
                from: -2,
                to: 2,
            },

            duration: 13_600,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1,
        });

        this.idleDriftYTween = this.scene.tweens.add({
            targets: this.visualRoot,

            y: {
                from: 1.5,
                to: -1.5,
            },

            duration: 10_400,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1,
        });
    }

    private stopIdleDrift(): void {
        this.idleDriftXTween?.stop();
        this.idleDriftXTween = undefined;

        this.idleDriftYTween?.stop();
        this.idleDriftYTween = undefined;

        this.idleDriftEnabled = false;

        this.visualRoot.setPosition(0, 0);
    }

    private restoreNormalPosition(): void {
        this.setPosition(this.normalPosition.x, this.normalPosition.y);
    }
}
