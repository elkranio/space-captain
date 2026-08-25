import './ship_slot_editor.css';

const SHIP_SLOT_COLUMN_COUNT = 4;
const SHIP_SLOT_DEFAULT_ROW_COUNT = 3;

const SHIP_SLOT_KIND = {
    DRIVE: 'drive',
    WEAPON: 'weapon',
    DEFENSE: 'defense',
    UTILITY: 'utility',
} as const;

type ShipSlotKind =
    (typeof SHIP_SLOT_KIND)[keyof typeof SHIP_SLOT_KIND];

type OptionalShipSlotKind =
    Exclude<ShipSlotKind, typeof SHIP_SLOT_KIND.DRIVE>;

type ShipSlotDraft = {
    id: string;
    kind: ShipSlotKind;
    column: number;
    row: number;
};

const OPTIONAL_SLOT_KINDS: OptionalShipSlotKind[] = [
    SHIP_SLOT_KIND.WEAPON,
    SHIP_SLOT_KIND.DEFENSE,
    SHIP_SLOT_KIND.UTILITY,
];

export function createDefaultShipSlots(): ShipSlotDraft[] {
    return [
        {
            id: 'drive',
            kind: SHIP_SLOT_KIND.DRIVE,
            column: 1,
            row: 2,
        },
    ];
}

export function createShipSlotsField(
    label: string,
    value: unknown,
    onChange: (slots: ShipSlotDraft[]) => void,
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'ship-slot-editor';

    const heading = document.createElement('div');
    heading.className = 'ship-slot-editor-heading';

    const title = document.createElement('div');
    title.className = 'ship-slot-editor-title';
    title.textContent = label;

    const description = document.createElement('div');
    description.className = 'ship-slot-editor-description';
    description.textContent =
        'Columns run stern → nose. Select a slot type, then click an empty cell. ' +
        'Drive can move, but cannot be removed.';

    heading.append(title, description);
    wrapper.appendChild(heading);

    const parsedSlots = parseShipSlots(value);

    if (!parsedSlots) {
        const error = document.createElement('div');
        error.className = 'ship-slot-editor-error';
        error.textContent = 'Slot data is malformed. Fix the chassis JSON before editing the layout.';
        wrapper.appendChild(error);

        return wrapper;
    }

    let slots = parsedSlots;
    let pendingKind: OptionalShipSlotKind | undefined;

    const toolbar = document.createElement('div');
    toolbar.className = 'ship-slot-toolbar';

    const grid = document.createElement('div');
    grid.className = 'ship-slot-grid';

    function commit(nextSlots: ShipSlotDraft[]): void {
        slots = nextSlots;
        onChange(
            slots.map((slot) => {
                return { ...slot };
            }),
        );
        renderToolbar();
        renderGrid();
    }

    function renderToolbar(): void {
        toolbar.replaceChildren();

        const labelElement = document.createElement('span');
        labelElement.className = 'ship-slot-toolbar-label';
        labelElement.textContent = 'Add slot:';
        toolbar.appendChild(labelElement);

        for (const kind of OPTIONAL_SLOT_KINDS) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'ship-slot-kind-button';
            button.textContent = kind.toUpperCase();
            button.classList.toggle('is-active', pendingKind === kind);

            button.addEventListener('click', () => {
                pendingKind = pendingKind === kind ? undefined : kind;
                renderToolbar();
                renderGrid();
            });

            toolbar.appendChild(button);
        }

        if (pendingKind) {
            const hint = document.createElement('span');
            hint.className = 'ship-slot-toolbar-hint';
            hint.textContent = 'Choose an empty cell';
            toolbar.appendChild(hint);
        }
    }

    function renderGrid(): void {
        grid.replaceChildren();

        const rowCount = getVisibleRowCount(slots);

        const corner = document.createElement('div');
        corner.className = 'ship-slot-grid-corner';
        grid.appendChild(corner);

        for (let column = 1; column <= SHIP_SLOT_COLUMN_COUNT; column += 1) {
            const header = document.createElement('div');
            header.className = 'ship-slot-column-label';

            if (column === 1) {
                header.textContent = '1 · STERN';
            } else if (column === SHIP_SLOT_COLUMN_COUNT) {
                header.textContent = String(column) + ' · NOSE';
            } else {
                header.textContent = String(column);
            }

            grid.appendChild(header);
        }

        for (let row = 1; row <= rowCount; row += 1) {
            const rowLabel = document.createElement('div');
            rowLabel.className = 'ship-slot-row-label';
            rowLabel.textContent = String(row);
            grid.appendChild(rowLabel);

            for (let column = 1; column <= SHIP_SLOT_COLUMN_COUNT; column += 1) {
                const slot = slots.find((candidate) => {
                    return candidate.column === column && candidate.row === row;
                });

                grid.appendChild(
                    slot
                        ? createOccupiedCell(slot, rowCount)
                        : createEmptyCell(column, row),
                );
            }
        }
    }

    function createEmptyCell(column: number, row: number): HTMLElement {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'ship-slot-cell ship-slot-cell-empty';
        cell.disabled = pendingKind === undefined;
        cell.textContent = pendingKind ? '+ ' + pendingKind.toUpperCase() : 'EMPTY';

        cell.addEventListener('click', () => {
            if (!pendingKind) {
                return;
            }

            const kind = pendingKind;
            pendingKind = undefined;

            commit([
                ...slots,
                {
                    id: createNextSlotId(slots, kind),
                    kind,
                    column,
                    row,
                },
            ]);
        });

        return cell;
    }

    function createOccupiedCell(slot: ShipSlotDraft, rowCount: number): HTMLElement {
        const cell = document.createElement('div');
        cell.className = 'ship-slot-cell ship-slot-cell-occupied kind-' + slot.kind;

        const slotKind = document.createElement('div');
        slotKind.className = 'ship-slot-kind';
        slotKind.textContent = slot.kind.toUpperCase();

        const slotId = document.createElement('code');
        slotId.className = 'ship-slot-id';
        slotId.textContent = slot.id;

        const moveControls = document.createElement('div');
        moveControls.className = 'ship-slot-move-controls';

        moveControls.append(
            createMoveButton(slot, '←', -1, 0, rowCount),
            createMoveButton(slot, '↑', 0, -1, rowCount),
            createMoveButton(slot, '↓', 0, 1, rowCount),
            createMoveButton(slot, '→', 1, 0, rowCount),
        );

        cell.append(slotKind, slotId, moveControls);

        if (slot.kind !== SHIP_SLOT_KIND.DRIVE) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'ship-slot-remove-button';
            removeButton.textContent = 'REMOVE';

            removeButton.addEventListener('click', () => {
                commit(
                    slots.filter((candidate) => {
                        return candidate.id !== slot.id;
                    }),
                );
            });

            cell.appendChild(removeButton);
        }

        return cell;
    }

    function createMoveButton(
        slot: ShipSlotDraft,
        text: string,
        columnDelta: number,
        rowDelta: number,
        rowCount: number,
    ): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ship-slot-move-button';
        button.textContent = text;

        const nextColumn = slot.column + columnDelta;
        const nextRow = slot.row + rowDelta;

        button.disabled = !canMoveTo(slots, nextColumn, nextRow, rowCount);

        button.addEventListener('click', () => {
            if (button.disabled) {
                return;
            }

            commit(
                slots.map((candidate) => {
                    if (candidate.id !== slot.id) {
                        return candidate;
                    }

                    return {
                        ...candidate,
                        column: nextColumn,
                        row: nextRow,
                    };
                }),
            );
        });

        return button;
    }

    wrapper.append(toolbar, grid);
    renderToolbar();
    renderGrid();

    return wrapper;
}

