// tests/engine/content/crew_actions.test.ts

import { describe, expect, it } from 'vitest';
import crewActionsData from '../../../src/engine/content/data/crew_actions.json';
import { CREW_ACTIONS } from '../../../src/engine/content/catalogs/crew_actions';
import { CREW_ACTIONS_SCHEMA } from '../../../src/engine/content/schemas/crew_actions';

describe('Crew action content', () => {
    it('keeps standalone crew-action durations in one canonical catalog', () => {
        expect(CREW_ACTIONS).toEqual(crewActionsData);
        expect(CREW_ACTIONS.scientist_plot_course.durationMs).toBe(5000);
        expect(CREW_ACTIONS.scientist_purge_spam.durationMs).toBe(5000);
        expect(CREW_ACTIONS.clear_sticky_mine.durationMs).toBe(3000);
    });

    it('rejects labels and other task presentation fields', () => {
        const invalid = {
            ...crewActionsData,

            scientist_plot_course: {
                ...crewActionsData.scientist_plot_course,
                label: 'PLOT COURSE',
            },
        };

        expect(CREW_ACTIONS_SCHEMA.safeParse(invalid).success).toBe(false);
    });

    it('rejects missing actions and negative durations', () => {
        const missingAction: Record<string, unknown> = {
            ...crewActionsData,
        };

        delete missingAction.clear_sticky_mine;

        expect(CREW_ACTIONS_SCHEMA.safeParse(missingAction).success).toBe(false);
        expect(CREW_ACTIONS_SCHEMA.safeParse({
            ...crewActionsData,
            clear_sticky_mine: {
                durationMs: -1,
            },
        }).success).toBe(false);
    });
});
