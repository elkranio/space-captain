import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    formatCaptainDashboardCountdown,
} from '../../src/app/scenes/game/bridge/view/captain_dashboard/captain_dashboard_format';

describe(
    'captain dashboard countdown formatting',
    () => {
        it(
            'formats milliseconds as clamped one-decimal seconds',
            () => {
                expect(
                    formatCaptainDashboardCountdown(
                        1250,
                    ),
                ).toBe(
                    '1.3s',
                );

                expect(
                    formatCaptainDashboardCountdown(
                        0,
                    ),
                ).toBe(
                    '0.0s',
                );

                expect(
                    formatCaptainDashboardCountdown(
                        -250,
                    ),
                ).toBe(
                    '0.0s',
                );
            },
        );
    },
);
