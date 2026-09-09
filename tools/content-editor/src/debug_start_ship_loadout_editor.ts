import beamCannonIconUrl from '../../../assets/raw/images/equipment/icons/beam_cannon.png?url';
import defenseTurretIconUrl from '../../../assets/raw/images/equipment/icons/defense_turret.png?url';
import driveIconUrl from '../../../assets/raw/images/equipment/icons/drive.png?url';
import missileLauncherIconUrl from '../../../assets/raw/images/equipment/icons/missile_launcher.png?url';
import powerCoreIconUrl from '../../../assets/raw/images/equipment/icons/power_core.png?url';
import shieldGeneratorIconUrl from '../../../assets/raw/images/equipment/icons/shield_generator.png?url';
import spamProjectorIconUrl from '../../../assets/raw/images/equipment/icons/spam_projector.png?url';
import stickyMineDispenserIconUrl from '../../../assets/raw/images/equipment/icons/sticky_mine_dispenser.png?url';
import equipmentSlotFrameUrl from '../../../assets/raw/images/equipment/ui/equipment_slot.png?url';
import './debug_start_ship_loadout_editor.css';

const SHIP_BLUEPRINT_URLS = import.meta.glob(
    '../../../assets/raw/images/world/ships/blueprints/*.png',
    {
        eager: true,
        query: '?url',
        import: 'default',
    },
) as Record<string, string>;

const SHIP_CHASSIS_SURFACE_WIDTH = 600;
const SHIP_CHASSIS_SURFACE_HEIGHT = 260;
const SHIP_SLOT_WIDTH = 100;
const SHIP_SLOT_HEIGHT = 80;

const EQUIPMENT_TYPE = {
    DRIVE: 'drive',
    POWER_CORE: 'power_core',
    DEFENSE_TURRET: 'defense_turret',
    SHIELD_GENERATOR: 'shield_generator',
    WEAPON: 'weapon',
} as const;

const SLOT_KIND = {
    HULL: 'hull',
    BRIDGE: 'bridge',
    DRIVE: 'drive',
    POWER_CORE: 'power_core',
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
    x: number;
    y: number;
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
    iconUrl: string;
};

type EquipmentOption =
    EquipmentSource & {
        key: string;
        equipmentId: string;
        label: string;
        shortName: string;
        maxIntegrity: number;
        telemetryText: string;
    };

type LoadoutContext = {
    blueprintId: string;
    slots: Slot[];
    options: EquipmentOption[];
};

const SOURCES: EquipmentSource[] = [
    {
        collectionId: 'ship_drives',
        type: EQUIPMENT_TYPE.DRIVE,
        slotKind: SLOT_KIND.DRIVE,
        prefix: 'Drive',
        iconUrl: driveIconUrl,
    },
    {
        collectionId: 'power_cores',
        type: EQUIPMENT_TYPE.POWER_CORE,
        slotKind: SLOT_KIND.POWER_CORE,
        prefix: 'Core',
        iconUrl: powerCoreIconUrl,
    },
    {
        collectionId: 'defense_turrets',
        type: EQUIPMENT_TYPE.DEFENSE_TURRET,
        slotKind: SLOT_KIND.DEFENSE,
        prefix: 'Turret',
        iconUrl: defenseTurretIconUrl,
    },
    {
        collectionId: 'shield_generators',
        type: EQUIPMENT_TYPE.SHIELD_GENERATOR,
        slotKind: SLOT_KIND.DEFENSE,
        prefix: 'Shield',
        iconUrl: shieldGeneratorIconUrl,
    },
    {
        collectionId: 'missile_launchers',
        type: EQUIPMENT_TYPE.WEAPON,
        slotKind: SLOT_KIND.WEAPON,
        prefix: 'Missile',
        iconUrl: missileLauncherIconUrl,
    },
    {
        collectionId: 'beam_cannons',
        type: EQUIPMENT_TYPE.WEAPON,
        slotKind: SLOT_KIND.WEAPON,
        prefix: 'Beam',
        iconUrl: beamCannonIconUrl,
    },
    {
        collectionId: 'sticky_mine_dispensers',
        type: EQUIPMENT_TYPE.WEAPON,
        slotKind: SLOT_KIND.WEAPON,
        prefix: 'Mine',
        iconUrl: stickyMineDispenserIconUrl,
    },
    {
        collectionId: 'spam_projectors',
        type: EQUIPMENT_TYPE.WEAPON,
        slotKind: SLOT_KIND.UTILITY,
        prefix: 'SPAM',
        iconUrl: spamProjectorIconUrl,
    },
];

