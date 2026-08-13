import './style.css';

type JsonSchema = {
    type?: string;
    title?: string;
    minimum?: number;
    unit?: string;
    enum?: Array<string | number>;
    properties?: Record<string, JsonSchema>;
};

type ContentRecord =
    Record<string, unknown>;

type ContentCollectionSummary = {
    id: string;
    label: string;
    canAdd: boolean;
    canDelete: boolean;
};

type ContentCollectionsPayload = {
    collections:
        ContentCollectionSummary[];
};

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

const collectionList =
    getElement('collection-list');

const recordList =
    getElement('record-list');

const inspector =
    getElement('inspector');

const saveButton =
    getButton('save-button');

const saveStatus =
    getElement('save-status');

let collectionSummaries:
    ContentCollectionSummary[] = [];

let collection:
    ContentCollectionPayload | undefined;

let selectedRecordId:
    string | undefined;

let dirty = false;

void loadEditor();

saveButton.addEventListener(
    'click',
    () => {
        void saveCollection();
    },
);

async function loadEditor(): Promise<void> {
    setStatus('Loading…');

    try {
        const response =
            await fetch(
                '/__content/collections',
            );

        if (!response.ok) {
            throw new Error(
                await readErrorMessage(
                    response,
                ),
            );
        }

        const payload =
            await response.json() as
                ContentCollectionsPayload;

        collectionSummaries =
            payload.collections;

        const firstCollection =
            collectionSummaries[0];

        if (!firstCollection) {
            throw new Error(
                'No content collections are registered.',
            );
        }

        renderCollectionList();

        await loadCollection(
            firstCollection.id,
        );
    } catch (error) {
        showLoadError(error);
    }
}

async function loadCollection(
    collectionId: string,
): Promise<void> {
    saveButton.disabled = true;
    setStatus('Loading…');

    try {
        const response =
            await fetch(
                getCollectionUrl(
                    collectionId,
                ),
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
        showLoadError(error);
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
                getCollectionUrl(
                    collection.id,
                ),
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
    renderCollectionList();

    if (!collection) {
        return;
    }

    renderRecordList();
    renderInspector();

    saveButton.disabled =
        !dirty;
}

function renderCollectionList(): void {
    collectionList.replaceChildren();

    for (
        const summary of
        collectionSummaries
    ) {
        const button =
            document.createElement(
                'button',
            );

        button.type = 'button';
        button.className =
            'collection-button';

        if (
            summary.id ===
            collection?.id
        ) {
            button.classList.add(
                'is-active',
            );
        }

        button.textContent =
            summary.label;

        button.addEventListener(
            'click',
            () => {
                if (
                    summary.id ===
                    collection?.id
                ) {
                    return;
                }

                if (dirty) {
                    setStatus(
                        'Save changes before switching collections.',
                    );

                    return;
                }

                void loadCollection(
                    summary.id,
                );
            },
        );

        collectionList.appendChild(
            button,
        );
    }
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

        const recordSchema =
            collection
                .schema
                .properties?.[
                    recordId
                ];

        const label =
            getRecordLabel(
                recordId,
                record,
                recordSchema,
            );

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
            'Schema is missing for this record.' +
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
        getRecordLabel(
            selectedRecordId,
            record,
            recordSchema,
        );

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

    if (
        schema.enum &&
        schema.enum.length > 0
    ) {
        const select =
            document.createElement(
                'select',
            );

        for (
            const optionValue of
            schema.enum
        ) {
            const option =
                document.createElement(
                    'option',
                );

            option.value =
                String(
                    optionValue,
                );

            option.textContent =
                String(
                    optionValue,
                );

            select.appendChild(
                option,
            );
        }

        select.value =
            String(
                value ?? '',
            );

        select.addEventListener(
            'change',
            () => {
                const nextValue =
                    schema.type ===
                        'number' ||
                    schema.type ===
                        'integer'
                        ? Number(
                            select.value,
                        )
                        : select.value;

                updateField(
                    recordId,
                    fieldName,
                    nextValue,
                );
            },
        );

        control.appendChild(
            select,
        );

        wrapper.appendChild(
            control,
        );

        return wrapper;
    }

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

function getRecordLabel(
    recordId: string,
    record: ContentRecord,
    schema: JsonSchema | undefined,
): string {
    if (
        typeof record.label ===
        'string'
    ) {
        return record.label;
    }

    if (
        typeof record.name ===
        'string'
    ) {
        return record.name;
    }

    return (
        schema?.title ??
        recordId
    );
}

function getCollectionUrl(
    collectionId: string,
): string {
    return (
        '/__content/' +
        encodeURIComponent(
            collectionId,
        )
    );
}

function showLoadError(
    error: unknown,
): void {
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
