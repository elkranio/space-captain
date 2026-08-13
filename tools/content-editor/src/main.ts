import './style.css';

const CONTENT_ID_PATTERN =
    /^[a-z][a-z0-9_]*$/;

const SHIP_MODULE_COLLECTION_IDS =
    new Set<string>([
        'power_cores',
        'ship_drives',
        'shield_generators',
    ]);

type JsonSchema = {
    type?: string;
    title?: string;
    minimum?: number;
    unit?: string;
    enum?: Array<string | number>;
    properties?: Record<string, JsonSchema>;

    additionalProperties?:
        JsonSchema |
        boolean;

    'x-editor-asset-bucket'?:
        string;
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

type ContentUsage = {
    collection: string;
    recordId: string;
    label: string;
};

type DeleteInfoResponse = {
    usages: ContentUsage[];
};

type AssetRecord = {
    id: string;
    previewUrl: string;
};

type AssetBucketPayload = {
    id: string;
    label: string;
    assets: AssetRecord[];
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

const addRecordButton =
    getButton(
        'add-record-button',
    );

const saveStatus =
    getElement('save-status');

let collectionSummaries:
    ContentCollectionSummary[] = [];

let collection:
    ContentCollectionPayload | undefined;

let selectedRecordId:
    string | undefined;

let persistedRecordIds =
    new Set<string>();

let dirty = false;

void loadEditor();

saveButton.addEventListener(
    'click',
    () => {
        void saveCollection();
    },
);

addRecordButton.addEventListener(
    'click',
    () => {
        void addRecord();
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

        const recordIds =
            Object.keys(
                collection.data,
            );

        selectedRecordId =
            recordIds[0];

        persistedRecordIds =
            new Set(
                recordIds,
            );

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

        persistedRecordIds =
            new Set(
                Object.keys(
                    saved.data,
                ),
            );

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

async function addRecord():
    Promise<void> {
    if (!collection) {
        return;
    }

    const summary =
        getCurrentCollectionSummary();

    if (!summary?.canAdd) {
        return;
    }

    const recordSchema =
        getDynamicRecordSchema();

    if (!recordSchema?.properties) {
        setStatus(
            'This collection does not expose a dynamic record schema.',
            true,
        );

        return;
    }

    const enteredId =
        window.prompt(
            'New record ID',
            'new_00',
        );

    if (enteredId === null) {
        return;
    }

    const recordId =
        enteredId.trim();

    if (
        !CONTENT_ID_PATTERN.test(
            recordId,
        )
    ) {
        window.alert(
            (
                'Record ID must start with a lowercase letter ' +
                'and contain only lowercase letters, numbers and underscores.'
            ),
        );

        return;
    }

    if (
        collection.data[
            recordId
        ]
    ) {
        window.alert(
            (
                'Record "' +
                recordId +
                '" already exists.'
            ),
        );

        return;
    }

    setStatus(
        'Creating draft…',
    );

    try {
        const record =
            await createDefaultRecord(
                recordId,
                recordSchema,
            );

        collection.data[
            recordId
        ] = record;

        selectedRecordId =
            recordId;

        dirty = true;

        render();
        setStatus(
            'Unsaved changes',
        );
    } catch (error) {
        setStatus(
            getErrorMessage(error),
            true,
        );
    }
}

async function deleteSelectedRecord():
    Promise<void> {
    if (
        !collection ||
        !selectedRecordId
    ) {
        return;
    }

    const summary =
        getCurrentCollectionSummary();

    if (!summary?.canDelete) {
        return;
    }

    const recordId =
        selectedRecordId;

    if (
        persistedRecordIds.has(
            recordId,
        )
    ) {
        setStatus(
            'Checking references…',
        );

        try {
            const response =
                await fetch(
                    (
                        getCollectionUrl(
                            collection.id,
                        ) +
                        '/' +
                        encodeURIComponent(
                            recordId,
                        ) +
                        '/delete-info'
                    ),
                );

            if (!response.ok) {
                throw new Error(
                    await readErrorMessage(
                        response,
                    ),
                );
            }

            const info =
                await response.json() as
                    DeleteInfoResponse;

            if (
                info.usages.length >
                0
            ) {
                window.alert(
                    createUsageBlockerMessage(
                        recordId,
                        info.usages,
                    ),
                );

                setStatus('Ready');

                return;
            }
        } catch (error) {
            setStatus(
                getErrorMessage(error),
                true,
            );

            return;
        }
    }

    const confirmed =
        window.confirm(
            (
                'Delete record "' +
                recordId +
                '"?\n\n' +
                'The change is applied when you press Save.'
            ),
        );

    if (!confirmed) {
        setStatus(
            dirty
                ? 'Unsaved changes'
                : 'Saved',
        );

        return;
    }

    delete collection.data[
        recordId
    ];

    const recordIds =
        Object.keys(
            collection.data,
        );

    selectedRecordId =
        recordIds[0];

    dirty = true;

    render();
    setStatus(
        'Unsaved changes',
    );
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

    addRecordButton.hidden =
        !getCurrentCollectionSummary()
            ?.canAdd;
}

function renderCollectionList(): void {
    collectionList.replaceChildren();

    renderCollectionGroup(
        'General',
        collectionSummaries
            .filter((summary) => {
                return (
                    !SHIP_MODULE_COLLECTION_IDS
                        .has(
                            summary.id,
                        )
                );
            }),
    );

    renderCollectionGroup(
        'Ship Modules',
        collectionSummaries
            .filter((summary) => {
                return (
                    SHIP_MODULE_COLLECTION_IDS
                        .has(
                            summary.id,
                        )
                );
            }),
    );
}

function renderCollectionGroup(
    label: string,
    summaries:
        ContentCollectionSummary[],
): void {
    if (summaries.length === 0) {
        return;
    }

    const heading =
        document.createElement(
            'div',
        );

    heading.className =
        'collection-group-heading';

    heading.textContent =
        label;

    collectionList.appendChild(
        heading,
    );

    for (
        const summary of
        summaries
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
            getRecordSchema(
                recordId,
            );

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
        inspector.innerHTML =
            '<div class="empty-state">' +
            'No records in this collection.' +
            '</div>';

        return;
    }

    const record =
        collection.data[
            selectedRecordId
        ];

    const recordSchema =
        getRecordSchema(
            selectedRecordId,
        );

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

    if (
        getCurrentCollectionSummary()
            ?.canDelete
    ) {
        const actions =
            document.createElement(
                'div',
            );

        actions.className =
            'inspector-actions';

        const deleteButton =
            document.createElement(
                'button',
            );

        deleteButton.type =
            'button';

        deleteButton.className =
            'danger-button';

        deleteButton.textContent =
            'Delete Record';

        deleteButton.addEventListener(
            'click',
            () => {
                void deleteSelectedRecord();
            },
        );

        actions.appendChild(
            deleteButton,
        );

        inspector.appendChild(
            actions,
        );
    }
}

function createField(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
): HTMLElement {
    if (
        schema[
            'x-editor-asset-bucket'
        ]
    ) {
        return createAssetReferenceField(
            recordId,
            fieldName,
            schema,
            value,
            schema[
                'x-editor-asset-bucket'
            ],
        );
    }

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

function createAssetReferenceField(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
    bucketId: string,
): HTMLElement {
    const wrapper =
        document.createElement(
            'div',
        );

    wrapper.className =
        'field-row asset-reference-row';

    const label =
        document.createElement(
            'span',
        );

    label.className =
        'field-label';

    label.textContent =
        schema.title ??
        fieldName;

    const control =
        document.createElement(
            'div',
        );

    control.className =
        'asset-reference-control';

    const select =
        document.createElement(
            'select',
        );

    const loadingOption =
        document.createElement(
            'option',
        );

    loadingOption.textContent =
        'Loading assets…';

    select.appendChild(
        loadingOption,
    );

    select.disabled = true;

    const preview =
        document.createElement(
            'div',
        );

    preview.className =
        'content-asset-preview';

    control.append(
        select,
        preview,
    );

    wrapper.append(
        label,
        control,
    );

    void populateAssetReferenceField(
        select,
        preview,
        bucketId,
        typeof value === 'string'
            ? value
            : '',
        (nextValue) => {
            updateField(
                recordId,
                fieldName,
                nextValue,
            );
        },
    );

    return wrapper;
}

async function populateAssetReferenceField(
    select: HTMLSelectElement,
    preview: HTMLElement,
    bucketId: string,
    currentValue: string,
    onChange:
        (value: string) => void,
): Promise<void> {
    try {
        const bucket =
            await loadAssetBucket(
                bucketId,
            );

        select.replaceChildren();

        if (
            bucket.assets.length === 0
        ) {
            const option =
                document.createElement(
                    'option',
                );

            option.textContent =
                'No assets available';

            select.appendChild(
                option,
            );

            select.disabled = true;
            preview.textContent =
                'Upload an asset first.';

            return;
        }

        for (
            const asset of
            bucket.assets
        ) {
            const option =
                document.createElement(
                    'option',
                );

            option.value =
                asset.id;

            option.textContent =
                asset.id;

            select.appendChild(
                option,
            );
        }

        const selectedAsset =
            bucket.assets.find(
                (asset) => {
                    return (
                        asset.id ===
                        currentValue
                    );
                },
            );

        if (!selectedAsset) {
            const missing =
                document.createElement(
                    'option',
                );

            missing.value =
                currentValue;

            missing.textContent =
                (
                    currentValue +
                    ' (missing)'
                );

            select.prepend(
                missing,
            );
        }

        select.value =
            currentValue;

        renderAssetPreview(
            preview,
            bucket.assets,
            currentValue,
        );

        select.disabled = false;

        select.addEventListener(
            'change',
            () => {
                renderAssetPreview(
                    preview,
                    bucket.assets,
                    select.value,
                );

                onChange(
                    select.value,
                );
            },
        );
    } catch (error) {
        select.replaceChildren();
        select.disabled = true;

        preview.textContent =
            getErrorMessage(error);
    }
}

function renderAssetPreview(
    container: HTMLElement,
    assets: AssetRecord[],
    assetId: string,
): void {
    container.replaceChildren();

    const asset =
        assets.find(
            (candidate) => {
                return (
                    candidate.id ===
                    assetId
                );
            },
        );

    if (!asset) {
        container.textContent =
            'Sprite is missing.';

        return;
    }

    const image =
        document.createElement(
            'img',
        );

    image.src =
        asset.previewUrl;

    image.alt =
        asset.id;

    image.className =
        'content-asset-preview-image';

    container.appendChild(
        image,
    );
}

async function createDefaultRecord(
    recordId: string,
    schema: JsonSchema,
): Promise<ContentRecord> {
    if (!schema.properties) {
        throw new Error(
            'Dynamic record schema has no properties.',
        );
    }

    const record:
        ContentRecord = {};

    for (
        const [
            fieldName,
            fieldSchema,
        ] of Object.entries(
            schema.properties,
        )
    ) {
        record[fieldName] =
            await createDefaultFieldValue(
                recordId,
                fieldName,
                fieldSchema,
            );
    }

    return record;
}

async function createDefaultFieldValue(
    recordId: string,
    fieldName: string,
    schema: JsonSchema,
): Promise<unknown> {
    const assetBucket =
        schema[
            'x-editor-asset-bucket'
        ];

    if (assetBucket) {
        const bucket =
            await loadAssetBucket(
                assetBucket,
            );

        const firstAsset =
            bucket.assets[0];

        if (!firstAsset) {
            throw new Error(
                (
                    'Cannot create record: asset bucket "' +
                    bucket.label +
                    '" is empty.'
                ),
            );
        }

        return firstAsset.id;
    }

    if (
        schema.enum &&
        schema.enum.length > 0
    ) {
        return schema.enum[0];
    }

    if (schema.type === 'boolean') {
        return false;
    }

    if (
        schema.type === 'integer' ||
        schema.type === 'number'
    ) {
        return (
            typeof schema.minimum ===
                'number'
                ? schema.minimum
                : 0
        );
    }

    if (schema.type === 'string') {
        return (
            fieldName === 'name'
                ? recordId
                : ''
        );
    }

    throw new Error(
        (
            'Cannot create default value for field "' +
            fieldName +
            '".'
        ),
    );
}

async function loadAssetBucket(
    bucketId: string,
): Promise<AssetBucketPayload> {
    const response =
        await fetch(
            (
                '/__assets/' +
                encodeURIComponent(
                    bucketId,
                )
            ),
        );

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(
                response,
            ),
        );
    }

    return response.json() as
        Promise<AssetBucketPayload>;
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

function getRecordSchema(
    recordId: string,
): JsonSchema | undefined {
    if (!collection) {
        return undefined;
    }

    const explicit =
        collection
            .schema
            .properties?.[
                recordId
            ];

    if (explicit) {
        return explicit;
    }

    return getDynamicRecordSchema();
}

function getDynamicRecordSchema():
    JsonSchema | undefined {
    if (!collection) {
        return undefined;
    }

    const additional =
        collection
            .schema
            .additionalProperties;

    return (
        typeof additional ===
            'object'
            ? additional
            : undefined
    );
}

function getCurrentCollectionSummary():
    ContentCollectionSummary | undefined {
    if (!collection) {
        return undefined;
    }

    return collectionSummaries
        .find((summary) => {
            return (
                summary.id ===
                collection?.id
            );
        });
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

function createUsageBlockerMessage(
    recordId: string,
    usages: ContentUsage[],
): string {
    return (
        'Cannot delete "' +
        recordId +
        '".\n\n' +
        'Used by ' +
        usages.length +
        ' configuration' +
        (
            usages.length === 1
                ? ''
                : 's'
        ) +
        ':\n' +
        usages
            .map((usage) => {
                return (
                    '- ' +
                    usage.collection +
                    ': ' +
                    usage.label +
                    ' [' +
                    usage.recordId +
                    ']'
                );
            })
            .join('\n')
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
