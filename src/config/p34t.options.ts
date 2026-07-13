// src/config/p34t.options.ts
const P34TOptions = {
    // HTML page title
    title: 'Overhype Phaser 3 Framework v4T',

    // should the game take all available space?
    responsive: {
        mobile: true,
        desktop: false,
    },

    // show an image telling the user to use a specific mode?
    lockOrientation: 'portrait' as 'portrait' | 'landscape' | false,

    // for local storage purposes
    prefix: 'p34t_',

    // fonts to load (need to render bitmapfonts with these names)
    fonts: ['roboto', 'fira_medium', 'vga_8x14'],

    // base max volume for sfx and music (can be overriden)
    audio: {
        sfxMaxVolume: 1.0,
        musicMaxVolume: 0.5,
    },
};

export default P34TOptions;
