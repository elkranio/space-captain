// src\engine\content\ships.ts
import { SHIP, SHIP_SPRITE, type ShipDefinition, type ShipId } from '../defs/ship';

export const SHIPS = {
    [SHIP.KRELBOID_PIRATE_00]: {
        id: SHIP.KRELBOID_PIRATE_00,
        name: 'Krelboid Toll Pirate',
        sprite: SHIP_SPRITE.KRELBOID_PIRATE_00,
    },
} satisfies Record<ShipId, ShipDefinition>;
