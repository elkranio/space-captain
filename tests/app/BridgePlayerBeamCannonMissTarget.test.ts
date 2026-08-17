import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    getPlayerBeamCannonMissTarget,
    getRandomPlayerBeamCannonMissSide,
    PLAYER_BEAM_CANNON_MISS_SIDE,
} from '../../src/app/scenes/game/bridge/view/combat/player_beam_cannon/bridge_player_beam_cannon_miss_target';

function getLineXAtY({
    sourceX,
    sourceY,
    targetX,
    targetY,
    y,
}: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    y: number;
}): number {
    const progress =
        (y - sourceY) /
        (targetY - sourceY);

    return (
        sourceX +
        (targetX - sourceX) *
            progress
    );
}

describe(
    'player Beam Cannon Evade miss target',
    () => {
        it(
            'passes through a left lane closer to ship center when the enemy Evaded right and exits the viewport',
            () => {
                const result =
                    getPlayerBeamCannonMissTarget({
                        sourceX:
                            736,

                        sourceY:
                            518,

                        missSide:
                            PLAYER_BEAM_CANNON_MISS_SIDE
                                .LEFT,

                        presentedTargetLeft:
                            900,

                        presentedTargetRight:
                            1040,

                        presentedTargetCenterX:
                            1001,

                        presentedTargetCenterY:
                            280,

                        viewportWidth:
                            1280,

                        viewportHeight:
                            720,
                    });

                const xAtShipCenter =
                    getLineXAtY({
                        sourceX:
                            736,

                        sourceY:
                            518,

                        targetX:
                            result.x,

                        targetY:
                            result.y,

                        y:
                            280,
                    });

                expect(
                    xAtShipCenter,
                ).toBeCloseTo(
                    1001 - 48,
                    6,
                );

                expect(
                    result
                        .perspectiveX,
                ).toBeCloseTo(
                    1001 - 48,
                    6,
                );

                expect(
                    result
                        .perspectiveY,
                ).toBeCloseTo(
                    280,
                    6,
                );

                expect(
                    result.x < 0 ||
                    result.x > 1280 ||
                    result.y < 0 ||
                    result.y > 720,
                ).toBe(
                    true,
                );
            },
        );

        it(
            'passes through a right lane closer to ship center when the enemy Evaded left and exits the viewport',
            () => {
                const result =
                    getPlayerBeamCannonMissTarget({
                        sourceX:
                            736,

                        sourceY:
                            518,

                        missSide:
                            PLAYER_BEAM_CANNON_MISS_SIDE
                                .RIGHT,

                        presentedTargetLeft:
                            886,

                        presentedTargetRight:
                            1026,

                        presentedTargetCenterX:
                            973,

                        presentedTargetCenterY:
                            280,

                        viewportWidth:
                            1280,

                        viewportHeight:
                            720,
                    });

                const xAtShipCenter =
                    getLineXAtY({
                        sourceX:
                            736,

                        sourceY:
                            518,

                        targetX:
                            result.x,

                        targetY:
                            result.y,

                        y:
                            280,
                    });

                expect(
                    xAtShipCenter,
                ).toBeCloseTo(
                    973 + 48,
                    6,
                );

                expect(
                    result
                        .perspectiveX,
                ).toBeCloseTo(
                    973 + 48,
                    6,
                );

                expect(
                    result
                        .perspectiveY,
                ).toBeCloseTo(
                    280,
                    6,
                );

                expect(
                    result.x < 0 ||
                    result.x > 1280 ||
                    result.y < 0 ||
                    result.y > 720,
                ).toBe(
                    true,
                );
            },
        );

        it(
            'chooses left below 0.5 and right at or above 0.5',
            () => {
                expect(
                    getRandomPlayerBeamCannonMissSide(
                        () => 0.49,
                    ),
                ).toBe(
                    PLAYER_BEAM_CANNON_MISS_SIDE
                        .LEFT,
                );

                expect(
                    getRandomPlayerBeamCannonMissSide(
                        () => 0.5,
                    ),
                ).toBe(
                    PLAYER_BEAM_CANNON_MISS_SIDE
                        .RIGHT,
                );
            },
        );
    },
);
