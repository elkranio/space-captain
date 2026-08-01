// src/engine/content/catalogs/ship_chassis.ts

import {
    SHIP_CHASSIS_ID,
    SHIP_SPRITE_ID,
    type ShipChassisDefinition,
    type ShipChassisId,
} from '../../defs/ship_chassis';

// Контентная база корпусов кораблей.
// Конкретная комплектация задаётся ShipPreset.
export const SHIP_CHASSIS = {
    [SHIP_CHASSIS_ID.GENERIC_00]: {
        id: SHIP_CHASSIS_ID.GENERIC_00,

        name: 'Our test ship',
        spriteId: SHIP_SPRITE_ID.GENERIC_00,

        maxHull: 3,
    },
} satisfies Record<
    ShipChassisId,
    ShipChassisDefinition
>;
