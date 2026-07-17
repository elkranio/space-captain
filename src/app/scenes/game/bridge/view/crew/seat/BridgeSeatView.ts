// src/app/scenes/game/bridge/view/crew/seat/BridgeSeatView.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../../../engine/defs/officer';
import { OFFICER_STATION_SPRITE_ID, OFFICER_STATION_SPRITES } from '../../../../../../manifests/bridge/officer_station';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import type BridgeScene from '../../../BridgeScene';
import BridgeSeatLabelView from './label/BridgeSeatLabelView';
import BridgeSeatPortraitView from './portrait/BridgeSeatPortraitView';

const EMPTY_LABEL = 'EMPTY';

// Composite-view одной officer seat panel.
// Собирает frame, portrait, label и эмитит input event при клике по занятому seat.
export default class BridgeSeatView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly frameImage: Phaser.GameObjects.Image;
    private readonly portrait: BridgeSeatPortraitView;
    private readonly label: BridgeSeatLabelView;

    private role: OfficerRole | null = null;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        position: Phaser.Math.Vector2,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(position.x, position.y);
        parent.add(this.root);

        const frameAsset = OFFICER_STATION_SPRITES[OFFICER_STATION_SPRITE_ID.FRAME_EMPTY];

        this.frameImage = this.scene.add.image(0, 0, frameAsset.atlasKey, frameAsset.frameKey).setOrigin(0.5, 0.5);

        this.frameImage
            .setInteractive({ useHandCursor: true })
            .on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.root.add(this.frameImage);

        this.portrait = new BridgeSeatPortraitView(
            this.scene,
            this.root,
            this.getPortraitBottomY(),
            this.shouldFlipPortrait(position),
        );

        this.label = new BridgeSeatLabelView(this.scene, this.root, this.getLabelY(), EMPTY_LABEL);
    }

    public setOfficer(officer: OfficerDefinition): void {
        this.role = officer.role;
        this.label.setText(officer.role.toUpperCase());
        this.portrait.setPortrait(officer.portraitId);
    }

    public clearOfficer(): void {
        this.role = null;
        this.label.setText(EMPTY_LABEL);
        this.portrait.clearPortrait();
    }

    public destroy(): void {
        this.frameImage.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.label.destroy();
        this.portrait.destroy();
        this.frameImage.destroy();

        this.root.destroy(false);
    }

    private shouldFlipPortrait(position: Phaser.Math.Vector2): boolean {
        const screenCenterX = this.scene.cameras.main.centerX;

        return position.x > screenCenterX;
    }

    private getPortraitBottomY(): number {
        return this.frameImage.height * 0.5 - 48;
    }

    private getLabelY(): number {
        return -this.frameImage.height * 0.5 + 27;
    }

    private handlePointerDown(): void {
        if (!this.role) {
            return;
        }

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, {
            role: this.role,
        });
    }
}
