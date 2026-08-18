// src/app/scenes/game/bridge/view/ui/officer_context_menu/height/get_officer_context_menu_min_height.ts

import type { BridgeOfficerCommandMenuUpdatedPayload } from "../../../../events/bridge_event";
import { OFFICER_CONTEXT_MENU_LAYOUT } from "../bridge_officer_context_menu_layout";

// Pure layout helper для officer context menu.
// Считает высоту panel по группам/items без доступа к Phaser view state.
export function getOfficerContextMenuMinHeight(menu: BridgeOfficerCommandMenuUpdatedPayload): number {
    let contentHeight = 0;

    menu.groups.forEach((group, groupIndex) => {
        if (groupIndex > 0) {
            contentHeight += OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginTop;
        }

        contentHeight +=
            OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.height + OFFICER_CONTEXT_MENU_LAYOUT.groupLabel.marginBottom;
        contentHeight += getItemsHeight(group.items.length);
    });

    return OFFICER_CONTEXT_MENU_LAYOUT.content.y + contentHeight + OFFICER_CONTEXT_MENU_LAYOUT.content.bottomPadding;
}

export function getOfficerContextMenuItemCount(menu: BridgeOfficerCommandMenuUpdatedPayload): number {
    return menu.groups.reduce((total, group) => total + group.items.length, 0);
}

function getItemsHeight(itemCount: number): number {
    if (itemCount === 0) {
        return 0;
    }

    return (
        itemCount * OFFICER_CONTEXT_MENU_LAYOUT.item.height +
        Math.max(0, itemCount - 1) * OFFICER_CONTEXT_MENU_LAYOUT.item.gap
    );
}