export function createDebugStartEquipmentField(
    label: string,
    chassisId: string,
    value: unknown,
    onChange: (equipment: DebugStartEquipmentMount[]) => void,
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'field-row debug-loadout-field';

    const heading = document.createElement('div');
    heading.className = 'field-label debug-loadout-label';
    heading.textContent = label;

    const control = document.createElement('div');
    control.className = 'debug-loadout-control is-loading';
    control.textContent = 'Loading chassis and equipment…';

    wrapper.append(heading, control);

    const equipment = parseEquipment(value);

    if (!equipment) {
        renderError(
            control,
            'Equipment must be an array of slot/type/equipmentId records.',
        );

        return wrapper;
    }

    void loadContext(chassisId)
        .then((context) => {
            control.classList.remove('is-loading');
            renderLoadout(control, context, equipment, onChange);
        })
        .catch((error) => {
            renderError(control, getErrorMessage(error));
        });

    return wrapper;
}

async function loadContext(chassisId: string): Promise<LoadoutContext> {
    if (chassisId.length === 0) {
        throw new Error('Select a chassis before editing equipment.');
    }

    const [chassisCollection, ...equipmentCollections] = await Promise.all([
        loadCollection('ship_chassis'),
        ...SOURCES.map((source) => {
            return loadCollection(source.collectionId);
        }),
    ]);

    const chassis = chassisCollection.data[chassisId];

    if (!chassis) {
        throw new Error('Chassis "' + chassisId + '" is missing.');
    }

    const slots = parseSlots(chassis.slots);

    if (!slots) {
        throw new Error('Chassis "' + chassisId + '" has invalid slot data.');
    }

    const options = SOURCES.flatMap((source, index) => {
        const sourceCollection = equipmentCollections[index];

        if (!sourceCollection) {
            return [];
        }

        return createOptions(sourceCollection.data, source);
    });

    return {
        blueprintId: typeof chassis.blueprintId === 'string'
            ? chassis.blueprintId
            : '',
        slots,
        options,
    };
}

function renderLoadout(
    control: HTMLElement,
    context: LoadoutContext,
    initialEquipment: DebugStartEquipmentMount[],
    onChange: (equipment: DebugStartEquipmentMount[]) => void,
): void {
    let equipment = initialEquipment.map((mount) => {
        return { ...mount };
    });
    let selectedSlotId = context.slots.find((slot) => {
        return isConfigurableSlotKind(slot.kind);
    })?.id;

    const render = (): void => {
        control.replaceChildren();

        const invalid = findInvalidMounts(context, equipment);

        if (invalid.length > 0) {
            control.appendChild(createInvalidMountWarning(invalid));
        }

        const workspace = document.createElement('div');
        workspace.className = 'debug-loadout-workspace';

        const surfaceScroll = document.createElement('div');
        surfaceScroll.className = 'debug-loadout-surface-scroll';
        surfaceScroll.appendChild(
            createSurface(
                context,
                equipment,
                selectedSlotId,
                (slotId) => {
                    selectedSlotId = slotId;
                    render();
                },
            ),
        );

        const inspector = createInspector(
            context,
            equipment,
            selectedSlotId,
            (slot, option) => {
                equipment = replaceSlotEquipment(
                    context.slots,
                    equipment,
                    slot,
                    option,
                );

                onChange(
                    equipment.map((mount) => {
                        return { ...mount };
                    }),
                );

                render();
            },
        );

        workspace.append(surfaceScroll, inspector);
        control.appendChild(workspace);
    };

    render();
}

