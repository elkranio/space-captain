import {
    BRIDGE_EQUIPMENT_PROGRESS_DIRECTION,
    type BridgeEquipmentProgressPresentation,
} from "./BridgeEquipmentProgressBarView";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

export const BRIDGE_EQUIPMENT_PROGRESS_PRESENTATION = {
    PREPARE: {
        color: CAPTAIN_DASHBOARD_STYLE.equipmentProgress.activityColor,
        direction: BRIDGE_EQUIPMENT_PROGRESS_DIRECTION.INCREASING,
    },
    ACTIVE: {
        color: CAPTAIN_DASHBOARD_STYLE.equipmentProgress.activeColor,
        direction: BRIDGE_EQUIPMENT_PROGRESS_DIRECTION.DECREASING,
    },
    COOLDOWN: {
        color: CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor,
        direction: BRIDGE_EQUIPMENT_PROGRESS_DIRECTION.INCREASING,
    },
    REPAIR: {
        color: CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor,
        direction: BRIDGE_EQUIPMENT_PROGRESS_DIRECTION.DECREASING,
    },
} as const satisfies Record<string, BridgeEquipmentProgressPresentation>;