function parseShipSlots(value: unknown): ShipSlotDraft[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const slots: ShipSlotDraft[] = [];

    for (const candidate of value) {
        if (!isShipSlotDraft(candidate)) {
            return undefined;
        }

        slots.push({ ...candidate });
    }

    return slots;
}

function isShipSlotDraft(value: unknown): value is ShipSlotDraft {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.id === 'string' &&
        isShipSlotKind(candidate.kind) &&
        Number.isInteger(candidate.column) &&
        typeof candidate.column === 'number' &&
        candidate.column >= 1 &&
        candidate.column <= SHIP_SLOT_COLUMN_COUNT &&
        Number.isInteger(candidate.row) &&
        typeof candidate.row === 'number' &&
        candidate.row >= 1
    );
}

function isShipSlotKind(value: unknown): value is ShipSlotKind {
    return (
        value === SHIP_SLOT_KIND.DRIVE ||
        value === SHIP_SLOT_KIND.WEAPON ||
        value === SHIP_SLOT_KIND.DEFENSE ||
        value === SHIP_SLOT_KIND.UTILITY
    );
}

function getVisibleRowCount(slots: ShipSlotDraft[]): number {
    return slots.reduce((rowCount, slot) => {
        return Math.max(rowCount, slot.row);
    }, SHIP_SLOT_DEFAULT_ROW_COUNT);
}

function canMoveTo(
    slots: ShipSlotDraft[],
    column: number,
    row: number,
    rowCount: number,
): boolean {
    if (
        column < 1 ||
        column > SHIP_SLOT_COLUMN_COUNT ||
        row < 1 ||
        row > rowCount
    ) {
        return false;
    }

    return !slots.some((slot) => {
        return slot.column === column && slot.row === row;
    });
}

function createNextSlotId(slots: ShipSlotDraft[], kind: OptionalShipSlotKind): string {
    const usedIds = new Set(
        slots.map((slot) => {
            return slot.id;
        }),
    );

    for (let index = 1; index <= 999; index += 1) {
        const id = kind + '_' + String(index).padStart(2, '0');

        if (!usedIds.has(id)) {
            return id;
        }
    }

    throw new Error('Unable to allocate ship slot id for kind: ' + kind);
}
