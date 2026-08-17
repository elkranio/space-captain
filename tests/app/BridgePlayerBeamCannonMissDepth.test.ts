import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    shouldRenderPlayerBeamMissBehindTarget,
} from '../../src/app/scenes/game/bridge/view/combat/player_beam_cannon/bridge_player_beam_cannon_miss_depth';

describe(
    'player Beam Cannon Evade miss depth',
    () => {
        it(
            'renders a Beam left of the presented enemy behind the ship',
            () => {
                expect(
                    shouldRenderPlayerBeamMissBehindTarget(
                        500,
                        514,
                    ),
                ).toBe(
                    true,
                );
            },
        );

        it(
            'renders a Beam right of the presented enemy in front of the ship',
            () => {
                expect(
                    shouldRenderPlayerBeamMissBehindTarget(
                        514,
                        500,
                    ),
                ).toBe(
                    false,
                );
            },
        );
    },
);
