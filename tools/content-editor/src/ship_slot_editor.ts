import equipmentSlotFrameUrl from '../../../assets/raw/images/equipment/ui/equipment_slot.png?url';
import './ship_slot_editor.css';

const SHIP_CHASSIS_SURFACE_WIDTH = 600;
const SHIP_CHASSIS_SURFACE_HEIGHT = 260;
const SHIP_SLOT_WIDTH = 100;
const SHIP_SLOT_HEIGHT = 80;

const SHIP_SLOT_KIND = {
    HULL: 'hull',
    BRIDGE: 'bridge',
    DRIVE: 'drive',
    WEAPON: 'weapon',
    DEFENSE: 'defense',
    UTILITY: 'utility',
} as const;

type ShipSlotKind =
    (typeof SHIP_SLOT_KIND)[keyof typeof SHIP_SLOT_KIND];

type OptionalShipSlotKind =
    | typeof SHIP_SLOT_KIND.WEAPON
    | typeof SHIP_SLOT_KIND.DEFENSE
    | typeof SHIP_SLOT_KIND.UTILITY;

type ShipSlotDraft = {
    id: string;
    kind: ShipSlotKind;
    x: number;
    y: number;
};

const OPTIONAL_SLOT_KINDS: OptionalShipSlotKind[] = [
    SHIP_SLOT_KIND.WEAPON,
    SHIP_SLOT_KIND.DEFENSE,
    SHIP_SLOT_KIND.UTILITY,
];

const REQUIRED_SLOT_KINDS = new Set<ShipSlotKind>([
    SHIP_SLOT_KIND.HULL,
    SHIP_SLOT_KIND.BRIDGE,
    SHIP_SLOT_KIND.DRIVE,
]);

