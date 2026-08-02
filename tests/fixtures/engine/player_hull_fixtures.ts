// tests/fixtures/engine/player_hull_fixtures.ts

import type {
    PlayerHullState,
} from '../../../src/engine/defs/player';

export function createPlayerHullFixture(
    hull = 3,
    maxHull = 3,
): PlayerHullState {
    return {
        hull,
        maxHull,
    };
}
