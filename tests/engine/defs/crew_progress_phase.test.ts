// tests/engine/defs/crew_progress_phase.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    doesDefenseTurretPhaseAdvanceWithCrew,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    doesShipWeaponPhaseAdvanceWithCrew,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';

describe(
    'Crew-driven physical phase timing',
    () => {
        it(
            'classifies installed weapon phases',
            () => {
                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,
                        SHIP_WEAPON_PHASE
                            .TARGETING,
                    ),
                ).toBe(true);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,
                        SHIP_WEAPON_PHASE
                            .COOLDOWN,
                    ),
                ).toBe(false);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND.BEAM_CANNON,
                        SHIP_WEAPON_PHASE
                            .TARGETING,
                    ),
                ).toBe(false);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND.BEAM_CANNON,
                        SHIP_WEAPON_PHASE
                            .CHARGING,
                    ),
                ).toBe(true);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND.BEAM_CANNON,
                        SHIP_WEAPON_PHASE
                            .COOLDOWN,
                    ),
                ).toBe(false);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,
                        SHIP_WEAPON_PHASE
                            .TARGETING,
                    ),
                ).toBe(true);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,
                        SHIP_WEAPON_PHASE
                            .COOLDOWN,
                    ),
                ).toBe(false);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                        SHIP_WEAPON_PHASE
                            .TARGETING,
                    ),
                ).toBe(false);

                // Channeling still occupies Scientist, but its physical
                // lifetime advances in raw encounter time.
                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                        SHIP_WEAPON_PHASE
                            .CHANNELING,
                    ),
                ).toBe(false);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                        SHIP_WEAPON_PHASE
                            .COOLDOWN,
                    ),
                ).toBe(false);
            },
        );

        it(
            'classifies defense-turret phases',
            () => {
                expect(
                    doesDefenseTurretPhaseAdvanceWithCrew(
                        DEFENSE_TURRET_PHASE
                            .LOADING,
                    ),
                ).toBe(true);

                expect(
                    doesDefenseTurretPhaseAdvanceWithCrew(
                        DEFENSE_TURRET_PHASE
                            .READY,
                    ),
                ).toBe(false);

                expect(
                    doesDefenseTurretPhaseAdvanceWithCrew(
                        DEFENSE_TURRET_PHASE
                            .COOLDOWN,
                    ),
                ).toBe(false);
            },
        );
    },
);
