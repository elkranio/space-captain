// src/app/scenes/game/overlay/events/game_overlay_event.ts

// Scene-local события постоянного game overlay.
//
// Это не глобальная шина приложения.
// Она связывает overlay views и GameOverlayController.
export const GAME_OVERLAY_EVENT = {
    LOCAL_SPACE_BUTTON_CLICKED: 'local_space_button_clicked',
    LOCAL_SPACE_PANEL_CLOSE_CLICKED: 'local_space_panel_close_clicked',
} as const;

export type GameOverlayEventPayloadMap = {
    [GAME_OVERLAY_EVENT.LOCAL_SPACE_BUTTON_CLICKED]: undefined;
    [GAME_OVERLAY_EVENT.LOCAL_SPACE_PANEL_CLOSE_CLICKED]: undefined;
};
