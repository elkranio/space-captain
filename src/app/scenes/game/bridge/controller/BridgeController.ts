// src/app/scenes/game/bridge/controller/BridgeController.ts

import type { OfficerRole } from '../../../../../engine/defs/officer';
import EncounterEngine from '../../../../../engine/encounter/EncounterEngine';
import type {
    EncounterOfficerCommand,
    EncounterOfficerCommandId,
} from '../../../../../engine/encounter/encounter_command';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../engine/encounter/encounter_event';
import type { EncounterState } from '../../../../../engine/encounter/encounter_state';
import { ENCOUNTER_OBJECT_KIND } from '../../../../../engine/encounter/objects/encounter_object';
import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import { STATION_SPRITES } from '../../../../manifests/stations/station_sprite';
import type BridgeScene from '../BridgeScene';
import { BRIDGE_EVENT, type BridgeOfficerCommandMenuGroupViewState } from '../events/bridge_event';
import BridgeEventBus from '../events/BridgeEventBus';
import BridgeView from '../view/BridgeView';

export default class BridgeController {
    private readonly eventBus = new BridgeEventBus();

    private view?: BridgeView;
    private encounterEngine?: EncounterEngine;
    private isEncounterActive = false;

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.view = new BridgeView(this.scene, this.eventBus);
        this.view.prepare();

        this.eventBus.on(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.loadState();
        this.loadEncounter();
    }

    public step(deltaMs: number): void {
        if (!this.isEncounterActive) {
            return;
        }

        void deltaMs;

        // Later:
        // this.encounterEngine?.step(deltaMs);
        // this.processEncounterEvents();
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_SEAT_CLICKED, this.handleOfficerSeatClicked, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, this.handleOfficerCommandSelected, this);

        this.view?.destroy();
        this.view = undefined;

        this.encounterEngine = undefined;
        this.isEncounterActive = false;

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

            case ENCOUNTER_EVENT.OFFICER_COMMANDS_READY:
                this.handleOfficerCommandsReady(event.role, event.commands);
                return;
        }
    }

    private handleEncounterLoaded(state: EncounterState): void {
        const objects = state.objects.map((object) => {
            switch (object.kind) {
                case ENCOUNTER_OBJECT_KIND.STATION:
                    return {
                        id: object.id,
                        sprite: STATION_SPRITES[object.station.spriteId],
                        position: new Phaser.Math.Vector2(object.position.x, object.position.y),
                    };
            }
        });

        // this.isEncounterActive = false;

        // this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED, objects);
        // this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, undefined);

        this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, objects);
        this.isEncounterActive = true;
    }

    private handleOfficerSeatClicked(payload: { role: OfficerRole }): void {
        if (!this.isEncounterActive) {
            return;
        }

        if (!this.encounterEngine) {
            return;
        }

        this.encounterEngine.requestOfficerCommands(payload.role);
        this.processEncounterEvents();
    }

    private handleOfficerCommandsReady(role: OfficerRole, commands: EncounterOfficerCommand[]): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_SYNCED, {
            role,
            groups: this.getOfficerCommandMenuGroups(commands),
        });
    }

    private getOfficerCommandMenuGroups(commands: EncounterOfficerCommand[]): BridgeOfficerCommandMenuGroupViewState[] {
        const groups: BridgeOfficerCommandMenuGroupViewState[] = [];

        for (const command of commands) {
            const groupLabel = command.targetLabel ?? 'GENERAL';

            let group = groups.find((item) => item.label === groupLabel);

            if (!group) {
                group = {
                    label: groupLabel,
                    items: [],
                };

                groups.push(group);
            }

            group.items.push({
                commandId: command.commandId,
                label: command.label,
                targetId: command.targetId,
            });
        }

        return groups;
    }

    private handleEncounterArrivalCompleted(): void {
        this.isEncounterActive = true;
    }

    private handleOfficerCommandSelected(payload: {
        role: OfficerRole;
        commandId: EncounterOfficerCommandId;
        targetId?: string;
    }): void {
        console.log('Officer command selected:', {
            role: payload.role,
            commandId: payload.commandId,
            targetId: payload.targetId,
        });
    }
}
