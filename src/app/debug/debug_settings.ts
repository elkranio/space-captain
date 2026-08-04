// src/app/debug/debug_settings.ts
export type DebugSettings = {
    bridge: {
        encounter: {
            skipArrival: boolean;
            skipDockingAnimation: boolean;

            showEnemyDebugPanel: boolean;
        };
        officerCommands: {
            showCommandBark: boolean;
            commandBarkText: string;
        };
        officerTasks: {
            completeTimedTasksImmediately: boolean;
        };
    };
};

// Единая точка ручных debug-флагов app-слоя.
// Engine не должен импортить этот файл напрямую: debug-настройки применяет controller/app layer.
export const DEBUG_SETTINGS: DebugSettings = {
    bridge: {
        encounter: {
            skipArrival: false,
            skipDockingAnimation: false,

            showEnemyDebugPanel: true,
        },
        officerCommands: {
            showCommandBark: true,
            commandBarkText: 'AYE, CAPTAIN.',
        },
        officerTasks: {
            completeTimedTasksImmediately: false,
        },
    },
};
