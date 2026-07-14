// src/app/scenes/game/bridge/view/ui/officer_context_menu/BridgeOfficerContextMenuView.ts

import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT, type BridgeOfficerCommandMenuViewState } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../theme/font';
import BridgeOfficerContextMenuItemView from './BridgeOfficerContextMenuItemView';
import BridgeOfficerContextMenuPanelView from './BridgeOfficerContextMenuPanelView';
import {
    OFFICER_CONTEXT_MENU_LAYOUT,
    OFFICER_CONTEXT_MENU_POSITION_BY_ROLE,
} from './bridge_officer_context_menu_layout';

export default class BridgeOfficerContextMenuView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly blocker: Phaser.GameObjects.Rectangle;

    private readonly panelView: BridgeOfficerContextMenuPanelView;
    private readonly itemViews: BridgeOfficerContextMenuItemView[] = [];
    private readonly groupLabels: Phaser.GameObjects.BitmapText[] = [];

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.blocker = this.scene.add
            .rectangle(0, 0, this.scene.scale.width, this.scene.scale.height, 0x000000, 0)
            .setOrigin(0, 0)
            .setVisible(false)
            .setInteractive();

        this.blocker.disableInteractive();

        this.root = this.scene.add.container(0, 0).setVisible(false);

        this.scene.layers.get('ui_blocker').add(this.blocker);
        this.scene.layers.get('ui').add(this.root);

        this.blocker.on(Phaser.Input.Events.POINTER_DOWN, this.handleBlockerPointerDown, this);

        this.panelView = new BridgeOfficerContextMenuPanelView(this.scene);
        this.root.add(this.panelView.getRoot());

        this.eventBus.on(BRIDGE_EVENT.OFFICER_COMMAND_MENU_SYNCED, this.handleOfficerCommandMenuSynced, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_COMMAND_MENU_SYNCED, this.handleOfficerCommandMenuSynced, this);

        this.blocker.off(Phaser.Input.Events.POINTER_DOWN, this.handleBlockerPointerDown, this);

        this.clearContent();

        this.blocker.destroy();
        this.root.destroy(true);
    }

    private handleOfficerCommandMenuSynced(menu: BridgeOfficerCommandMenuViewState): void {
        this.clearContent();

        const itemCount = this.getItemCount(menu);

        if (itemCount === 0) {
            this.closeMenu();
            return;
        }

        const position = OFFICER_CONTEXT_MENU_POSITION_BY_ROLE[menu.role];
        const title = menu.role.toUpperCase();
        const minHeight = this.getMinHeight(menu);

        this.root.setPosition(position.x, position.y);
        this.panelView.render(title, minHeight);
        this.openMenu();

        let cursorY = OFFICER_CONTEXT_MENU_LAYOUT.content.y;

        menu.groups.forEach((group, groupIndex) => {
            if (groupIndex > 0) {
                cursorY += OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginTop;
            }

            const groupLabel = this.createGroupLabel(group.label, cursorY);

            this.root.add(groupLabel);
            this.groupLabels.push(groupLabel);

            cursorY +=
                OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.height + OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginBottom;

            for (const item of group.items) {
                const itemView = new BridgeOfficerContextMenuItemView(this.scene, item.label);

                itemView.setPosition(OFFICER_CONTEXT_MENU_LAYOUT.item.x, cursorY);

                this.root.add(itemView.getRoot());
                this.itemViews.push(itemView);

                cursorY += OFFICER_CONTEXT_MENU_LAYOUT.item.height + OFFICER_CONTEXT_MENU_LAYOUT.item.gap;
            }
        });
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

    private openMenu(): void {
        this.root.setVisible(true);
        this.blocker.setVisible(true).setInteractive();
    }

    private closeMenu(): void {
        this.root.setVisible(false);
        this.blocker.disableInteractive().setVisible(false);
    }

    private handleBlockerPointerDown(): void {
        this.closeMenu();
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

    private getItemCount(menu: BridgeOfficerCommandMenuViewState): number {
        return menu.groups.reduce((total, group) => total + group.items.length, 0);
    }

    private getMinHeight(menu: BridgeOfficerCommandMenuViewState): number {
        let contentHeight = 0;

        menu.groups.forEach((group, groupIndex) => {
            if (groupIndex > 0) {
                contentHeight += OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginTop;
            }

            contentHeight +=
                OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.height + OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginBottom;

            contentHeight += group.items.length * OFFICER_CONTEXT_MENU_LAYOUT.item.height;

            contentHeight += Math.max(0, group.items.length - 1) * OFFICER_CONTEXT_MENU_LAYOUT.item.gap;
        });

        return (
            OFFICER_CONTEXT_MENU_LAYOUT.content.y + contentHeight + OFFICER_CONTEXT_MENU_LAYOUT.content.bottomPadding
        );
    }
}
