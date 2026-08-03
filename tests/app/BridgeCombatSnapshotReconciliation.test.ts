import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    removeMissingCombatSnapshotEntries,
} from '../../src/app/scenes/game/bridge/view/combat/remove_missing_combat_snapshot_entries';

describe('Bridge combat snapshot reconciliation', () => {
    it('removes entries missing from the latest full snapshot', () => {
        const entries = new Map([
            [
                'kept',
                {
                    value: 1,
                },
            ],
            [
                'removed',
                {
                    value: 2,
                },
            ],
        ]);

        const removeEntry = vi.fn(
            (id: string) => {
                entries.delete(id);
            },
        );

        removeMissingCombatSnapshotEntries(
            entries,
            ['kept'],
            removeEntry,
        );

        expect(removeEntry)
            .toHaveBeenCalledTimes(1);

        expect(removeEntry)
            .toHaveBeenCalledWith(
                'removed',
                {
                    value: 2,
                },
            );

        expect([...entries.keys()])
            .toEqual(['kept']);
    });

    it('removes every entry for an empty snapshot', () => {
        const entries = new Map([
            ['first', 1],
            ['second', 2],
        ]);

        removeMissingCombatSnapshotEntries(
            entries,
            [],
            (id) => {
                entries.delete(id);
            },
        );

        expect(entries.size).toBe(0);
    });
});
