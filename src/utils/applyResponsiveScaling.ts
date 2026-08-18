import isMobile from "is-mobile";
import P34TOptions from "../config/p34t.options";

export default function applyResponsiveScaling(config: Phaser.Types.Core.GameConfig): void {
    const { mobile, desktop } = P34TOptions.responsive;

    const useResponsive = (mobile && isMobile({ tablet: true })) || (desktop && !isMobile({ tablet: true }));

    if (!useResponsive) return;

    const baseWidth = config.width as number;
    const baseHeight = config.height as number;
    const baseAspect = baseWidth / baseHeight;

    const deviceWidth = window.innerWidth * window.devicePixelRatio;
    const deviceHeight = window.innerHeight * window.devicePixelRatio;
    const deviceAspect = deviceWidth / deviceHeight;

    if (deviceAspect > baseAspect) {
        config.width = baseHeight * deviceAspect;
    } else {
        config.height = baseWidth / deviceAspect;
    }
}
