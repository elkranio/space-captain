// src/engine/encounter/combat/defense/DefenseCapacitorRunner.ts

import {
    DEFENSE_CAPACITORS,
} from '../../../content/catalogs/defense_capacitors';
import type {
    DefenseCapacitorState,
} from '../../../defs/defense_capacitor';
import {
    ENCOUNTER_ACTOR_KIND,
} from '../../actors/encounter_actor';
import type {
    EncounterState,
} from '../../model/state';

// Один physical recharge rule для player/enemy installations.
//
// Charges восстанавливаются последовательно:
// 2/4 -> 3/4 -> 4/4.
// При полном capacitor progress всегда сбрасывается в 0.
export default class DefenseCapacitorRunner {
    constructor(
        private readonly state:
            EncounterState,
    ) {}

    public step(
        deltaMs: number,
    ): void {
        if (
            !Number.isFinite(deltaMs) ||
            deltaMs < 0
        ) {
            throw new Error(
                'Defense capacitor deltaMs must be non-negative: ' +
                    String(deltaMs),
            );
        }

        const playerCapacitor =
            this.state.combat
                .defenseCapacitor;

        if (playerCapacitor) {
            advanceDefenseCapacitor(
                playerCapacitor,
                deltaMs,
            );
        }

        for (
            const actor of
            this.state.actors
        ) {
            if (
                actor.kind !==
                ENCOUNTER_ACTOR_KIND.SHIP
            ) {
                continue;
            }

            if (!actor.defenseCapacitor) {
                continue;
            }

            advanceDefenseCapacitor(
                actor.defenseCapacitor,
                deltaMs,
            );
        }
    }
}

export function advanceDefenseCapacitor(
    capacitor:
        DefenseCapacitorState,
    deltaMs: number,
): void {
    const definition =
        DEFENSE_CAPACITORS[
            capacitor
                .defenseCapacitorId
        ];

    if (
        capacitor.charges >=
        definition.capacity
    ) {
        capacitor.charges =
            definition.capacity;

        capacitor.rechargeElapsedMs =
            0;

        return;
    }

    let elapsedMs =
        capacitor.rechargeElapsedMs +
        deltaMs;

    while (
        capacitor.charges <
            definition.capacity &&
        elapsedMs >=
            definition
                .rechargeDurationMs
    ) {
        capacitor.charges += 1;

        elapsedMs -=
            definition
                .rechargeDurationMs;
    }

    capacitor.rechargeElapsedMs =
        capacitor.charges >=
        definition.capacity
            ? 0
            : elapsedMs;
}
