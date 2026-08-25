import './debug_start_loadout_editor.css';

const COLUMN_COUNT = 4;
const MIN_ROW_COUNT = 3;

const EQUIPMENT_TYPE = {
    DRIVE: 'drive',
    DEFENSE_TURRET: 'defense_turret',
    SHIELD_GENERATOR: 'shield_generator',
    WEAPON: 'weapon',
} as const;

const SLOT_KIND = {
    DRIVE: 'drive',
    WEAPON: 'weapon',
    DEFENSE: 'defense',
    UTILITY: 'utility',
} as const;

type EquipmentType =
    (typeof EQUIPMENT_TYPE)[keyof typeof EQUIPMENT_TYPE];

type SlotKind =
    (typeof SLOT_KIND)[keyof typeof SLOT_KIND];

type Slot = {
    id: string;
    kind: SlotKind;
    column: number;
    row: number;
};

export type DebugStartEquipmentMount = {
    slotId: string;
    type: EquipmentType;
    equipmentId: string;
};

type ContentRecord =
    Record<string, unknown>;

type ContentCollectionPayload = {
    data: Record<string, ContentRecord>;
};

type EquipmentSource = {
    collectionId: string;
    type: EquipmentType;
    slotKind: SlotKind;
    prefix: string;
};

type EquipmentOption =
    EquipmentSource & {
        key: string;
        equipmentId: string;
        label: string;
    };

type LoadoutContext = {
    slots: Slot[];
    options: EquipmentOption[];
};

const SOURCES: EquipmentSource[] = [
    {
        collectionId:
            'ship_drives',
        type:
            EQUIPMENT_TYPE.DRIVE,
        slotKind:
            SLOT_KIND.DRIVE,
        prefix: 'Drive',
    },
    {
        collectionId:
            'defense_turrets',
        type:
            EQUIPMENT_TYPE.DEFENSE_TURRET,
        slotKind:
            SLOT_KIND.DEFENSE,
        prefix: 'Turret',
    },
    {
        collectionId:
            'shield_generators',
        type:
            EQUIPMENT_TYPE.SHIELD_GENERATOR,
        slotKind:
            SLOT_KIND.DEFENSE,
        prefix: 'Shield',
    },
    {
        collectionId:
            'missile_launchers',
        type:
            EQUIPMENT_TYPE.WEAPON,
        slotKind:
            SLOT_KIND.WEAPON,
        prefix: 'Missile',
    },
    {
        collectionId:
            'beam_cannons',
        type:
            EQUIPMENT_TYPE.WEAPON,
        slotKind:
            SLOT_KIND.WEAPON,
        prefix: 'Beam',
    },
    {
        collectionId:
            'sticky_mine_dispensers',
        type:
            EQUIPMENT_TYPE.WEAPON,
        slotKind:
            SLOT_KIND.WEAPON,
        prefix: 'Mine',
    },
    {
        collectionId:
            'spam_projectors',
        type:
            EQUIPMENT_TYPE.WEAPON,
        slotKind:
            SLOT_KIND.UTILITY,
        prefix: 'SPAM',
    },
];

export function createDebugStartEquipmentField(
    label: string,
    chassisId: string,
    value: unknown,
    onChange:
        (
            equipment:
                DebugStartEquipmentMount[],
        ) => void,
): HTMLElement {
    const wrapper =
        document.createElement(
            'div',
        );

    wrapper.className =
        'field-row debug-loadout-field';

    const heading =
        document.createElement(
            'div',
        );

    heading.className =
        'field-label debug-loadout-label';
    heading.textContent =
        label;

    const control =
        document.createElement(
            'div',
        );

    control.className =
        'debug-loadout-control is-loading';
    control.textContent =
        'Loading chassis and equipment…';

    wrapper.append(
        heading,
        control,
    );

    const equipment =
        parseEquipment(
            value,
        );

    if (!equipment) {
        renderError(
            control,
            (
                'Equipment must be an array of ' +
                'slot/type/equipmentId records.'
            ),
        );

        return wrapper;
    }

    void loadContext(
        chassisId,
    )
        .then(
            (context) => {
                control.classList
                    .remove(
                        'is-loading',
                    );

                renderLoadout(
                    control,
                    context,
                    equipment,
                    onChange,
                );
            },
        )
        .catch(
            (error) => {
                renderError(
                    control,
                    getErrorMessage(
                        error,
                    ),
                );
            },
        );

    return wrapper;
}

