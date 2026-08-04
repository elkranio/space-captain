// tests/engine/defs/crew_progress_phase.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    doesPointDefensePhaseAdvanceWithCrew,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
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
                        SHIP_WEAPON_KIND.LASER,
                        SHIP_WEAPON_PHASE
                            .TARGETING,
                    ),
                ).toBe(true);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND.LASER,
                        SHIP_WEAPON_PHASE
                            .CHARGING,
                    ),
                ).toBe(true);

                expect(
                    doesShipWeaponPhaseAdvanceWithCrew(
                        SHIP_WEAPON_KIND.LASER,
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
                            .DISPENSING,
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
                ).toBe(true);

                // Channeling still occupies Science, but its physical
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
            'classifies point-defense phases',
            () => {
                expect(
                    doesPointDefensePhaseAdvanceWithCrew(
                        POINT_DEFENSE_PHASE
                            .LOADING,
                    ),
                ).toBe(true);

                expect(
                    doesPointDefensePhaseAdvanceWithCrew(
                        POINT_DEFENSE_PHASE
                            .READY,
                    ),
                ).toBe(false);

                expect(
                    doesPointDefensePhaseAdvanceWithCrew(
                        POINT_DEFENSE_PHASE
                            .COOLDOWN,
                    ),
                ).toBe(false);
            },
        );
    },
);
