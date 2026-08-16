import {
    DEFENSE_TURRETS,
} from '../../../content/catalogs/defense_turrets';
import {
    advanceDefenseTurretCooldown,
} from '../../../defs/defense_turret';
import type {
    EncounterState,
} from '../../model/state';

// Player Defense Turret aiming is owned by the Weapons officer task.
// This runner owns only the independent installed-system recovery clock.
export default class PlayerDefenseTurretRunner {
    constructor(
        private readonly state:
            EncounterState,
    ) {}

    public step(
        deltaMs: number,
    ): void {
        const defenseTurret =
            this.state.combat
                .defenseTurret;

        if (!defenseTurret) {
            return;
        }

        const definition =
            DEFENSE_TURRETS[
                defenseTurret
                    .defenseTurretId
            ];

        advanceDefenseTurretCooldown(
            defenseTurret,
            definition.cooldownDurationMs,
            deltaMs,
        );
    }
}
