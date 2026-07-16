// src/app/scenes/game/bridge/view/ui/officer_context_menu/BridgeOfficerContextMenuView.ts

import type { OfficerRole } from '../../../../../../../engine/defs/officer';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeOfficerCommandMenuGroupPayload,
    type BridgeOfficerCommandMenuItemPayload,
    type BridgeOfficerCommandMenuUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeOfficerContextMenuItemView from './BridgeOfficerContextMenuItemView';
import BridgeOfficerContextMenuPanelView from './BridgeOfficerContextMenuPanelView';
import {
    OFFICER_CONTEXT_MENU_LAYOUT,
    OFFICER_CONTEXT_MENU_POSITION_BY_ROLE,
} from './bridge_officer_context_menu_layout';
import { UI_EVENT } from '../ui_event';

export default class BridgeOfficerContextMenuView {
    // #region Fields

    private readonly root: Phaser.GameObjects.Container;
    private readonly blocker: Phaser.GameObjects.Rectangle;

    private readonly panelView: BridgeOfficerContextMenuPanelView;
    private readonly itemViews: BridgeOfficerContextMenuItemView[] = [];
    private readonly groupLabels: Phaser.GameObjects.BitmapText[] = [];

    private currentRole?: OfficerRole;

    // #endregion

    // #region Lifecycle

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.blocker = this.createBlocker();
        this.root = this.scene.add.container(0, 0).setVisible(false);

        this.scene.layers.get('ui_blocker').add(this.blocker);
        this.scene.layers.get('ui').add(this.root);

        this.blocker.on(Phaser.Input.Events.POINTER_DOWN, this.handleBlockerPointerDown, this);

        this.panelView = new BridgeOfficerContextMenuPanelView(this.scene);
        this.root.add(this.panelView.getRoot());

        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, this.handleOfficerCommandMenuSynced, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, this.handleOfficerCommandMenuSynced, this);

        this.blocker.off(Phaser.Input.Events.POINTER_DOWN, this.handleBlockerPointerDown, this);

        this.clearContent();

        this.blocker.destroy();
        this.root.destroy(true);
    }

    // #endregion

    // #region External events

    private handleOfficerCommandMenuSynced(menu: BridgeOfficerCommandMenuUpdatedPayload): void {
        this.clearContent();

        if (this.isEmpty(menu)) {
            this.closeMenu();
            return;
        }

        this.currentRole = menu.role;

        this.positionMenu(menu.role);
        this.renderPanel(menu);
        this.renderGroups(menu.groups);
        this.openMenu();
    }

    private handleBlockerPointerDown(): void {
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

    // #endregion

    // #region Rendering

    private positionMenu(role: OfficerRole): void {
        const position = OFFICER_CONTEXT_MENU_POSITION_BY_ROLE[role];

        this.root.setPosition(position.x, position.y);
    }

    private renderPanel(menu: BridgeOfficerCommandMenuUpdatedPayload): void {
        this.panelView.render(menu.role.toUpperCase(), this.getMinHeight(menu));
    }

    private renderGroups(groups: BridgeOfficerCommandMenuGroupPayload[]): void {
        let cursorY: number = OFFICER_CONTEXT_MENU_LAYOUT.content.y;

        groups.forEach((group, groupIndex) => {
            cursorY = this.renderGroup(group, groupIndex, cursorY);
        });
    }

    private renderGroup(group: BridgeOfficerCommandMenuGroupPayload, groupIndex: number, cursorY: number): number {
        let nextY = cursorY;

        if (groupIndex > 0) {
            nextY += OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginTop;
        }

        this.renderGroupLabel(group.label, nextY);

        nextY += OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.height + OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginBottom;

        for (const item of group.items) {
            nextY = this.renderItem(item, nextY);
        }

        return nextY;
    }

    private renderGroupLabel(label: string, y: number): void {
        const groupLabel = this.createGroupLabel(label, y);

        this.root.add(groupLabel);
        this.groupLabels.push(groupLabel);
    }

    private renderItem(item: BridgeOfficerCommandMenuItemPayload, y: number): number {
        const itemView = new BridgeOfficerContextMenuItemView(this.scene, item);

        itemView.getRoot().on(UI_EVENT.CLICK, this.handleItemSelected, this);

        itemView.setPosition(OFFICER_CONTEXT_MENU_LAYOUT.item.x, y);

        this.root.add(itemView.getRoot());
        this.itemViews.push(itemView);

        return y + this.getItemStepY();
    }

    private createGroupLabel(label: string, y: number): Phaser.GameObjects.BitmapText {
        return this.scene.add
            .bitmapText(
                OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.x,
                y,
                FONT_FAMILY.VGA_8X14,
                label.toUpperCase(),
                FONT_SIZE.PX_16,
            )
            .setTint(FONT_COLOR.SECONDARY);
    }

    // #endregion

    // #region Menu state

    private openMenu(): void {
        this.root.setVisible(true);
        this.blocker.setVisible(true).setInteractive();
    }

    private closeMenu(): void {
        this.root.setVisible(false);
        this.blocker.disableInteractive().setVisible(false);
        this.currentRole = undefined;
    }

    private clearContent(): void {
        for (const itemView of this.itemViews) {
            itemView.destroy();
        }

        this.itemViews.length = 0;

        for (const groupLabel of this.groupLabels) {
            groupLabel.destroy();
        }

        this.groupLabels.length = 0;
    }

    // #endregion

    // #region Layout calculations

    private isEmpty(menu: BridgeOfficerCommandMenuUpdatedPayload): boolean {
        return this.getItemCount(menu) === 0;
    }

    private getItemCount(menu: BridgeOfficerCommandMenuUpdatedPayload): number {
        return menu.groups.reduce((total, group) => total + group.items.length, 0);
    }

    private getMinHeight(menu: BridgeOfficerCommandMenuUpdatedPayload): number {
        let contentHeight = 0;

        menu.groups.forEach((group, groupIndex) => {
            if (groupIndex > 0) {
                contentHeight += OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginTop;
            }

            contentHeight +=
                OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.height + OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginBottom;

            contentHeight += this.getItemsHeight(group.items.length);
        });

        return (
            OFFICER_CONTEXT_MENU_LAYOUT.content.y + contentHeight + OFFICER_CONTEXT_MENU_LAYOUT.content.bottomPadding
        );
    }

    private getItemsHeight(itemCount: number): number {
        if (itemCount === 0) {
            return 0;
        }

        return (
            itemCount * OFFICER_CONTEXT_MENU_LAYOUT.item.height +
            Math.max(0, itemCount - 1) * OFFICER_CONTEXT_MENU_LAYOUT.item.gap
        );
    }

    private getItemStepY(): number {
        return OFFICER_CONTEXT_MENU_LAYOUT.item.height + OFFICER_CONTEXT_MENU_LAYOUT.item.gap;
    }

    // #endregion

    // #region Creation

    private createBlocker(): Phaser.GameObjects.Rectangle {
        const blocker = this.scene.add
            .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0)
            .setOrigin(0, 0)
            .setVisible(false)
            .setInteractive();

        blocker.disableInteractive();

        return blocker;
    }

    // #endregion
}
