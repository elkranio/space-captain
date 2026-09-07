import equipmentSlotFrameUrl from '../../../assets/raw/images/equipment/ui/equipment_slot.png?url';
import './ship_slot_editor.css';

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

type ShipBlueprintAsset = {
    id: string;
    url: string;
};

const SHIP_BLUEPRINT_ASSETS: ShipBlueprintAsset[] = Object.entries(
    SHIP_BLUEPRINT_URLS,
)
    .map(([path, url]) => {
        const fileName = path.split('/').pop() ?? '';

        return {
            id: fileName.replace(/\.png$/, ''),
            url,
        };
    })
    .sort((left, right) => {
        return left.id.localeCompare(right.id);
    });

export function getDefaultShipBlueprintId(): string | undefined {
    return SHIP_BLUEPRINT_ASSETS[0]?.id;
}

export function createShipBlueprintField(
    label: string,
    value: unknown,
    onChange: (blueprintId: string) => void,
): HTMLElement {
    const wrapper = document.createElement('label');
    wrapper.className = 'field-row';

    const labelElement = document.createElement('span');
    labelElement.className = 'field-label';
    labelElement.textContent = label;

    const control = document.createElement('div');
    control.className = 'field-control';

    const select = document.createElement('select');
    const currentValue = typeof value === 'string' ? value : '';

    if (SHIP_BLUEPRINT_ASSETS.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No blueprints found';
        select.appendChild(option);
        select.disabled = true;
    } else {
        for (const blueprint of SHIP_BLUEPRINT_ASSETS) {
            const option = document.createElement('option');
            option.value = blueprint.id;
            option.textContent = blueprint.id;
            select.appendChild(option);
        }

        if (currentValue && !getShipBlueprintAsset(currentValue)) {
            const missing = document.createElement('option');
            missing.value = currentValue;
            missing.textContent = currentValue + ' (missing)';
            select.prepend(missing);
        }

        select.value = currentValue;
        select.addEventListener('change', () => {
            onChange(select.value);
        });
    }

    control.appendChild(select);
    wrapper.append(labelElement, control);

    return wrapper;
}

export function createDefaultShipSlots(): ShipSlotDraft[] {
    return [
        {
            id: 'hull',
            kind: SHIP_SLOT_KIND.HULL,
            x: 0,
            y: 0,
        },
        {
            id: 'bridge',
            kind: SHIP_SLOT_KIND.BRIDGE,
            x: 250,
            y: 0,
        },
        {
            id: 'drive',
            kind: SHIP_SLOT_KIND.DRIVE,
            x: -250,
            y: 0,
        },
    ];
}

