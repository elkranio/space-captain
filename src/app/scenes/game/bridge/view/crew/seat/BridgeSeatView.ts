// src/app/scenes/game/bridge/view/crew/seat/BridgeSeatView.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../../../engine/defs/officer';
import {
    OFFICER_STATION_FRAME_ID,
    OFFICER_STATION_FRAME_SPRITES,
} from '../../../../../../manifests/bridge/officer_station';
import type BridgeScene from '../../../BridgeScene';
import BridgeSeatLabelView from './label/BridgeSeatLabelView';
import BridgeSeatPortraitView from './portrait/BridgeSeatPortraitView';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

const EMPTY_ROLE = 'EMPTY';

export default class BridgeSeatView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly frame: Phaser.GameObjects.Image;
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

        const frameAsset = OFFICER_STATION_FRAME_SPRITES[OFFICER_STATION_FRAME_ID.EMPTY];

        this.frame = this.scene.add.image(0, 0, frameAsset.atlasKey, frameAsset.frameKey).setOrigin(0.5, 0.5);
        this.frame
            .setInteractive({ useHandCursor: true })
            .on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
        this.root.add(this.frame);

        this.portrait = new BridgeSeatPortraitView(
            this.scene,
            this.root,
            this.getPortraitBottomY(),
            this.shouldFlipPortrait(position),
        );

        this.label = new BridgeSeatLabelView(this.scene, this.root, this.getLabelY(), EMPTY_ROLE);
    }

    public setRole(role: OfficerRole): void {
        this.role = role;
    }

    public clearRole(): void {
        this.role = null;
    }

    public setOfficer(officer: OfficerDefinition): void {
        this.role = officer.role;
        this.label.setText(officer.role.toUpperCase());
        this.portrait.setPortrait(officer.portraitId);
    }

    public destroy(): void {
        this.label.destroy();
        this.portrait.destroy();
        this.frame.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
        this.root.destroy(true);
    }

    private shouldFlipPortrait(position: Phaser.Math.Vector2): boolean {
        const screenCenterX = this.scene.cameras.main.centerX;

        return position.x > screenCenterX;
    }

    private getPortraitBottomY(): number {
        return this.frame.height * 0.5 - 48;
    }

    private getLabelY(): number {
        return -this.frame.height * 0.5 + 27;
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