function createInvalidMountWarning(
    invalid: DebugStartEquipmentMount[],
): HTMLElement {
    const warning = document.createElement('div');
    warning.className = 'debug-loadout-warning';
    warning.textContent =
        'Invalid or orphaned mounts: ' +
        invalid
            .map((mount) => {
                return mount.slotId + ' → ' + mount.equipmentId;
            })
            .join(', ');

    return warning;
}

function createSurface(
    context: LoadoutContext,
    equipment: DebugStartEquipmentMount[],
    selectedSlotId: string | undefined,
    onSelect: (slotId: string) => void,
): HTMLElement {
    const surface = document.createElement('div');
    surface.className = 'debug-loadout-surface';

    const blueprintUrl = getBlueprintUrl(context.blueprintId);

    if (blueprintUrl) {
        const blueprint = document.createElement('img');
        blueprint.className = 'debug-loadout-blueprint';
        blueprint.src = blueprintUrl;
        blueprint.alt = context.blueprintId;
        blueprint.draggable = false;
        surface.appendChild(blueprint);
    } else {
        const missing = document.createElement('div');
        missing.className = 'debug-loadout-blueprint-missing';
        missing.textContent = context.blueprintId
            ? 'Missing blueprint: ' + context.blueprintId
            : 'No blueprint';
        surface.appendChild(missing);
    }

    for (const slot of context.slots) {
        surface.appendChild(
            createSlotNode(
                slot,
                getMountedOption(context, equipment, slot),
                slot.id === selectedSlotId,
                onSelect,
            ),
        );
    }

    return surface;
}

function createSlotNode(
    slot: Slot,
    option: EquipmentOption | undefined,
    selected: boolean,
    onSelect: (slotId: string) => void,
): HTMLElement {
    const configurable = isConfigurableSlotKind(slot.kind);
    const element = configurable
        ? document.createElement('button')
        : document.createElement('div');

    element.className =
        'debug-loadout-slot kind-' + slot.kind +
        (configurable ? ' is-configurable' : ' is-fixed');
    element.classList.toggle('is-selected', configurable && selected);
    element.style.left = String(SHIP_CHASSIS_SURFACE_WIDTH / 2 + slot.x - SHIP_SLOT_WIDTH / 2) + 'px';
    element.style.top = String(SHIP_CHASSIS_SURFACE_HEIGHT / 2 + slot.y - SHIP_SLOT_HEIGHT / 2) + 'px';

    if (element instanceof HTMLButtonElement) {
        element.type = 'button';
        element.addEventListener('click', () => {
            onSelect(slot.id);
        });
    }

    const frame = document.createElement('img');
    frame.className = 'debug-loadout-slot-frame';
    frame.src = equipmentSlotFrameUrl;
    frame.alt = '';
    frame.draggable = false;
    element.appendChild(frame);

    if (!configurable) {
        element.appendChild(createFixedSlotContent(slot));
        return element;
    }

    if (!option) {
        element.appendChild(createEmptySlotContent(slot));
        return element;
    }

    element.title = option.label;
    element.appendChild(createEquipmentSlotContent(option));

    return element;
}

function createFixedSlotContent(slot: Slot): HTMLElement {
    const content = document.createElement('div');
    content.className = 'debug-loadout-fixed-slot-content';

    const kind = document.createElement('strong');
    kind.textContent = slot.kind.toUpperCase();

    const id = document.createElement('code');
    id.textContent = slot.id;

    content.append(kind, id);

    return content;
}

function createEmptySlotContent(slot: Slot): HTMLElement {
    const content = document.createElement('div');
    content.className = 'debug-loadout-empty-slot-content';

    const kind = document.createElement('strong');
    kind.textContent = slot.kind.toUpperCase();

    const empty = document.createElement('span');
    empty.textContent = 'EMPTY';

    content.append(kind, empty);

    return content;
}

