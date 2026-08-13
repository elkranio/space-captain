// src/engine/content/catalogs/defense_turrets.ts

import defenseTurretTuningData from '../data/defense_turrets.json';
import {
    DEFENSE_TURRET_TUNING_SCHEMA,
} from '../schemas/defense_turrets';
import {
    type DefenseTurretDefinition,
    type DefenseTurretId,
} from '../../defs/defense_turret';

const DEFENSE_TURRET_TUNING =
    DEFENSE_TURRET_TUNING_SCHEMA.parse(
        defenseTurretTuningData,
    );

export const DEFENSE_TURRETS =
    Object.fromEntries(
        Object.entries(
            DEFENSE_TURRET_TUNING,
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
        DefenseTurretId,
        DefenseTurretDefinition
    >;
