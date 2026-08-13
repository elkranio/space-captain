// src/engine/content/catalogs/ship_chassis.ts

import shipChassisTuningData from '../data/ship_chassis.json';
import {
    SHIP_CHASSIS_TUNING_SCHEMA,
} from '../schemas/ship_chassis';
import {
    type ShipChassisDefinition,
    type ShipChassisId,
} from '../../defs/ship_chassis';

const SHIP_CHASSIS_TUNING =
    SHIP_CHASSIS_TUNING_SCHEMA.parse(
        shipChassisTuningData,
    );

// Контентная база корпусов кораблей.
// Конкретная комплектация задаётся ShipPreset.
export const SHIP_CHASSIS =
    Object.fromEntries(
        Object.entries(
            SHIP_CHASSIS_TUNING,
        ).map(
            (
                [
                    id,
                    tuning,
                ],
            ) => {
                return [
                    id,
                    {
                        id,
                        ...tuning,
                    },
                ];
            },
        ),
    ) as Record<
        ShipChassisId,
        ShipChassisDefinition
    >;
