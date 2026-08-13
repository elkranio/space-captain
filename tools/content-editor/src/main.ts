import './style.css';

type JsonSchema = {
    type?: string;
    title?: string;
    minimum?: number;
    unit?: string;
    properties?: Record<string, JsonSchema>;
};

type ContentRecord =
    Record<string, unknown>;

type ContentCollectionPayload = {
    id: string;
    label: string;
    data: Record<string, ContentRecord>;
    schema: JsonSchema;
};

type SaveResponse = {
    data: Record<string, ContentRecord>;
};

type ErrorResponse = {
    error?: string;
    issues?: Array<{
        path?: Array<string | number>;
        message?: string;
    }>;
};

const recordList =
    getElement('record-list');

const inspector =
    getElement('inspector');

const saveButton =
    getButton('save-button');

const saveStatus =
    getElement('save-status');

let collection:
    ContentCollectionPayload | undefined;

let selectedRecordId:
    string | undefined;

let dirty = false;

void loadCollection();

saveButton.addEventListener(
    'click',
    () => {
        void saveCollection();
    },
);

async function loadCollection(): Promise<void> {
    setStatus('Loading…');

    try {
        const response =
            await fetch(
                '/__content/officer_tasks',
            );

        if (!response.ok) {
            throw new Error(
                await readErrorMessage(
                    response,
                ),
            );
        }

        collection =
            await response.json() as
                ContentCollectionPayload;

        selectedRecordId =
            Object.keys(
                collection.data,
            )[0];

        dirty = false;

        render();
        setStatus('Saved');
    } catch (error) {
        setStatus(
            getErrorMessage(error),
            true,
        );

        inspector.innerHTML =
            '<div class="empty-state">' +
            escapeHtml(
                getErrorMessage(error),
            ) +
            '</div>';
    }
}

async function saveCollection(): Promise<void> {
    if (!collection || !dirty) {
        return;
    }

    saveButton.disabled = true;
    setStatus('Saving…');

    try {
        const response =
            await fetch(
                '/__content/officer_tasks',
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify(
                        collection.data,
                    ),
                },
            );

        if (!response.ok) {
            throw new Error(
                await readErrorMessage(
                    response,
                ),
            );
        }

        const saved =
            await response.json() as
                SaveResponse;

        collection.data =
            saved.data;

        dirty = false;

        render();
        setStatus('Saved');
    } catch (error) {
        saveButton.disabled = false;

        setStatus(
            getErrorMessage(error),
            true,
        );
    }
}

function render(): void {
    if (!collection) {
        return;
    }

    renderRecordList();
    renderInspector();

    saveButton.disabled =
        !dirty;
}

function renderRecordList(): void {
    if (!collection) {
        return;
    }

    recordList.replaceChildren();

    for (
        const [
            recordId,
            record,
        ] of Object.entries(
            collection.data,
        )
    ) {
        const button =
            document.createElement(
                'button',
            );

        button.type = 'button';
        button.className =
            'record-button';

        if (
            recordId ===
            selectedRecordId
        ) {
            button.classList.add(
                'is-active',
            );
        }

        const label =
            typeof record.label ===
            'string'
                ? record.label
                : recordId;

        button.innerHTML =
            '<span class="record-label">' +
            escapeHtml(label) +
            '</span>' +
            '<span class="record-id">' +
            escapeHtml(recordId) +
            '</span>';

        button.addEventListener(
            'click',
            () => {
                selectedRecordId =
                    recordId;

                render();
            },
        );

        recordList.appendChild(
            button,
        );
    }
}

function renderInspector(): void {
    if (
        !collection ||
        !selectedRecordId
    ) {
        return;
    }

    const record =
        collection.data[
            selectedRecordId
        ];

    const recordSchema =
        collection
            .schema
            .properties?.[
                selectedRecordId
            ];

    if (
        !record ||
        !recordSchema?.properties
    ) {
        inspector.innerHTML =
            '<div class="empty-state">' +
            'Schema is missing for this task.' +
            '</div>';

        return;
    }

    inspector.replaceChildren();

    const header =
        document.createElement(
            'div',
        );

    header.className =
        'inspector-heading';

    const title =
        document.createElement('h2');

    title.textContent =
        typeof record.label ===
        'string'
            ? record.label
            : selectedRecordId;

    const id =
        document.createElement('code');

    id.textContent =
        selectedRecordId;

    header.append(
        title,
        id,
    );

    inspector.appendChild(
        header,
    );

    for (
        const [
            fieldName,
            fieldSchema,
        ] of Object.entries(
            recordSchema.properties,
        )
    ) {
        inspector.appendChild(
            createField(
                selectedRecordId,
                fieldName,
                fieldSchema,
                record[fieldName],
            ),
        );
    }
}

