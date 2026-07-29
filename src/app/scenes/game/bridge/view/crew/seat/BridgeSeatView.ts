// src/app/scenes/game/bridge/view/crew/seat/BridgeSeatView.ts

import type { OfficerDefinition, OfficerRole } from '../../../../../../../engine/defs/officer';
import { OFFICER_STATION_SPRITE_ID, OFFICER_STATION_SPRITES } from '../../../../../../manifests/bridge/officer_station';
import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT, type BridgeOfficerStationIndicatorState } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeSeatActivityView from './activity/BridgeSeatActivityView';
import BridgeSeatLabelView from './label/BridgeSeatLabelView';
import BridgeSeatPortraitView from './portrait/BridgeSeatPortraitView';
import BridgeSeatStatusLightView from './status_light/BridgeSeatStatusLightView';

const EMPTY_LABEL = 'EMPTY';

const STATUS_LIGHT_POSITION = new Phaser.Math.Vector2(0, -97);

// Composite-view одной officer seat panel.
//
// Собирает:
// - frame;
// - portrait;
// - role label;
// - status light;
// - activity label;
// - activity progress.
export default class BridgeSeatView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly frameImage: Phaser.GameObjects.Image;

    private readonly portrait: BridgeSeatPortraitView;

    private readonly label: BridgeSeatLabelView;

    private readonly statusLightView: BridgeSeatStatusLightView;

    private readonly activityView: BridgeSeatActivityView;

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

        this.frameImage = this.scene.add
            .image(
                0,
                0,

                frameAsset.atlasKey,
                frameAsset.frameKey,
            )
            .setOrigin(0.5, 0.5);

        this.frameImage
            .setInteractive({
                useHandCursor: true,
            })
            .on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.root.add(this.frameImage);

        this.statusLightView = new BridgeSeatStatusLightView(this.scene);

        this.statusLightView.setPosition(STATUS_LIGHT_POSITION.x, STATUS_LIGHT_POSITION.y);

        this.root.add(this.statusLightView.getRoot());

        this.portrait = new BridgeSeatPortraitView(
            this.scene,
            this.root,

            this.getPortraitBottomY(),

            this.shouldFlipPortrait(position),
        );

        this.label = new BridgeSeatLabelView(
            this.scene,
            this.root,

            this.getLabelY(),

            EMPTY_LABEL,
        );

        this.activityView = new BridgeSeatActivityView(this.scene);

        this.root.add(this.activityView.getRoot());
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

        this.statusLightView.setState('off');

        this.clearActivity();
    }

    public setStatusLightState(state: BridgeOfficerStationIndicatorState): void {
        this.statusLightView.setState(state);
    }

    public showActivity(label: string): void {
        this.activityView.show(label);
    }

    public setActivityProgress(progress: number | null): void {
        this.activityView.setProgress(progress);
    }

    public clearActivity(): void {
        this.activityView.clear();
    }

    public destroy(): void {
        this.frameImage.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        this.statusLightView.destroy();
        this.label.destroy();
        this.portrait.destroy();
        this.frameImage.destroy();
        this.activityView.destroy();

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