export function createDefaultShipSlots(): ShipSlotDraft[] {
    return [
        {
            id: 'hull',
            kind: SHIP_SLOT_KIND.HULL,
            x: 300,
            y: 130,
        },
        {
            id: 'bridge',
            kind: SHIP_SLOT_KIND.BRIDGE,
            x: 550,
            y: 130,
        },
        {
            id: 'drive',
            kind: SHIP_SLOT_KIND.DRIVE,
            x: 50,
            y: 130,
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
        '600 × 260 chassis surface. Slots are positioned by center point. ' +
        'Hull, Bridge and Drive are required; optional slots keep their stable ids when retyped.';

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
    let selectedSlotId = slots[0]?.id;
    let pendingKind: OptionalShipSlotKind | undefined;

    const toolbar = document.createElement('div');
    toolbar.className = 'ship-slot-toolbar';

    const workspace = document.createElement('div');
    workspace.className = 'ship-slot-workspace';

    const surfaceScroll = document.createElement('div');
    surfaceScroll.className = 'ship-slot-surface-scroll';

    const surface = document.createElement('div');
    surface.className = 'ship-slot-surface';

    const inspector = document.createElement('div');
    inspector.className = 'ship-slot-inspector';

    const feedback = document.createElement('div');
    feedback.className = 'ship-slot-feedback';

    surface.addEventListener('click', (event) => {
        if (!pendingKind) {
            return;
        }

        const point = getSurfacePoint(surface, event.clientX, event.clientY);
        const position = clampSlotCenter(point.x, point.y);

        if (!canPlaceSlot(slots, position.x, position.y)) {
            showFeedback('That position overlaps another slot.', true);
            return;
        }

        const kind = pendingKind;
        const id = createNextSlotId(slots, kind);
        pendingKind = undefined;
        selectedSlotId = id;
        showFeedback('');

        commit([
            ...slots,
            {
                id,
                kind,
                ...position,
            },
        ]);
    });

    function commit(nextSlots: ShipSlotDraft[]): void {
        slots = nextSlots;
        onChange(
            slots.map((slot) => {
                return { ...slot };
            }),
        );
        renderAll();
    }

    function renderAll(): void {
        renderToolbar();
        renderSurface();
        renderInspector();
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
                showFeedback(pendingKind ? 'Click the chassis surface to place the new slot.' : '');
                renderToolbar();
                renderSurface();
            });

            toolbar.appendChild(button);
        }

        if (pendingKind) {
            const hint = document.createElement('span');
            hint.className = 'ship-slot-toolbar-hint';
            hint.textContent = 'Click surface to place';
            toolbar.appendChild(hint);
        }
    }

    function renderSurface(): void {
        surface.replaceChildren();
        surface.classList.toggle('is-placing', pendingKind !== undefined);

        surface.append(
            createLaneGuide('LEFT', 0, 0.4),
            createLaneGuide('CENTER', 0.4, 0.2),
            createLaneGuide('RIGHT', 0.6, 0.4),
        );

        for (const slot of slots) {
            surface.appendChild(createSlotElement(slot));
        }
    }

    function createLaneGuide(labelText: string, startRatio: number, heightRatio: number): HTMLElement {
        const lane = document.createElement('div');
        lane.className = 'ship-slot-lane';
        lane.style.top = String(startRatio * 100) + '%';
        lane.style.height = String(heightRatio * 100) + '%';

        const labelElement = document.createElement('span');
        labelElement.className = 'ship-slot-lane-label';
        labelElement.textContent = labelText;
        lane.appendChild(labelElement);

        return lane;
    }

    function createSlotElement(slot: ShipSlotDraft): HTMLElement {
        const element = document.createElement('button');
        element.type = 'button';
        element.className = 'ship-slot-node kind-' + slot.kind;
        element.classList.toggle('is-selected', slot.id === selectedSlotId);
        setSlotElementPosition(element, slot.x, slot.y);

        const frame = document.createElement('img');
        frame.className = 'ship-slot-node-frame';
        frame.src = equipmentSlotFrameUrl;
        frame.alt = '';
        frame.draggable = false;

        const kindLabel = document.createElement('span');
        kindLabel.className = 'ship-slot-node-kind';
        kindLabel.textContent = slot.kind.toUpperCase();

        const idLabel = document.createElement('code');
        idLabel.className = 'ship-slot-node-id';
        idLabel.textContent = slot.id;

        element.append(frame, kindLabel, idLabel);

        element.addEventListener('click', (event) => {
            event.stopPropagation();
            pendingKind = undefined;
            selectedSlotId = slot.id;
            showFeedback('');
            renderAll();
        });

        element.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();
            pendingKind = undefined;
            selectedSlotId = slot.id;
            showFeedback('');
            renderToolbar();
            renderInspector();

            const startPoint = getSurfacePoint(surface, event.clientX, event.clientY);
            const offsetX = startPoint.x - slot.x;
            const offsetY = startPoint.y - slot.y;
            let nextX = slot.x;
            let nextY = slot.y;

            element.setPointerCapture(event.pointerId);
            element.classList.add('is-dragging');

            const handlePointerMove = (moveEvent: PointerEvent): void => {
                const point = getSurfacePoint(surface, moveEvent.clientX, moveEvent.clientY);
                const candidate = clampSlotCenter(point.x - offsetX, point.y - offsetY);

                if (!canPlaceSlot(slots, candidate.x, candidate.y, slot.id)) {
                    element.classList.add('is-invalid');
                    return;
                }

                element.classList.remove('is-invalid');
                nextX = candidate.x;
                nextY = candidate.y;
                setSlotElementPosition(element, nextX, nextY);
            };

            const handlePointerUp = (upEvent: PointerEvent): void => {
                element.removeEventListener('pointermove', handlePointerMove);
                element.removeEventListener('pointerup', handlePointerUp);
                element.removeEventListener('pointercancel', handlePointerUp);
                element.releasePointerCapture(upEvent.pointerId);
                element.classList.remove('is-dragging', 'is-invalid');

                if (nextX === slot.x && nextY === slot.y) {
                    renderSurface();
                    return;
                }

                commit(
                    slots.map((candidate) => {
                        return candidate.id === slot.id
                            ? { ...candidate, x: nextX, y: nextY }
                            : candidate;
                    }),
                );
            };

            element.addEventListener('pointermove', handlePointerMove);
            element.addEventListener('pointerup', handlePointerUp);
            element.addEventListener('pointercancel', handlePointerUp);
        });

        return element;
    }

    function renderInspector(): void {
        inspector.replaceChildren();

        const slot = slots.find((candidate) => {
            return candidate.id === selectedSlotId;
        });

        if (!slot) {
            const empty = document.createElement('div');
            empty.className = 'ship-slot-inspector-empty';
            empty.textContent = 'Select a slot';
            inspector.appendChild(empty);
            return;
        }

        const headingElement = document.createElement('div');
        headingElement.className = 'ship-slot-inspector-heading';
        headingElement.textContent = 'Selected slot';

        const idRow = createPropertyRow('ID');
        const idValue = document.createElement('code');
        idValue.className = 'ship-slot-property-id';
        idValue.textContent = slot.id;
        idRow.control.appendChild(idValue);

        const kindRow = createPropertyRow('TYPE');

        if (REQUIRED_SLOT_KINDS.has(slot.kind)) {
            const kindValue = document.createElement('strong');
            kindValue.className = 'ship-slot-property-fixed';
            kindValue.textContent = slot.kind.toUpperCase();
            kindRow.control.appendChild(kindValue);
        } else {
            const kindSelect = document.createElement('select');

            for (const kind of OPTIONAL_SLOT_KINDS) {
                const option = document.createElement('option');
                option.value = kind;
                option.textContent = kind.toUpperCase();
                kindSelect.appendChild(option);
            }

            kindSelect.value = slot.kind;
            kindSelect.addEventListener('change', () => {
                const nextKind = kindSelect.value as OptionalShipSlotKind;
                commit(
                    slots.map((candidate) => {
                        return candidate.id === slot.id
                            ? { ...candidate, kind: nextKind }
                            : candidate;
                    }),
                );
            });
            kindRow.control.appendChild(kindSelect);
        }

        const xInput = createCoordinateInput(slot, 'x', SHIP_SLOT_WIDTH / 2,
            SHIP_CHASSIS_SURFACE_WIDTH - SHIP_SLOT_WIDTH / 2);
        const yInput = createCoordinateInput(slot, 'y', SHIP_SLOT_HEIGHT / 2,
            SHIP_CHASSIS_SURFACE_HEIGHT - SHIP_SLOT_HEIGHT / 2);
        const xRow = createPropertyRow('X');
        const yRow = createPropertyRow('Y');
        xRow.control.appendChild(xInput);
        yRow.control.appendChild(yInput);

        inspector.append(
            headingElement,
            idRow.root,
            kindRow.root,
            xRow.root,
            yRow.root,
        );

        if (!REQUIRED_SLOT_KINDS.has(slot.kind)) {
            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.className = 'ship-slot-remove-button';
            removeButton.textContent = 'REMOVE SLOT';
            removeButton.addEventListener('click', () => {
                const nextSlots = slots.filter((candidate) => {
                    return candidate.id !== slot.id;
                });
                selectedSlotId = nextSlots[0]?.id;
                commit(nextSlots);
            });
            inspector.appendChild(removeButton);
        }
    }

    function createCoordinateInput(
        slot: ShipSlotDraft,
        axis: 'x' | 'y',
        min: number,
        max: number,
    ): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = '1';
        input.min = String(min);
        input.max = String(max);
        input.value = String(slot[axis]);

        input.addEventListener('change', () => {
            const value = Number(input.value);

            if (!Number.isInteger(value) || value < min || value > max) {
                input.value = String(slot[axis]);
                showFeedback(axis.toUpperCase() + ' is outside the chassis surface.', true);
                return;
            }

            const nextX = axis === 'x' ? value : slot.x;
            const nextY = axis === 'y' ? value : slot.y;

            if (!canPlaceSlot(slots, nextX, nextY, slot.id)) {
                input.value = String(slot[axis]);
                showFeedback('That position overlaps another slot.', true);
                return;
            }

            showFeedback('');
            commit(
                slots.map((candidate) => {
                    return candidate.id === slot.id
                        ? { ...candidate, [axis]: value }
                        : candidate;
                }),
            );
        });

        return input;
    }

    function showFeedback(text: string, isError = false): void {
        feedback.textContent = text;
        feedback.classList.toggle('is-error', isError);
    }

    surfaceScroll.appendChild(surface);
    workspace.append(surfaceScroll, inspector);
    wrapper.append(toolbar, workspace, feedback);
    renderAll();

    return wrapper;
}

