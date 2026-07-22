// src/app/scenes/game/bridge/view/crew/seat/status_light/BridgeSeatStatusLightView.ts

import {
    OFFICER_STATION_SPRITE_ID,
    OFFICER_STATION_SPRITES,
} from '../../../../../../../manifests/bridge/officer_station';
import type BridgeScene from '../../../../BridgeScene';
import type { BridgeOfficerStationIndicatorState } from '../../../../events/bridge_event';

type BridgeSeatStatusLightState = BridgeOfficerStationIndicatorState | 'blocked';

type VisibleBridgeSeatStatusLightState = Exclude<BridgeSeatStatusLightState, 'off'>;

// Leaf-view лампы officer station.
//
// off не рисует overlay:
// потухшая лампа уже находится в базовом frame панели.
export default class BridgeSeatStatusLightView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly lightImage: Phaser.GameObjects.Image;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);

        this.lightImage = this.scene.add.image(0, 0, '', '').setOrigin(0.5, 0.5).setVisible(false);

        this.root.add(this.lightImage);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setState(state: BridgeSeatStatusLightState): void {
        if (state === 'off') {
            this.lightImage.setVisible(false);
            return;
        }

        const sprite = this.getSprite(state);

        this.lightImage.setTexture(sprite.atlasKey, sprite.frameKey).setVisible(true);
    }

    private getSprite(state: VisibleBridgeSeatStatusLightState) {
        switch (state) {
            case 'ready':
                return OFFICER_STATION_SPRITES[OFFICER_STATION_SPRITE_ID.STATUS_LIGHT_READY_00];

            case 'busy':
                return OFFICER_STATION_SPRITES[OFFICER_STATION_SPRITE_ID.STATUS_LIGHT_BUSY_00];

            case 'blocked':
                return OFFICER_STATION_SPRITES[OFFICER_STATION_SPRITE_ID.STATUS_LIGHT_BLOCKED_00];

            default:
                return assertNever(state);
        }
    }
}

function assertNever(value: never): never {
    throw new Error(`Unknown officer station indicator state: ${value}`);
}