function createField(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
): HTMLElement {
    const wrapper =
        document.createElement(
            'label',
        );

    wrapper.className =
        'field-row';

    const label =
        document.createElement(
            'span',
        );

    label.className =
        'field-label';

    label.textContent =
        schema.title ??
        fieldName;

    wrapper.appendChild(label);

    if (schema.type === 'boolean') {
        const input =
            document.createElement(
                'input',
            );

        input.type = 'checkbox';
        input.checked =
            value === true;

        input.addEventListener(
            'change',
            () => {
                updateField(
                    recordId,
                    fieldName,
                    input.checked,
                );
            },
        );

        wrapper.appendChild(input);

        return wrapper;
    }

    const control =
        document.createElement(
            'div',
        );

    control.className =
        'field-control';

    const input =
        document.createElement(
            'input',
        );

    if (
        schema.type === 'integer' ||
        schema.type === 'number'
    ) {
        input.type = 'number';

        if (
            schema.type === 'integer'
        ) {
            input.step = '1';
        }

        if (
            typeof schema.minimum ===
            'number'
        ) {
            input.min =
                String(
                    schema.minimum,
                );
        }

        input.value =
            typeof value === 'number'
                ? String(value)
                : '';

        input.addEventListener(
            'input',
            () => {
                updateField(
                    recordId,
                    fieldName,
                    input.value === ''
                        ? undefined
                        : Number(
                            input.value,
                        ),
                );
            },
        );
    } else {
        input.type = 'text';

        input.value =
            typeof value === 'string'
                ? value
                : '';

        input.addEventListener(
            'input',
            () => {
                updateField(
                    recordId,
                    fieldName,
                    input.value,
                );
            },
        );
    }

    control.appendChild(input);

    if (schema.unit) {
        const unit =
            document.createElement(
                'span',
            );

        unit.className =
            'field-unit';

        unit.textContent =
            schema.unit;

        control.appendChild(unit);
    }

    wrapper.appendChild(control);

    return wrapper;
}

function updateField(
    recordId: string,
    fieldName: string,
    value: unknown,
): void {
    if (!collection) {
        return;
    }

    collection.data[
        recordId
    ][fieldName] = value;

    dirty = true;
    setStatus('Unsaved changes');

    renderRecordList();

    saveButton.disabled = false;
}

function setStatus(
    text: string,
    isError = false,
): void {
    saveStatus.textContent = text;

    saveStatus.classList.toggle(
        'is-error',
        isError,
    );
}

async function readErrorMessage(
    response: Response,
): Promise<string> {
    let payload:
        ErrorResponse | undefined;

    try {
        payload =
            await response.json() as
                ErrorResponse;
    } catch {
        return (
            'Request failed: ' +
            response.status
        );
    }

    const issue =
        payload.issues?.[0];

    if (issue?.message) {
        const path =
            issue.path?.length
                ? issue.path.join('.') +
                  ': '
                : '';

        return path +
            issue.message;
    }

    return (
        payload.error ??
        (
            'Request failed: ' +
            response.status
        )
    );
}

function getElement(
    id: string,
): HTMLElement {
    const element =
        document.getElementById(id);

    if (!element) {
        throw new Error(
            'Missing editor element: ' +
            id,
        );
    }

    return element;
}

function getButton(
    id: string,
): HTMLButtonElement {
    const element =
        getElement(id);

    if (
        !(
            element instanceof
            HTMLButtonElement
        )
    ) {
        throw new Error(
            'Editor element is not a button: ' +
            id,
        );
    }

    return element;
}

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : String(error);
}

function escapeHtml(
    value: string,
): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}
