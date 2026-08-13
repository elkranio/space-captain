// src/engine/content/catalogs/ship_chassis.ts

import shipChassisTuningData from '../data/ship_chassis.json';
import {
    SHIP_CHASSIS_TUNING_SCHEMA,
} from '../schemas/ship_chassis';
import {
    SHIP_CHASSIS_ID,
    type ShipChassisDefinition,
    type ShipChassisId,
} from '../../defs/ship_chassis';

const SHIP_CHASSIS_TUNING =
    SHIP_CHASSIS_TUNING_SCHEMA.parse(
        shipChassisTuningData,
    );

// Контентная база корпусов кораблей.
// Конкретная комплектация задаётся ShipPreset.
export const SHIP_CHASSIS = {
    [SHIP_CHASSIS_ID.GENERIC_00]: {
        id:
            SHIP_CHASSIS_ID.GENERIC_00,

        ...SHIP_CHASSIS_TUNING[
            SHIP_CHASSIS_ID.GENERIC_00
        ],
    },
} satisfies Record<
    ShipChassisId,
    ShipChassisDefinition
>;