function createEquipmentSlotContent(option: EquipmentOption): HTMLElement {
    const content = document.createElement('div');
    content.className = 'debug-loadout-equipment-content';

    const icon = document.createElement('img');
    icon.className = 'debug-loadout-equipment-icon';
    icon.src = option.iconUrl;
    icon.alt = option.shortName;
    icon.draggable = false;

    const divider = document.createElement('div');
    divider.className = 'debug-loadout-equipment-divider';

    const telemetry = document.createElement('div');
    telemetry.className = 'debug-loadout-equipment-telemetry';

    const value = document.createElement('span');
    value.className = 'debug-loadout-equipment-value';
    value.textContent = option.telemetryText;

    const integrity = document.createElement('span');
    integrity.className = 'debug-loadout-integrity';
    integrity.title = 'Integrity ' + String(option.maxIntegrity);

    for (let index = 0; index < option.maxIntegrity; index += 1) {
        const pip = document.createElement('span');
        pip.className = 'debug-loadout-integrity-pip';
        integrity.appendChild(pip);
    }

    telemetry.append(value, integrity);
    content.append(icon, divider, telemetry);

    return content;
}

function createInspector(
    context: LoadoutContext,
    equipment: DebugStartEquipmentMount[],
    selectedSlotId: string | undefined,
    onSelect: (slot: Slot, option: EquipmentOption | undefined) => void,
): HTMLElement {
    const inspector = document.createElement('div');
    inspector.className = 'debug-loadout-inspector';

    const slot = context.slots.find((candidate) => {
        return candidate.id === selectedSlotId;
    });

    if (!slot || !isConfigurableSlotKind(slot.kind)) {
        const empty = document.createElement('div');
        empty.className = 'debug-loadout-inspector-empty';
        empty.textContent = 'Select an equipment slot';
        inspector.appendChild(empty);
        return inspector;
    }

    const heading = document.createElement('div');
    heading.className = 'debug-loadout-inspector-heading';
    heading.textContent = 'Selected slot';

    const idRow = createInspectorRow('SLOT');
    const id = document.createElement('code');
    id.textContent = slot.id;
    idRow.control.appendChild(id);

    const typeRow = createInspectorRow('TYPE');
    const kind = document.createElement('strong');
    kind.textContent = slot.kind.toUpperCase();
    typeRow.control.appendChild(kind);

    const equipmentRow = createInspectorRow('EQUIP');
    const select = createEquipmentSelect(
        context,
        equipment,
        slot,
        onSelect,
    );
    equipmentRow.control.appendChild(select);

    inspector.append(
        heading,
        idRow.root,
        typeRow.root,
        equipmentRow.root,
    );

    const mounted = getMountedOption(context, equipment, slot);

    if (mounted) {
        const name = document.createElement('div');
        name.className = 'debug-loadout-inspector-equipment-name';
        name.textContent = mounted.shortName;
        inspector.appendChild(name);
    }

    return inspector;
}

function createEquipmentSelect(
    context: LoadoutContext,
    equipment: DebugStartEquipmentMount[],
    slot: Slot,
    onSelect: (slot: Slot, option: EquipmentOption | undefined) => void,
): HTMLSelectElement {
    const select = document.createElement('select');
    const compatible = context.options.filter((option) => {
        return option.slotKind === slot.kind;
    });
    const current = getMountedOption(context, equipment, slot);

    const none = document.createElement('option');
    none.value = '';
    none.textContent = slot.kind === SLOT_KIND.DRIVE
        ? 'Select drive…'
        : 'NONE';
    none.disabled = slot.kind === SLOT_KIND.DRIVE;
    select.appendChild(none);

    let selectedKey = '';

    for (const option of compatible) {
        const optionElement = document.createElement('option');
        optionElement.value = option.key;
        optionElement.textContent = option.label;

        const isCurrent =
            current?.type === option.type &&
            current.equipmentId === option.equipmentId;

        if (isCurrent) {
            selectedKey = option.key;
        }

        if (
            !isCurrent &&
            isSingletonType(option.type) &&
            hasTypeInOtherSlot(
                context.slots,
                equipment,
                option.type,
                option.slotKind,
                slot.id,
            )
        ) {
            optionElement.disabled = true;
        }

        select.appendChild(optionElement);
    }

    select.value = selectedKey;
    select.addEventListener('change', () => {
        onSelect(
            slot,
            compatible.find((option) => {
                return option.key === select.value;
            }),
        );
    });

    return select;
}

