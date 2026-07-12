// src\app\scenes\game\bridge\controller\BridgeController.ts

import EncounterEngine from '../../../../../engine/encounter/EncounterEngine';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../engine/encounter/encounter_event';
import type { EncounterState } from '../../../../../engine/encounter/encounter_state';
import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import { STATION_SPRITES } from '../../../../manifests/stations/station_sprite';
import type BridgeScene from '../BridgeScene';
import { BRIDGE_EVENT } from '../events/bridge_event';
import BridgeEventBus from '../events/BridgeEventBus';
import BridgeView from '../view/BridgeView';

export default class BridgeController {
    private readonly eventBus = new BridgeEventBus();

    private view?: BridgeView;
    private encounterEngine?: EncounterEngine;

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.view = new BridgeView(this.scene, this.eventBus);
        this.view.prepare();

        this.loadState();
        this.loadEncounter();
    }

    public step(deltaMs: number): void {
        void deltaMs;

        // Later:
        // this.encounterEngine?.step(deltaMs);
        // this.processEncounterEvents();
    }

    public destroy(): void {
        this.view?.destroy();
        this.view = undefined;

        this.encounterEngine = undefined;

        this.eventBus.destroy();
    }

    private loadState(): void {
        const game = GAME_RUNTIME.getCurrentGame();

        this.eventBus.emit(BRIDGE_EVENT.CREW_LOADED, game.officers);
    }

    private loadEncounter(): void {
        this.encounterEngine = new EncounterEngine();
        this.processEncounterEvents();
    }

    private processEncounterEvents(): void {
        if (!this.encounterEngine) {
            return;
        }

        for (const event of this.encounterEngine.drainEvents()) {
            this.handleEncounterEvent(event);
        }
    }

    private handleEncounterEvent(event: EncounterEvent): void {
        switch (event.type) {
            case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
                this.handleEncounterLoaded(event.state);
                return;

            default:
                throw new Error(`Unhandled encounter event: ${String(event.type)}`);
        }
    }

    private handleEncounterLoaded(state: EncounterState): void {
        this.eventBus.emit(
            BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED,
            state.objects.map((object) => ({
                id: object.id,
                sprite: STATION_SPRITES[object.station.spriteId],
                position: new Phaser.Math.Vector2(object.position.x, object.position.y),
            })),
        );
    }
}
