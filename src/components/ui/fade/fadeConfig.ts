export interface FadeConfig {
    color: number;
    alpha: number;
    showDuration: number;
    hideDuration: number;
}

export const DEFAULT_FADE_CONFIG: FadeConfig = {
    color: 0x000000,
    alpha: 0.85,
    showDuration: 250,
    hideDuration: 250,
};