function createPropertyRow(labelText: string): { root: HTMLElement; control: HTMLElement } {
    const root = document.createElement('label');
    root.className = 'ship-slot-property-row';

    const label = document.createElement('span');
    label.className = 'ship-slot-property-label';
    label.textContent = labelText;

    const control = document.createElement('span');
    control.className = 'ship-slot-property-control';

    root.append(label, control);

    return { root, control };
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
        Number.isInteger(candidate.x) &&
        typeof candidate.x === 'number' &&
        Number.isInteger(candidate.y) &&
        typeof candidate.y === 'number'
    );
}

function isShipSlotKind(value: unknown): value is ShipSlotKind {
    return (
        value === SHIP_SLOT_KIND.HULL ||
        value === SHIP_SLOT_KIND.BRIDGE ||
        value === SHIP_SLOT_KIND.DRIVE ||
        value === SHIP_SLOT_KIND.WEAPON ||
        value === SHIP_SLOT_KIND.DEFENSE ||
        value === SHIP_SLOT_KIND.UTILITY
    );
}

function canPlaceSlot(
    slots: ShipSlotDraft[],
    x: number,
    y: number,
    movingSlotId?: string,
): boolean {
    if (!isSlotCenterInsideSurface(x, y)) {
        return false;
    }

    return !slots.some((slot) => {
        if (slot.id === movingSlotId) {
            return false;
        }

        return (
            Math.abs(slot.x - x) < SHIP_SLOT_WIDTH &&
            Math.abs(slot.y - y) < SHIP_SLOT_HEIGHT
        );
    });
}

