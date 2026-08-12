// src/app/scenes/game/bridge/view/combat/bridge_player_hull_combat_points.ts

import {
    BRIDGE_VIEWSCREEN_RECT,
} from '../bridge_viewscreen_layout';

const VIEWSCREEN_CENTER_X =
    Math.round(
        BRIDGE_VIEWSCREEN_RECT.x +
            BRIDGE_VIEWSCREEN_RECT.width /
                2,
    );

const VIEWSCREEN_BOTTOM_Y =
    BRIDGE_VIEWSCREEN_RECT.y +
    BRIDGE_VIEWSCREEN_RECT.height;

// Временные presentation points для whole-hull player target.
//
// Когда появится нормальный node targeting, этот seam должен
// разрастись в per-node points для player/enemy ships:
// - shieldAnchor;
// - shieldImpactPoint;
// - hullImpactPoint.
//
// Пока намеренно не строим общий registry раньше геймдизайна targeting.
export const BRIDGE_PLAYER_HULL_COMBAT_POINTS = {
    // Опускает existing center shield немного за нижнюю
    // границу viewscreen; bridge frame визуально его подрежет.
    shieldAnchor: {
        x:
            VIEWSCREEN_CENTER_X,

        y:
            VIEWSCREEN_BOTTOM_Y +
            22,
    },

    // Отдельная видимая точка блокировки:
    // чуть выше и левее hull impact, внутри center shield.
    shieldImpactPoint: {
        x:
            VIEWSCREEN_CENTER_X -
            55,

        y:
            VIEWSCREEN_BOTTOM_Y -
            58,
    },

    // Сохраняет старую геометрию обычного hull hit 1:1.
    hullImpactPoint: {
        x:
            VIEWSCREEN_CENTER_X,

        y:
            VIEWSCREEN_BOTTOM_Y -
            12,
    },
} as const;