function createInspectorRow(
    labelText: string,
): { root: HTMLElement; control: HTMLElement } {
    const root = document.createElement('label');
    root.className = 'debug-loadout-inspector-row';

    const label = document.createElement('span');
    label.className = 'debug-loadout-inspector-label';
    label.textContent = labelText;

    const control = document.createElement('span');
    control.className = 'debug-loadout-inspector-control';

    root.append(label, control);

    return { root, control };
}

function getMountedOption(
    context: LoadoutContext,
    equipment: DebugStartEquipmentMount[],
    slot: Slot,
): EquipmentOption | undefined {
    const mount = equipment.find((candidate) => {
        return candidate.slotId === slot.id;
    });

    if (!mount) {
        return undefined;
    }

    return context.options.find((option) => {
        return (
            option.type === mount.type &&
            option.equipmentId === mount.equipmentId &&
            option.slotKind === slot.kind
        );
    });
}

function replaceSlotEquipment(
    slots: Slot[],
    equipment: DebugStartEquipmentMount[],
    slot: Slot,
    option: EquipmentOption | undefined,
): DebugStartEquipmentMount[] {
    const slotIds = new Set(
        slots.map((item) => {
            return item.id;
        }),
    );

    const next = equipment.filter((mount) => {
        return (
            mount.slotId !== slot.id &&
            slotIds.has(mount.slotId)
        );
    });

    if (option) {
        next.push({
            slotId: slot.id,
            type: option.type,
            equipmentId: option.equipmentId,
        });
    }

    const order = new Map(
        slots.map((item, index) => {
            return [item.id, index];
        }),
    );

    next.sort((left, right) => {
        return (
            (order.get(left.slotId) ?? 0) -
            (order.get(right.slotId) ?? 0)
        );
    });

    return next;
}

function findInvalidMounts(
    context: LoadoutContext,
    equipment: DebugStartEquipmentMount[],
): DebugStartEquipmentMount[] {
    const occupied = new Set<string>();

    return equipment.filter((mount) => {
        if (occupied.has(mount.slotId)) {
            return true;
        }

        occupied.add(mount.slotId);

        const slot = context.slots.find((item) => {
            return item.id === mount.slotId;
        });

        if (!slot || !isConfigurableSlotKind(slot.kind)) {
            return true;
        }

        return !context.options.some((option) => {
            return (
                option.type === mount.type &&
                option.equipmentId === mount.equipmentId &&
                option.slotKind === slot.kind
            );
        });
    });
}

function createOptions(
    records: Record<string, ContentRecord>,
    source: EquipmentSource,
): EquipmentOption[] {
    return Object.entries(records).map(([equipmentId, record]) => {
        const name = typeof record.name === 'string'
            ? record.name
            : equipmentId;
        const shortName = typeof record.shortName === 'string'
            ? record.shortName
            : name;

        return {
            ...source,
            key:
                source.type + ':' +
                source.collectionId + ':' +
                equipmentId,
            equipmentId,
            label: source.prefix + ' · ' + name,
            shortName,
            maxIntegrity: getPositiveInteger(record.maxIntegrity),
            telemetryText: getEquipmentTelemetryText(record),
        };
    });
}

function getEquipmentTelemetryText(record: ContentRecord): string {
    const ammoCapacity = getNonNegativeInteger(record.ammoCapacity);

    if (ammoCapacity !== undefined) {
        return 'AMMO ' + String(ammoCapacity);
    }

    const powerCost = getNonNegativeInteger(record.powerCost);

    if (powerCost !== undefined) {
        return 'CORE ' + String(powerCost);
    }

    return '';
}

