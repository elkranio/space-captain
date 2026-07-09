import P34TOptions from '../config/p34t.options';
import isMobile from 'is-mobile';

export default function enforceOrientation(): void {
    const orientation = P34TOptions.lockOrientation;
    if (!orientation || !isMobile({ tablet: true })) return;

    let turnOverlay = document.getElementById('turn') as HTMLDivElement;

    if (!turnOverlay) {
        turnOverlay = document.createElement('div');
        turnOverlay.id = 'turn';
        document.body.appendChild(turnOverlay);

        Object.assign(turnOverlay.style, {
            position: 'fixed',
            zIndex: '9999',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: `url(assets/images/boot/play_${orientation}.png) no-repeat center center`,
            backgroundSize: 'contain',
            backgroundColor: '#fff',
            display: 'none',
            pointerEvents: 'none',
        });
    }

    const checkOrientation = () => {
        const isPortrait = window.innerHeight > window.innerWidth;
        const shouldBePortrait = orientation === 'portrait';

        turnOverlay.style.display = isPortrait === shouldBePortrait ? 'none' : 'block';
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
}
