// src/app/scenes/game/overlay/controller/GameOverlayController.ts

import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerLocationState,
} from '../../../../../engine/defs/player_location';
import { SPACE_ANCHOR_KIND, type SpaceAnchorState } from '../../../../../engine/defs/universe';
import { getCurrentNode } from '../../../../../engine/universe/queries/get_current_node';
import { GAME_RUNTIME } from '../../../../runtime/GameRuntime';
import GameOverlayEventBus from '../events/GameOverlayEventBus';
import { GAME_OVERLAY_EVENT } from '../events/game_overlay_event';
import type GameOverlayScene from '../GameOverlayScene';
import LocalSpaceButtonView from '../view/LocalSpaceButtonView';
import LocalSpacePanelView, { type LocalSpacePanelRow } from '../view/LocalSpacePanelView';

type SpaceObjectIdentity = {
    id: string;
    name: string;
};

// Root-controller постоянного game overlay.
//
// Собирает overlay views, обрабатывает UI intents
// и подготавливает presentation payload из текущего RunState.
export default class GameOverlayController {
    private readonly eventBus = new GameOverlayEventBus();

    private localSpaceButtonView?: LocalSpaceButtonView;
    private localSpacePanelView?: LocalSpacePanelView;

    constructor(private readonly scene: GameOverlayScene) {}

    public prepare(): void {
        this.registerEventHandlers();
        this.registerRuntimeEventHandlers();

        this.localSpaceButtonView = new LocalSpaceButtonView(this.scene, this.eventBus);

        // Создаётся после кнопки, поэтому panel root находится выше неё
        // внутри overlay UI layer.
        this.localSpacePanelView = new LocalSpacePanelView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.unregisterRuntimeEventHandlers();
        this.unregisterEventHandlers();

        this.localSpacePanelView?.destroy();
        this.localSpacePanelView = undefined;

        this.localSpaceButtonView?.destroy();
        this.localSpaceButtonView = undefined;

        this.eventBus.destroy();
    }

    private registerEventHandlers(): void {
        this.eventBus.on(GAME_OVERLAY_EVENT.LOCAL_SPACE_BUTTON_CLICKED, this.handleLocalSpaceButtonClicked, this);

        this.eventBus.on(
            GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED,
            this.handleLocalSpacePanelCloseClicked,
            this,
        );
    }

    private unregisterEventHandlers(): void {
        this.eventBus.off(GAME_OVERLAY_EVENT.LOCAL_SPACE_BUTTON_CLICKED, this.handleLocalSpaceButtonClicked, this);

        this.eventBus.off(
            GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED,
            this.handleLocalSpacePanelCloseClicked,
            this,
        );
    }

    private registerRuntimeEventHandlers(): void {
        GAME_RUNTIME.onPlayerLocationChanged(this.handleRuntimeStateChanged);
        GAME_RUNTIME.onCurrentNodeAnchorsChanged(this.handleRuntimeStateChanged);
    }

    private unregisterRuntimeEventHandlers(): void {
        GAME_RUNTIME.offPlayerLocationChanged(this.handleRuntimeStateChanged);
        GAME_RUNTIME.offCurrentNodeAnchorsChanged(this.handleRuntimeStateChanged);
    }

    private handleLocalSpaceButtonClicked(): void {
        this.localSpacePanelView?.show(this.createLocalSpacePanelRows());
    }

    private handleLocalSpacePanelCloseClicked(): void {
        this.localSpacePanelView?.hide();
    }

    private readonly handleRuntimeStateChanged = (): void => {
        if (!this.localSpacePanelView?.isVisible()) {
            return;
        }

        this.localSpacePanelView.setRows(this.createLocalSpacePanelRows());
    };

    private createLocalSpacePanelRows(): LocalSpacePanelRow[] {
        const run = GAME_RUNTIME.getCurrentRun();
        const currentNode = getCurrentNode(run);
        const currentObjectId = this.getCurrentObjectId(run.player.location);

        return currentNode.anchors.map((anchor) => {
            const identity = this.getSpaceAnchorIdentity(anchor);

            return {
                objectId: identity.id,
                label: identity.name,
                isCurrent: identity.id === currentObjectId,
            };
        });
    }

    private getCurrentObjectId(location: PlayerLocationState): string | undefined {
        switch (location.kind) {
            case PLAYER_LOCATION_KIND.SPACE: {
                const navigation = location.navigation;

                switch (navigation.kind) {
                    case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
                        return navigation.targetObjectId;

                    case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
                        return navigation.anchorObjectId;

                    case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
                        return undefined;

                    default:
                        return this.assertNever(navigation);
                }
            }

            case PLAYER_LOCATION_KIND.STATION:
                return location.stationId;

            default:
                return this.assertNever(location);
        }
    }

    private getSpaceAnchorIdentity(anchor: SpaceAnchorState): SpaceObjectIdentity {
        switch (anchor.kind) {
            case SPACE_ANCHOR_KIND.STATION:
                return {
                    id: anchor.station.id,
                    name: anchor.station.name,
                };

            case SPACE_ANCHOR_KIND.NAVIGATION_BEACON:
                return {
                    id: anchor.beacon.id,
                    name: anchor.beacon.name,
                };

            case SPACE_ANCHOR_KIND.ASTEROID:
                return {
                    id: anchor.asteroid.id,
                    name: anchor.asteroid.name,
                };

            case SPACE_ANCHOR_KIND.JUMP_POINT:
                return {
                    id: anchor.jumpPoint.id,
                    name: anchor.jumpPoint.name,
                };

            default:
                return this.assertNever(anchor);
        }
    }

    private assertNever(value: never): never {
        throw new Error(`Unhandled value: ${String(value)}`);
    }
}