export function createShipSlotsField(
    label: string,
    value: unknown,
    blueprintId: string,
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
        '600 × 260 chassis surface. Slot centers use (0, 0) at the blueprint center. ' +
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

        const blueprint = getShipBlueprintAsset(blueprintId);

        if (blueprint) {
            const image = document.createElement('img');
            image.className = 'ship-slot-blueprint';
            image.src = blueprint.url;
            image.alt = blueprint.id;
            image.draggable = false;
            surface.appendChild(image);
        } else if (blueprintId) {
            const missing = document.createElement('div');
            missing.className = 'ship-slot-blueprint-missing';
            missing.textContent = 'Missing blueprint: ' + blueprintId;
            surface.appendChild(missing);
        }

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
                const resolved = resolveDraggedSlotPosition(
                    slots,
                    slot.id,
                    nextX,
                    nextY,
                    candidate.x,
                    candidate.y,
                );

                nextX = resolved.x;
                nextY = resolved.y;
                setSlotElementPosition(element, nextX, nextY);
            };

            const handlePointerUp = (upEvent: PointerEvent): void => {
                element.removeEventListener('pointermove', handlePointerMove);
                element.removeEventListener('pointerup', handlePointerUp);
                element.removeEventListener('pointercancel', handlePointerUp);
                element.releasePointerCapture(upEvent.pointerId);
                element.classList.remove('is-dragging');

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

        const xInput = createCoordinateInput(
            slot,
            'x',
            -SHIP_CHASSIS_SURFACE_WIDTH / 2 + SHIP_SLOT_WIDTH / 2,
            SHIP_CHASSIS_SURFACE_WIDTH / 2 - SHIP_SLOT_WIDTH / 2,
        );
        const yInput = createCoordinateInput(
            slot,
            'y',
            -SHIP_CHASSIS_SURFACE_HEIGHT / 2 + SHIP_SLOT_HEIGHT / 2,
            SHIP_CHASSIS_SURFACE_HEIGHT / 2 - SHIP_SLOT_HEIGHT / 2,
        );
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

function resolveDraggedSlotPosition(
    slots: ShipSlotDraft[],
    movingSlotId: string,
    currentX: number,
    currentY: number,
    targetX: number,
    targetY: number,
): { x: number; y: number } {
    if (canPlaceSlot(slots, targetX, targetY, movingSlotId)) {
        return {
            x: targetX,
            y: targetY,
        };
    }

    const canMoveX =
        targetX !== currentX &&
        canPlaceSlot(slots, targetX, currentY, movingSlotId);
    const canMoveY =
        targetY !== currentY &&
        canPlaceSlot(slots, currentX, targetY, movingSlotId);

    if (canMoveX && canMoveY) {
        const xDistance = Math.abs(targetX - currentX);
        const yDistance = Math.abs(targetY - currentY);

        return xDistance >= yDistance
            ? {
                x: targetX,
                y: currentY,
            }
            : {
                x: currentX,
                y: targetY,
            };
    }

    if (canMoveX) {
        return {
            x: targetX,
            y: currentY,
        };
    }

    if (canMoveY) {
        return {
            x: currentX,
            y: targetY,
        };
    }

    return {
        x: currentX,
        y: currentY,
    };
}

function isSlotCenterInsideSurface(x: number, y: number): boolean {
    return (
        x >= -SHIP_CHASSIS_SURFACE_WIDTH / 2 + SHIP_SLOT_WIDTH / 2 &&
        x <= SHIP_CHASSIS_SURFACE_WIDTH / 2 - SHIP_SLOT_WIDTH / 2 &&
        y >= -SHIP_CHASSIS_SURFACE_HEIGHT / 2 + SHIP_SLOT_HEIGHT / 2 &&
        y <= SHIP_CHASSIS_SURFACE_HEIGHT / 2 - SHIP_SLOT_HEIGHT / 2
    );
}

function clampSlotCenter(x: number, y: number): { x: number; y: number } {
    return {
        x: Math.round(
            Math.max(
                -SHIP_CHASSIS_SURFACE_WIDTH / 2 + SHIP_SLOT_WIDTH / 2,
                Math.min(SHIP_CHASSIS_SURFACE_WIDTH / 2 - SHIP_SLOT_WIDTH / 2, x),
            ),
        ),
        y: Math.round(
            Math.max(
                -SHIP_CHASSIS_SURFACE_HEIGHT / 2 + SHIP_SLOT_HEIGHT / 2,
                Math.min(SHIP_CHASSIS_SURFACE_HEIGHT / 2 - SHIP_SLOT_HEIGHT / 2, y),
            ),
        ),
    };
}

function getSurfacePoint(surface: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
    const bounds = surface.getBoundingClientRect();

    return {
        x: clientX - bounds.left - SHIP_CHASSIS_SURFACE_WIDTH / 2,
        y: clientY - bounds.top - SHIP_CHASSIS_SURFACE_HEIGHT / 2,
    };
}

function setSlotElementPosition(element: HTMLElement, x: number, y: number): void {
    element.style.left = String(SHIP_CHASSIS_SURFACE_WIDTH / 2 + x - SHIP_SLOT_WIDTH / 2) + 'px';
    element.style.top = String(SHIP_CHASSIS_SURFACE_HEIGHT / 2 + y - SHIP_SLOT_HEIGHT / 2) + 'px';
}

function getShipBlueprintAsset(blueprintId: string): ShipBlueprintAsset | undefined {
    return SHIP_BLUEPRINT_ASSETS.find((blueprint) => {
        return blueprint.id === blueprintId;
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
