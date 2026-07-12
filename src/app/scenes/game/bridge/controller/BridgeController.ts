// src\app\scenes\game\bridge\controller\BridgeController.ts
import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import type BridgeScene from '../BridgeScene';
import { BRIDGE_EVENT } from '../events/bridge_event';
import BridgeEventBus from '../events/BridgeEventBus';
import BridgeView from '../view/BridgeView';

import { SPECIES_ID } from '../../../../../engine/defs/species';
import StationGenerator from '../../../../../engine/generation/station/StationGenerator';
import { STATION_SPRITES } from '../../../../manifests/stations/station_sprite';

export default class BridgeController {
    private readonly eventBus = new BridgeEventBus();

    private view?: BridgeView;

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.view = new BridgeView(this.scene, this.eventBus);
        this.view.prepare();

        this.loadState();
        this.loadEncounter();
    }

    public step(deltaMs: number): void {
        void deltaMs;
    }

    public destroy(): void {
        this.view?.destroy();
        this.view = undefined;

        this.eventBus.destroy();
    }

    private loadState(): void {
        const game = GAME_RUNTIME.getCurrentGame();
        this.eventBus.emit(BRIDGE_EVENT.CREW_LOADED, game.officers);
    }

    private loadEncounter(): void {
        const station = StationGenerator.generateStation(SPECIES_ID.HUMAN);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, [
            {
                id: station.id,
                sprite: STATION_SPRITES[station.spriteId],
                position: new Phaser.Math.Vector2(0.1, -0.05),
                scale: 1,
            },
        ]);
    }
}
