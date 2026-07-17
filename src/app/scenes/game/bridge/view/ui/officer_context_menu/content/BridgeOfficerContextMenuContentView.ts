// src/app/scenes/game/bridge/view/ui/officer_context_menu/content/BridgeOfficerContextMenuContentView.ts

import type BridgeScene from '../../../../BridgeScene';
import type {
    BridgeOfficerCommandMenuGroupPayload,
    BridgeOfficerCommandMenuItemPayload,
} from '../../../../events/bridge_event';
import { UI_EVENT } from '../../ui_event';
import { OFFICER_CONTEXT_MENU_LAYOUT } from '../bridge_officer_context_menu_layout';
import BridgeOfficerContextMenuGroupLabelView from '../group_label/BridgeOfficerContextMenuGroupLabelView';
import BridgeOfficerContextMenuItemView from '../item/BridgeOfficerContextMenuItemView';

// Content-view officer context menu.
// Владеет group labels, item views и layout-ом списка команд.
export default class BridgeOfficerContextMenuContentView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly itemViews: BridgeOfficerContextMenuItemView[] = [];
    private readonly groupLabelViews: BridgeOfficerContextMenuGroupLabelView[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
    }

    public destroy(): void {
        this.clear();
        this.root.destroy(false);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public render(groups: BridgeOfficerCommandMenuGroupPayload[]): void {
        this.clear();

        let cursorY: number = OFFICER_CONTEXT_MENU_LAYOUT.content.y;

        groups.forEach((group, groupIndex) => {
            cursorY = this.renderGroup(group, groupIndex, cursorY);
        });
    }

    public clear(): void {
        for (const itemView of this.itemViews) {
            itemView.getRoot().off(UI_EVENT.CLICK, this.handleItemSelected, this);
            itemView.destroy();
        }

        this.itemViews.length = 0;

        for (const groupLabelView of this.groupLabelViews) {
            groupLabelView.destroy();
        }

        this.groupLabelViews.length = 0;
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
        const groupLabelView = new BridgeOfficerContextMenuGroupLabelView(this.scene, label);

        groupLabelView.setY(y);

        this.root.add(groupLabelView.getRoot());
        this.groupLabelViews.push(groupLabelView);
    }

    private renderItem(item: BridgeOfficerCommandMenuItemPayload, y: number): number {
        const itemView = new BridgeOfficerContextMenuItemView(this.scene, item);

        itemView.getRoot().on(UI_EVENT.CLICK, this.handleItemSelected, this);
        itemView.setPosition(OFFICER_CONTEXT_MENU_LAYOUT.item.x, y);

        this.root.add(itemView.getRoot());
        this.itemViews.push(itemView);

        return y + this.getItemStepY();
    }

    private handleItemSelected(item: BridgeOfficerCommandMenuItemPayload): void {
        this.root.emit(UI_EVENT.CLICK, item);
    }

    private getItemStepY(): number {
        return OFFICER_CONTEXT_MENU_LAYOUT.item.height + OFFICER_CONTEXT_MENU_LAYOUT.item.gap;
    }
}
