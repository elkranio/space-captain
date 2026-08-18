export function removeMissingCombatSnapshotEntries<TEntry>(
    entries: ReadonlyMap<string, TEntry>,
    updatedIds: Iterable<string>,
    removeEntry: (id: string, entry: TEntry) => void,
): void {
    const updatedIdSet = new Set(updatedIds);

    for (const [id, entry] of entries) {
        if (updatedIdSet.has(id)) {
            continue;
        }

        removeEntry(id, entry);
    }
}