async function loadContext(
    chassisId: string,
): Promise<LoadoutContext> {
    if (
        chassisId.length === 0
    ) {
        throw new Error(
            'Select a chassis before editing equipment.',
        );
    }

    const [
        chassisCollection,
        ...equipmentCollections
    ] = await Promise.all([
        loadCollection(
            'ship_chassis',
        ),
        ...SOURCES.map(
            (source) => {
                return loadCollection(
                    source.collectionId,
                );
            },
        ),
    ]);

    const chassis =
        chassisCollection
            .data[chassisId];

    if (!chassis) {
        throw new Error(
            (
                'Chassis "' +
                chassisId +
                '" is missing.'
            ),
        );
    }

    const slots =
        parseSlots(
            chassis.slots,
        );

    if (!slots) {
        throw new Error(
            (
                'Chassis "' +
                chassisId +
                '" has invalid slot data.'
            ),
        );
    }

    const options =
        SOURCES.flatMap(
            (
                source,
                index,
            ) => {
                const sourceCollection =
                    equipmentCollections[
                        index
                    ];

                if (
                    !sourceCollection
                ) {
                    return [];
                }

                return createOptions(
                    sourceCollection.data,
                    source,
                );
            },
        );

    return {
        slots,
        options,
    };
}

function renderLoadout(
    control: HTMLElement,
    context: LoadoutContext,
    initialEquipment:
        DebugStartEquipmentMount[],
    onChange:
        (
            equipment:
                DebugStartEquipmentMount[],
        ) => void,
): void {
    let equipment =
        initialEquipment.map(
            (mount) => {
                return {
                    ...mount,
                };
            },
        );

    const render = (): void => {
        control.replaceChildren();

        const invalid =
            findInvalidMounts(
                context,
                equipment,
            );

        if (
            invalid.length > 0
        ) {
            const warning =
                document.createElement(
                    'div',
                );

            warning.className =
                'debug-loadout-warning';

            warning.textContent =
                (
                    'Invalid or orphaned mounts: ' +
                    invalid
                        .map(
                            (mount) => {
                                return (
                                    mount.slotId +
                                    ' → ' +
                                    mount.equipmentId
                                );
                            },
                        )
                        .join(', ')
                );

            control.appendChild(
                warning,
            );
        }

        control.appendChild(
            createGrid(
                context,
                equipment,
                (
                    slot,
                    option,
                ) => {
                    equipment =
                        replaceSlotEquipment(
                            context.slots,
                            equipment,
                            slot,
                            option,
                        );

                    onChange(
                        equipment.map(
                            (mount) => {
                                return {
                                    ...mount,
                                };
                            },
                        ),
                    );

                    render();
                },
            ),
        );
    };

    render();
}

function createGrid(
    context: LoadoutContext,
    equipment:
        DebugStartEquipmentMount[],
    onSelect:
        (
            slot: Slot,
            option:
                EquipmentOption |
                undefined,
        ) => void,
): HTMLElement {
    const grid =
        document.createElement(
            'div',
        );

    grid.className =
        'debug-loadout-grid';

    grid.appendChild(
        createGridLabel(
            'debug-loadout-corner',
            'ROW',
        ),
    );

    for (
        let column = 1;
        column <= COLUMN_COUNT;
        column += 1
    ) {
        grid.appendChild(
            createGridLabel(
                'debug-loadout-column-header',
                getColumnLabel(
                    column,
                ),
            ),
        );
    }

    const rowCount =
        Math.max(
            MIN_ROW_COUNT,
            ...context.slots.map(
                (slot) => {
                    return slot.row;
                },
            ),
        );

    for (
        let row = 1;
        row <= rowCount;
        row += 1
    ) {
        grid.appendChild(
            createGridLabel(
                'debug-loadout-row-label',
                String(row),
            ),
        );

        for (
            let column = 1;
            column <= COLUMN_COUNT;
            column += 1
        ) {
            const slot =
                context.slots.find(
                    (item) => {
                        return (
                            item.column ===
                                column &&
                            item.row ===
                                row
                        );
                    },
                );

            if (!slot) {
                const empty =
                    document.createElement(
                        'div',
                    );

                empty.className =
                    'debug-loadout-cell is-empty';

                grid.appendChild(
                    empty,
                );

                continue;
            }

            grid.appendChild(
                createSlotCell(
                    slot,
                    context.options,
                    equipment,
                    onSelect,
                ),
            );
        }
    }

    return grid;
}