function isSlotCenterInsideSurface(x: number, y: number): boolean {
    return (
        x >= SHIP_SLOT_WIDTH / 2 &&
        x <= SHIP_CHASSIS_SURFACE_WIDTH - SHIP_SLOT_WIDTH / 2 &&
        y >= SHIP_SLOT_HEIGHT / 2 &&
        y <= SHIP_CHASSIS_SURFACE_HEIGHT - SHIP_SLOT_HEIGHT / 2
    );
}

function clampSlotCenter(x: number, y: number): { x: number; y: number } {
    return {
        x: Math.round(
            Math.max(
                SHIP_SLOT_WIDTH / 2,
                Math.min(SHIP_CHASSIS_SURFACE_WIDTH - SHIP_SLOT_WIDTH / 2, x),
            ),
        ),
        y: Math.round(
            Math.max(
                SHIP_SLOT_HEIGHT / 2,
                Math.min(SHIP_CHASSIS_SURFACE_HEIGHT - SHIP_SLOT_HEIGHT / 2, y),
            ),
        ),
    };
}

function getSurfacePoint(surface: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
    const bounds = surface.getBoundingClientRect();

    return {
        x: clientX - bounds.left,
        y: clientY - bounds.top,
    };
}

function setSlotElementPosition(element: HTMLElement, x: number, y: number): void {
    element.style.left = String(x - SHIP_SLOT_WIDTH / 2) + 'px';
    element.style.top = String(y - SHIP_SLOT_HEIGHT / 2) + 'px';
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
