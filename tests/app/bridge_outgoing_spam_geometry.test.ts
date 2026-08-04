// tests/app/bridge_outgoing_spam_geometry.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    createTaperedBeamPolygon,
} from '../../src/app/scenes/game/bridge/view/combat/outgoing_spam/bridge_outgoing_spam_geometry';

describe(
    'Bridge outgoing spam geometry',
    () => {
        it(
            'keeps the player end narrow and expands only near the target',
            () => {
                expect(
                    createTaperedBeamPolygon(
                        {
                            x: 0,
                            y: 0,
                        },
                        {
                            x: 100,
                            y: 0,
                        },
                        2,
                        8,
                    ),
                ).toEqual([
                    {
                        x: 0,
                        y: -2,
                    },
                    {
                        x: 100,
                        y: -8,
                    },
                    {
                        x: 100,
                        y: 8,
                    },
                    {
                        x: 0,
                        y: 2,
                    },
                ]);
            },
        );

        it(
            'measures width perpendicular to a diagonal beam',
            () => {
                const polygon =
                    createTaperedBeamPolygon(
                        {
                            x: 10,
                            y: 20,
                        },
                        {
                            x: 70,
                            y: 100,
                        },
                        2,
                        7,
                    );

                const sourceWidth =
                    Math.hypot(
                        polygon[3].x -
                            polygon[0].x,

                        polygon[3].y -
                            polygon[0].y,
                    );

                const targetWidth =
                    Math.hypot(
                        polygon[2].x -
                            polygon[1].x,

                        polygon[2].y -
                            polygon[1].y,
                    );

                expect(sourceWidth).toBeCloseTo(
                    4,
                );

                expect(targetWidth).toBeCloseTo(
                    14,
                );
            },
        );
    },
);
