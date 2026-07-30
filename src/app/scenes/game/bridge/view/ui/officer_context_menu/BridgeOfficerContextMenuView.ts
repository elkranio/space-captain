// src/app/scenes/game/bridge/view/ui/officer_context_menu/BridgeOfficerContextMenuView.ts

import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeOfficerCommandMenuItemPayload,
    type BridgeOfficerCommandMenuUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { UI_EVENT } from '../ui_event';
import { OFFICER_CONTEXT_MENU_POSITION_BY_ROLE } from './bridge_officer_context_menu_layout';
import BridgeOfficerContextMenuContentView from './content/BridgeOfficerContextMenuContentView';
import {
    getOfficerContextMenuItemCount,
    getOfficerContextMenuMinHeight,
} from './height/get_officer_context_menu_min_height';
import BridgeOfficerContextMenuPanelView from './panel/BridgeOfficerContextMenuPanelView';

const REFRESH_INTERVAL_MS = 200;

// Root view officer command context menu.
// Управляет open/close, outside click, текущей role
// и отправкой выбранного menu action наверх.
export default class BridgeOfficerContextMenuView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly outsideClickCatcher: Phaser.GameObjects.Rectangle;

    private readonly panelView: BridgeOfficerContextMenuPanelView;
    private readonly contentView: BridgeOfficerContextMenuContentView;

    private currentRole?: OfficerRole;

    private latestMenuSnapshot?: string;
    private refreshTimer?: Phaser.Time.TimerEvent;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.outsideClickCatcher = this.createOutsideClickCatcher();
        this.root = this.scene.add.container(0, 0).setVisible(false);

        this.scene.layers.get('ui_blocker').add(this.outsideClickCatcher);
        this.scene.layers.get('ui').add(this.root);

        this.outsideClickCatcher.on(
            Phaser.Input.Events.POINTER_DOWN,
            this.handleOutsidePointerDown,
            this,
        );

        this.panelView = new BridgeOfficerContextMenuPanelView(this.scene);
        this.contentView = new BridgeOfficerContextMenuContentView(this.scene);

        this.contentView
            .getRoot()
            .on(UI_EVENT.CLICK, this.handleItemSelected, this);

        this.root.add([
            this.panelView.getRoot(),
            this.contentView.getRoot(),
        ]);

        this.eventBus.on(
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED,
            this.handleOfficerCommandMenuUpdated,
            this,
        );
    }

    public destroy(): void {
        this.stopRefreshPolling();

        this.eventBus.off(
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED,
            this.handleOfficerCommandMenuUpdated,
            this,
        );

        this.outsideClickCatcher.off(
            Phaser.Input.Events.POINTER_DOWN,
            this.handleOutsidePointerDown,
            this,
        );

        this.contentView
            .getRoot()
            .off(UI_EVENT.CLICK, this.handleItemSelected, this);

        this.contentView.destroy();
        this.panelView.destroy();

        this.outsideClickCatcher.destroy();
        this.root.destroy(false);
    }

    private handleOfficerCommandMenuUpdated(
        menu: BridgeOfficerCommandMenuUpdatedPayload,
    ): void {
        const snapshot = JSON.stringify(menu);

        if (snapshot === this.latestMenuSnapshot) {
            return;
        }

        this.latestMenuSnapshot = snapshot;
        this.contentView.clear();

        if (getOfficerContextMenuItemCount(menu) === 0) {
            this.closeMenu();
            return;
        }

        this.currentRole = menu.role;

        this.positionMenu(menu.role);
        this.renderPanel(menu);
        this.contentView.render(menu.groups);

        this.openMenu();
    }

    private handleOutsidePointerDown(): void {
        this.closeMenu();
    }

    private handleItemSelected(
        item: BridgeOfficerCommandMenuItemPayload,
    ): void {
        if (!this.currentRole) {
            return;
        }

        const role = this.currentRole;

        switch (item.kind) {
            case 'command':
                this.closeMenu();

                this.eventBus.emit(
                    BRIDGE_EVENT.OFFICER_COMMAND_SELECTED,
                    {
                        role,
                        commandId: item.commandId,

                        target: {
                            ...item.target,
                        },
                    },
                );

                return;

            case 'cancel_task':
                // Menu остаётся открытым.
                // Controller синхронно пришлёт новый snapshot
                // уже с доступными командами роли.
                this.eventBus.emit(
                    BRIDGE_EVENT.OFFICER_TASK_CANCEL_SELECTED,
                    {
                        role,
                        taskId: item.taskId,
                    },
                );

                return;
        }
    }

    private positionMenu(role: OfficerRole): void {
        const position = OFFICER_CONTEXT_MENU_POSITION_BY_ROLE[role];

        this.root.setPosition(position.x, position.y);
    }

    private renderPanel(
        menu: BridgeOfficerCommandMenuUpdatedPayload,
    ): void {
        this.panelView.render(
            menu.role.toUpperCase(),
            getOfficerContextMenuMinHeight(menu),
        );
    }

    private openMenu(): void {
        this.root.setVisible(true);
        this.outsideClickCatcher.setVisible(true).setInteractive();

        this.startRefreshPolling();
    }

    private closeMenu(): void {
        this.stopRefreshPolling();

        this.root.setVisible(false);
        this.outsideClickCatcher.disableInteractive().setVisible(false);

        this.currentRole = undefined;
        this.latestMenuSnapshot = undefined;
    }

    private startRefreshPolling(): void {
        if (this.refreshTimer) {
            return;
        }

        this.refreshTimer = this.scene.time.addEvent({
            delay: REFRESH_INTERVAL_MS,
            loop: true,

            callback: this.requestRefresh,
            callbackScope: this,
        });
    }

    private stopRefreshPolling(): void {
        this.refreshTimer?.destroy();
        this.refreshTimer = undefined;
    }

    private requestRefresh(): void {
        if (!this.currentRole) {
            return;
        }

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_REFRESH_REQUESTED,
            {
                role: this.currentRole,
            },
        );
    }

    private createOutsideClickCatcher(): Phaser.GameObjects.Rectangle {
        return this.scene.add
            .rectangle(
                0,
                0,

                this.scene.scale.width,
                this.scene.scale.height,

                0x000000,
                0,
            )
            .setOrigin(0, 0)
            .setVisible(false)
            .setInteractive()
            .disableInteractive();
    }
}
