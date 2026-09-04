import { defineConfig } from 'vitest/config';

const scenarioTests = [
    'tests/app/**/*.test.ts',
    'tests/engine/encounter/**/*.test.ts',
    'tests/engine/defs/**/*.test.ts',
];

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'scenarios',
                    include: scenarioTests,
                    setupFiles: ['tests/fixtures/scenario_content.setup.ts'],
                },
            },
            {
                test: {
                    name: 'live-content',
                    include: ['tests/**/*.test.ts'],
                    exclude: scenarioTests,
                },
            },
        ],
    },
});
