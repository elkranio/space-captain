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

// Root view officer command context menu.
// Управляет open/close, outside click, текущей role и отправкой выбранной команды наверх.
export default class BridgeOfficerContextMenuView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly outsideClickCatcher: Phaser.GameObjects.Rectangle;

    private readonly panelView: BridgeOfficerContextMenuPanelView;
    private readonly contentView: BridgeOfficerContextMenuContentView;

    private currentRole?: OfficerRole;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.outsideClickCatcher = this.createOutsideClickCatcher();
        this.root = this.scene.add.container(0, 0).setVisible(false);

        this.scene.layers.get('ui_blocker').add(this.outsideClickCatcher);
        this.scene.layers.get('ui').add(this.root);

        this.outsideClickCatcher.on(Phaser.Input.Events.POINTER_DOWN, this.handleOutsidePointerDown, this);

        this.panelView = new BridgeOfficerContextMenuPanelView(this.scene);
        this.contentView = new BridgeOfficerContextMenuContentView(this.scene);

        this.contentView.getRoot().on(UI_EVENT.CLICK, this.handleItemSelected, this);

        this.root.add([this.panelView.getRoot(), this.contentView.getRoot()]);

        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, this.handleOfficerCommandMenuUpdated, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, this.handleOfficerCommandMenuUpdated, this);

        this.outsideClickCatcher.off(Phaser.Input.Events.POINTER_DOWN, this.handleOutsidePointerDown, this);
        this.contentView.getRoot().off(UI_EVENT.CLICK, this.handleItemSelected, this);

        this.contentView.destroy();
        this.panelView.destroy();

        this.outsideClickCatcher.destroy();
        this.root.destroy(false);
    }

    private handleOfficerCommandMenuUpdated(menu: BridgeOfficerCommandMenuUpdatedPayload): void {
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

    private handleItemSelected(item: BridgeOfficerCommandMenuItemPayload): void {
        if (!this.currentRole) {
            return;
        }

        const role = this.currentRole;

        this.closeMenu();

        this.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_SELECTED, {
            role,
            commandId: item.commandId,
            targetId: item.targetId,
        });
    }

    private positionMenu(role: OfficerRole): void {
        const position = OFFICER_CONTEXT_MENU_POSITION_BY_ROLE[role];

        this.root.setPosition(position.x, position.y);
    }

    private renderPanel(menu: BridgeOfficerCommandMenuUpdatedPayload): void {
        this.panelView.render(menu.role.toUpperCase(), getOfficerContextMenuMinHeight(menu));
    }

    private openMenu(): void {
        this.root.setVisible(true);
        this.outsideClickCatcher.setVisible(true).setInteractive();
    }

    private closeMenu(): void {
        this.root.setVisible(false);
        this.outsideClickCatcher.disableInteractive().setVisible(false);
        this.currentRole = undefined;
    }

    private createOutsideClickCatcher(): Phaser.GameObjects.Rectangle {
        return this.scene.add
            .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0)
            .setOrigin(0, 0)
            .setVisible(false)
            .setInteractive()
            .disableInteractive();
    }
}