function createSlotCell(
    slot: Slot,
    options: EquipmentOption[],
    equipment:
        DebugStartEquipmentMount[],
    onSelect:
        (
            slot: Slot,
            option:
                EquipmentOption |
                undefined,
        ) => void,
): HTMLElement {
    const cell =
        document.createElement(
            'div',
        );

    cell.className =
        (
            'debug-loadout-cell ' +
            'kind-' +
            slot.kind
        );

    const meta =
        document.createElement(
            'div',
        );

    meta.className =
        'debug-loadout-slot-meta';

    const kind =
        document.createElement(
            'span',
        );

    kind.className =
        'debug-loadout-slot-kind';

    kind.textContent =
        slot.kind.toUpperCase();

    const id =
        document.createElement(
            'code',
        );

    id.textContent =
        slot.id;

    meta.append(
        kind,
        id,
    );

    const select =
        document.createElement(
            'select',
        );

    const current =
        equipment.find(
            (mount) => {
                return (
                    mount.slotId ===
                    slot.id
                );
            },
        );

    const compatible =
        options.filter(
            (option) => {
                return (
                    option.slotKind ===
                    slot.kind
                );
            },
        );

    const none =
        document.createElement(
            'option',
        );

    none.value = '';

    none.textContent =
        (
            slot.kind ===
                SLOT_KIND.DRIVE
                ? 'Select drive…'
                : 'None'
        );

    none.disabled =
        slot.kind ===
        SLOT_KIND.DRIVE;

    select.appendChild(
        none,
    );

    let selectedKey = '';

    for (
        const option of
        compatible
    ) {
        const optionElement =
            document.createElement(
                'option',
            );

        optionElement.value =
            option.key;

        optionElement.textContent =
            option.label;

        const isCurrent =
            (
                current?.type ===
                    option.type &&
                current.equipmentId ===
                    option.equipmentId
            );

        if (isCurrent) {
            selectedKey =
                option.key;
        }

        if (
            !isCurrent &&
            isSingletonType(
                option.type,
            ) &&
            hasTypeInOtherSlot(
                equipment,
                option.type,
                slot.id,
            )
        ) {
            optionElement.disabled =
                true;
        }

        select.appendChild(
            optionElement,
        );
    }

    select.value =
        selectedKey;

    select.addEventListener(
        'change',
        () => {
            onSelect(
                slot,
                compatible.find(
                    (option) => {
                        return (
                            option.key ===
                            select.value
                        );
                    },
                ),
            );
        },
    );

    cell.append(
        meta,
        select,
    );

    return cell;
}

function replaceSlotEquipment(
    slots: Slot[],
    equipment:
        DebugStartEquipmentMount[],
    slot: Slot,
    option:
        EquipmentOption |
        undefined,
): DebugStartEquipmentMount[] {
    const slotIds =
        new Set(
            slots.map(
                (item) => {
                    return item.id;
                },
            ),
        );

    const next =
        equipment.filter(
            (mount) => {
                return (
                    mount.slotId !==
                        slot.id &&
                    slotIds.has(
                        mount.slotId,
                    )
                );
            },
        );

    if (option) {
        next.push({
            slotId:
                slot.id,
            type:
                option.type,
            equipmentId:
                option.equipmentId,
        });
    }

    const order =
        new Map(
            slots.map(
                (
                    item,
                    index,
                ) => {
                    return [
                        item.id,
                        index,
                    ];
                },
            ),
        );

    next.sort(
        (
            left,
            right,
        ) => {
            return (
                (
                    order.get(
                        left.slotId,
                    ) ?? 0
                ) -
                (
                    order.get(
                        right.slotId,
                    ) ?? 0
                )
            );
        },
    );

    return next;
}

function findInvalidMounts(
    context: LoadoutContext,
    equipment:
        DebugStartEquipmentMount[],
): DebugStartEquipmentMount[] {
    const occupied =
        new Set<string>();

    return equipment.filter(
        (mount) => {
            if (
                occupied.has(
                    mount.slotId,
                )
            ) {
                return true;
            }

            occupied.add(
                mount.slotId,
            );

            const slot =
                context.slots.find(
                    (item) => {
                        return (
                            item.id ===
                            mount.slotId
                        );
                    },
                );

            if (!slot) {
                return true;
            }

            return !context.options
                .some(
                    (option) => {
                        return (
                            option.type ===
                                mount.type &&
                            option.equipmentId ===
                                mount.equipmentId &&
                            option.slotKind ===
                                slot.kind
                        );
                    },
                );
        },
    );
}

