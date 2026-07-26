// src/engine/content/ships.ts

import { SHIP_ID, SHIP_SPRITE_ID, type ShipDefinition, type ShipId } from '../defs/ship';

// Контентная база типов кораблей.
// Runtime-состояние конкретного корабля должно ссылаться на эти definition id.
export const SHIPS = {
    [SHIP_ID.GENERIC_00]: {
        id: SHIP_ID.GENERIC_00,
        name: 'Our test ship',
        spriteId: SHIP_SPRITE_ID.GENERIC_00,
    },
} satisfies Record<ShipId, ShipDefinition>;
