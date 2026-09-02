import {
    UI_BUTTON_SPRITE_ID,
    UI_BUTTON_SPRITES,
} from "../../../../../../../../manifests/ui/button";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../../theme/font";
import type BridgeScene from "../../../../../BridgeScene";
import type BridgeEventBus from "../../../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgeDefenseTurretThreatsUpdatedPayload,
    type BridgeOfficerCommandSelectedPayload,
} from "../../../../../events/bridge_event";
import BridgeDefenseTurretThreatListView from "./threats/BridgeDefenseTurretThreatListView";

const VIEW = {
    titleX: 6,
    titleY: 0,

    closeRight: 0,
    closeY: 0,

    threatsY: 34,
} as const;

export default class BridgeDefenseTurretInteractionView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly closeButton: Phaser.GameObjects.Image;

    private readonly threatListView: BridgeDefenseTurretThreatListView;

    private latestThreats: BridgeDefenseTurretThreatsUpdatedPayload = [];

    private openState = false;

    constructor(
        scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
        onCloseRequested: () => void,
    ) {
        this.root = scene.add.container(0, 0);

        const title = scene.add
            .bitmapText(
                VIEW.titleX,
                VIEW.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "DEFENSE TURRET",
                FONT_SIZE.PX_24,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        const closeSprite = UI_BUTTON_SPRITES[UI_BUTTON_SPRITE_ID.CLOSE_00];

        this.closeButton = scene.add
            .image(
                width - VIEW.closeRight,
                VIEW.closeY,
                closeSprite.atlasKey,
                closeSprite.frameKey,
            )
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });

        this.closeButton.on("pointerup", onCloseRequested);

        this.threatListView = new BridgeDefenseTurretThreatListView(
            scene,
            width,
            height - VIEW.threatsY,
            (command) => this.handleFireRequested(command),
            (taskId) => this.handleCancelRequested(taskId),
        );
        this.threatListView.setPosition(0, VIEW.threatsY);

        this.root.add([
            title,
            this.closeButton,
            this.threatListView.getRoot(),
        ]);

        this.eventBus.on(
            BRIDGE_EVENT.DEFENSE_TURRET_THREATS_UPDATED,
            this.handleThreatsUpdated,
            this,
        );
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public open(): void {
        this.openState = true;
        this.root.setVisible(true);
        this.threatListView.open(this.latestThreats);
    }

    public close(): void {
        this.openState = false;
        this.threatListView.close();
        this.root.setVisible(false);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.DEFENSE_TURRET_THREATS_UPDATED,
            this.handleThreatsUpdated,
            this,
        );

        this.threatListView.destroy();
        this.root.destroy(true);
    }

    private handleThreatsUpdated(
        payload: BridgeDefenseTurretThreatsUpdatedPayload,
    ): void {
        this.latestThreats = payload;

        if (!this.openState) {
            return;
        }

        this.threatListView.update(payload);
    }

    private handleFireRequested(command: BridgeOfficerCommandSelectedPayload): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, command);
    }

    private handleCancelRequested(taskId: string): void {
        this.eventBus.emit(BRIDGE_EVENT.OFFICER_TASK_CANCEL_REQUESTED, {
            taskId,
        });
    }
}
