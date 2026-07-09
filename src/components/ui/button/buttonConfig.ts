export interface ButtonConfig {
    bg?: {
        width: number;
        height: number;
        color: number;
    };
    label: {
        font: string;
        size: number;
        color: number;
        text: string;
    };
}

export const DEFAULT_BUTTON_CONFIG: Required<ButtonConfig> = {
    bg: {
        width: 200,
        height: 60,
        color: 0xf39c12,
    },
    label: {
        font: 'fira_medium',
        size: 28,
        color: 0xd35400,
        text: 'Button',
    },
};
