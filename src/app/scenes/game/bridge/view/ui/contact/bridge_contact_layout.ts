// src/app/scenes/game/bridge/view/ui/contact/bridge_contact_layout.ts

export const BRIDGE_CONTACT_LAYOUT = {
    panel: {
        x: 320,
        y: 404,
        width: 640,
        height: 307,
    },

    portrait: {
        x: 32,
        y: 40,

        image: {
            x: 80,
            y: 120,
            originX: 0.5,
            originY: 1,
        },

        nameLabel: {
            x: 84,
            y: 134,
            originX: 0.5,
            originY: 0,
        },
    },

    messages: {
        x: 224,
        y: 26,
        width: 374,
        height: 236,
        lineHeight: 18,
        gap: 4,
    },
} as const;