function getPositiveInteger(value: unknown): number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value > 0
    )
        ? value
        : 0;
}

function getNonNegativeInteger(value: unknown): number | undefined {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 0
    )
        ? value
        : undefined;
}

function getBlueprintUrl(blueprintId: string): string | undefined {
    const suffix = '/' + blueprintId + '.png';

    return Object.entries(SHIP_BLUEPRINT_URLS)
        .find(([path]) => {
            return path.endsWith(suffix);
        })?.[1];
}

async function loadCollection(
    collectionId: string,
): Promise<ContentCollectionPayload> {
    const response = await fetch(
        '/__content/' + encodeURIComponent(collectionId),
    );

    if (!response.ok) {
        throw new Error('Failed to load "' + collectionId + '".');
    }

    return await response.json() as ContentCollectionPayload;
}

function parseEquipment(
    value: unknown,
): DebugStartEquipmentMount[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const equipment: DebugStartEquipmentMount[] = [];

    for (const item of value) {
        if (
            !isRecord(item) ||
            typeof item.slotId !== 'string' ||
            !isEquipmentType(item.type) ||
            typeof item.equipmentId !== 'string'
        ) {
            return undefined;
        }

        equipment.push({
            slotId: item.slotId,
            type: item.type,
            equipmentId: item.equipmentId,
        });
    }

    return equipment;
}

function parseSlots(value: unknown): Slot[] | undefined {
    if (!Array.isArray(value)) {
        return undefined;
    }

    const slots: Slot[] = [];

    for (const item of value) {
        if (
            !isRecord(item) ||
            typeof item.id !== 'string' ||
            !isSlotKind(item.kind) ||
            typeof item.x !== 'number' ||
            typeof item.y !== 'number' ||
            !Number.isInteger(item.x) ||
            !Number.isInteger(item.y)
        ) {
            return undefined;
        }

        slots.push({
            id: item.id,
            kind: item.kind,
            x: item.x,
            y: item.y,
        });
    }

    return slots;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}

function isEquipmentType(value: unknown): value is EquipmentType {
    return Object.values(EQUIPMENT_TYPE).includes(
        value as EquipmentType,
    );
}

function isSlotKind(value: unknown): value is SlotKind {
    return Object.values(SLOT_KIND).includes(
        value as SlotKind,
    );
}

function isConfigurableSlotKind(kind: SlotKind): boolean {
    return (
        kind === SLOT_KIND.DRIVE ||
        kind === SLOT_KIND.POWER_CORE ||
        kind === SLOT_KIND.WEAPON ||
        kind === SLOT_KIND.DEFENSE ||
        kind === SLOT_KIND.UTILITY
    );
}

function isSingletonType(type: EquipmentType): boolean {
    return (
        type === EQUIPMENT_TYPE.POWER_CORE ||
        type === EQUIPMENT_TYPE.DEFENSE_TURRET ||
        type === EQUIPMENT_TYPE.SHIELD_GENERATOR
    );
}

function hasTypeInOtherSlot(
    slots: Slot[],
    equipment: DebugStartEquipmentMount[],
    type: EquipmentType,
    slotKind: SlotKind,
    slotId: string,
): boolean {
    return equipment.some((mount) => {
        if (
            mount.slotId === slotId ||
            mount.type !== type
        ) {
            return false;
        }

        const mountedSlot = slots.find((slot) => {
            return slot.id === mount.slotId;
        });

        return mountedSlot?.kind === slotKind;
    });
}

function renderError(
    control: HTMLElement,
    message: string,
): void {
    control.replaceChildren();
    control.classList.remove('is-loading');

    const error = document.createElement('div');
    error.className = 'debug-loadout-error';
    error.textContent = message;
    control.appendChild(error);
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error
        ? error.message
        : String(error);
}