function createOptions(
    records:
        Record<
            string,
            ContentRecord
        >,
    source: EquipmentSource,
): EquipmentOption[] {
    return Object.entries(
        records,
    ).map(
        ([
            equipmentId,
            record,
        ]) => {
            const name =
                (
                    typeof record.name ===
                        'string'
                        ? record.name
                        : equipmentId
                );

            return {
                ...source,

                key:
                    (
                        source.type +
                        ':' +
                        source.collectionId +
                        ':' +
                        equipmentId
                    ),

                equipmentId,

                label:
                    (
                        source.prefix +
                        ' · ' +
                        name
                    ),
            };
        },
    );
}

async function loadCollection(
    collectionId: string,
): Promise<ContentCollectionPayload> {
    const response =
        await fetch(
            (
                '/__content/' +
                encodeURIComponent(
                    collectionId,
                )
            ),
        );

    if (!response.ok) {
        throw new Error(
            (
                'Failed to load "' +
                collectionId +
                '".'
            ),
        );
    }

    return (
        await response.json()
    ) as ContentCollectionPayload;
}

function parseEquipment(
    value: unknown,
): DebugStartEquipmentMount[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const equipment:
        DebugStartEquipmentMount[] = [];

    for (const item of value) {
        if (
            !isRecord(item) ||
            typeof item.slotId !==
                'string' ||
            !isEquipmentType(
                item.type,
            )
        ) {
            return undefined;
        }

        if (
            typeof item.equipmentId !==
                'string'
        ) {
            return undefined;
        }

        equipment.push({
            slotId:
                item.slotId,
            type:
                item.type,
            equipmentId:
                item.equipmentId,
        });
    }

    return equipment;
}

function parseSlots(
    value: unknown,
): Slot[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const slots: Slot[] = [];

    for (const item of value) {
        if (
            !isRecord(item) ||
            typeof item.id !==
                'string' ||
            !isSlotKind(
                item.kind,
            )
        ) {
            return undefined;
        }

        if (
            typeof item.column !==
                'number' ||
            typeof item.row !==
                'number'
        ) {
            return undefined;
        }

        if (
            !Number.isInteger(
                item.column,
            ) ||
            !Number.isInteger(
                item.row,
            )
        ) {
            return undefined;
        }

        slots.push({
            id:
                item.id,
            kind:
                item.kind,
            column:
                item.column,
            row:
                item.row,
        });
    }

    return slots;
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value ===
            'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isEquipmentType(
    value: unknown,
): value is EquipmentType {
    return Object.values(
        EQUIPMENT_TYPE,
    ).includes(
        value as EquipmentType,
    );
}

function isSlotKind(
    value: unknown,
): value is SlotKind {
    return Object.values(
        SLOT_KIND,
    ).includes(
        value as SlotKind,
    );
}

function isSingletonType(
    type: EquipmentType,
): boolean {
    return (
        type ===
            EQUIPMENT_TYPE
                .DEFENSE_TURRET ||
        type ===
            EQUIPMENT_TYPE
                .SHIELD_GENERATOR
    );
}

function hasTypeInOtherSlot(
    equipment:
        DebugStartEquipmentMount[],
    type: EquipmentType,
    slotId: string,
): boolean {
    return equipment.some(
        (mount) => {
            return (
                mount.slotId !==
                    slotId &&
                mount.type ===
                    type
            );
        },
    );
}

function createGridLabel(
    className: string,
    text: string,
): HTMLElement {
    const element =
        document.createElement(
            'div',
        );

    element.className =
        className;

    element.textContent =
        text;

    return element;
}

function getColumnLabel(
    column: number,
): string {
    if (column === 1) {
        return '1 · STERN';
    }

    if (
        column ===
        COLUMN_COUNT
    ) {
        return '4 · NOSE';
    }

    return String(column);
}

function renderError(
    control: HTMLElement,
    message: string,
): void {
    control.replaceChildren();

    control.classList.remove(
        'is-loading',
    );

    const error =
        document.createElement(
            'div',
        );

    error.className =
        'debug-loadout-error';

    error.textContent =
        message;

    control.appendChild(
        error,
    );
}

function getErrorMessage(
    error: unknown,
): string {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    return String(error);
}
