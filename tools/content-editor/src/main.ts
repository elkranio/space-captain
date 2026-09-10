import './style.css';
import {
    createShipEquipmentField,
} from './ship_loadout_editor';
import {
    createDefaultShipSlots,
    createShipBlueprintField,
    createShipSlotsField,
    getDefaultShipBlueprintId,
} from './ship_slot_editor';
import {
    createAssetReferenceField,
    createContentReferenceField,
    createSchemaField,
    isNullableStringSchema,
    type JsonSchema,
} from './schema_field';

const CONTENT_ID_PATTERN =
    /^[a-z][a-z0-9_]*$/;

const DEBUG_START_COLLECTION_ID =
    'debug_start';

const SHIPS_COLLECTION_ID = 'ships';

const SHIP_CHASSIS_COLLECTION_ID =
    'ship_chassis';

type ContentRecord =
    Record<string, unknown>;

type ContentCollectionSummary = {
    id: string;
    label: string;
    group: string;
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

const workspace = getElement('workspace');
const recordsPanel = getElement('records-panel');

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

const contentReferenceCollectionCache =
    new Map<
        string,
        Promise<ContentCollectionPayload>
    >();

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

        const payload = await response.json() as ContentCollectionPayload;
        collection = payload.id === DEBUG_START_COLLECTION_ID ? {
            ...payload,
            data: { startingShips: payload.data },
            schema: { properties: { startingShips: payload.schema } },
        } : payload;

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
                        collection.id === DEBUG_START_COLLECTION_ID
                            ? collection.data.startingShips
                            : collection.data,
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

        collection.data = collection.id === DEBUG_START_COLLECTION_ID
            ? { startingShips: saved.data }
            : saved.data;

        persistedRecordIds =
            new Set(
                Object.keys(
                    saved.data,
                ),
            );

        dirty = false;

        // Another content collection may have gained,
        // lost or renamed a referenced record.
        contentReferenceCollectionCache
            .clear();

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

    const enteredId = collection.id === SHIPS_COLLECTION_ID
        ? await requestNewShipId()
        : window.prompt('New record ID', 'new_00');

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

function requestNewShipId(): Promise<string | null> {
    const dialog = document.createElement('dialog');
    dialog.className = 'ship-create-dialog';
    const form = document.createElement('form');
    form.method = 'dialog';
    const title = document.createElement('h2');
    title.textContent = 'New Ship';
    const label = document.createElement('label');
    label.textContent = 'Ship ID';
    const input = document.createElement('input');
    input.name = 'shipId';
    input.value = 'ship_00';
    input.required = true;
    input.pattern = '[a-z][a-z0-9_]*';
    input.title = 'Lowercase letters, numbers and underscores; start with a letter.';
    label.appendChild(input);
    const hint = document.createElement('p');
    hint.textContent = 'Choose a stable ID. You can change the display name later.';
    const actions = document.createElement('div');
    actions.className = 'inspector-actions';
    const create = document.createElement('button');
    create.className = 'primary-button';
    create.textContent = 'Create Ship';
    create.value = 'create';
    const cancel = document.createElement('button');
    cancel.className = 'compact-button';
    cancel.textContent = 'Cancel';
    cancel.value = 'cancel';
    cancel.formNoValidate = true;
    actions.append(create, cancel);
    form.append(title, label, hint, actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);
    return new Promise(resolve => {
        dialog.addEventListener('close', () => {
            resolve(dialog.returnValue === 'create' ? input.value : null);
            dialog.remove();
        }, { once: true });
        dialog.showModal();
        input.select();
    });
}

function duplicateSelectedShip(): void {
    if (!collection || collection.id !== SHIPS_COLLECTION_ID || !selectedRecordId) return;
    const source = collection.data[selectedRecordId];
    let id = selectedRecordId + '_copy';
    let suffix = 2;
    while (Object.hasOwn(collection.data, id)) id = selectedRecordId + '_copy_' + suffix++;
    collection.data[id] = { ...structuredClone(source), name: String(source.name) + ' Copy' };
    selectedRecordId = id;
    dirty = true;
    render();
    setStatus('Unsaved changes');
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
    const startingShips = collection?.id === DEBUG_START_COLLECTION_ID;
    workspace.classList.toggle('is-singleton', startingShips);
    recordsPanel.hidden = startingShips;

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

    const groups =
        new Map<
            string,
            ContentCollectionSummary[]
        >();

    for (
        const summary of
        collectionSummaries
    ) {
        const summaries =
            groups.get(
                summary.group,
            ) ?? [];

        summaries.push(
            summary,
        );

        groups.set(
            summary.group,
            summaries,
        );
    }

    for (
        const [
            groupLabel,
            summaries,
        ] of groups
    ) {
        renderCollectionGroup(
            groupLabel,
            summaries,
        );
    }
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

    header.appendChild(title);
    if (collection.id !== DEBUG_START_COLLECTION_ID) header.appendChild(id);

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

        if (collection.id === SHIPS_COLLECTION_ID) {
            const duplicateButton = document.createElement('button');
            duplicateButton.type = 'button';
            duplicateButton.className = 'compact-button';
            duplicateButton.textContent = 'Duplicate Ship';
            duplicateButton.addEventListener('click', duplicateSelectedShip);
            actions.appendChild(duplicateButton);
        }

        actions.appendChild(deleteButton);

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
        collection?.id ===
            SHIPS_COLLECTION_ID &&
        fieldName === 'equipment'
    ) {
        const chassisId =
            collection.data[
                recordId
            ]?.chassisId;

        return createShipEquipmentField(
            schema.title ?? fieldName,
            typeof chassisId === 'string'
                ? chassisId
                : '',
            value,
            (equipment) => {
                updateField(
                    recordId,
                    fieldName,
                    equipment,
                );
            },
        );
    }

    if (
        collection?.id ===
            SHIP_CHASSIS_COLLECTION_ID &&
        fieldName === 'blueprintId'
    ) {
        return createShipBlueprintField(
            schema.title ?? fieldName,
            value,
            (blueprintId) => {
                updateField(
                    recordId,
                    fieldName,
                    blueprintId,
                );
            },
        );
    }

    if (
        collection?.id ===
            SHIP_CHASSIS_COLLECTION_ID &&
        fieldName === 'slots'
    ) {
        const blueprintId =
            collection.data[
                recordId
            ]?.blueprintId;

        return createShipSlotsField(
            schema.title ?? fieldName,
            value,
            typeof blueprintId === 'string'
                ? blueprintId
                : '',
            (slots) => {
                updateField(
                    recordId,
                    fieldName,
                    slots,
                );
            },
        );
    }

    const contentReferences =
        schema[
            'x-editor-content-reference'
        ];

    if (
        contentReferences &&
        contentReferences.length > 0
    ) {
        return createContentReferenceField(
            fieldName,
            schema,
            value,
            contentReferences,
            loadContentReferenceCollection,
            (nextValue) => {
                updateField(
                    recordId,
                    fieldName,
                    nextValue,
                );
            },
        );
    }

    if (
        schema[
            'x-editor-asset-bucket'
        ]
    ) {
        return createAssetReferenceField(
            fieldName,
            schema,
            value,
            schema[
                'x-editor-asset-bucket'
            ],
            loadAssetBucket,
            (nextValue) => {
                updateField(
                    recordId,
                    fieldName,
                    nextValue,
                );
            },
        );
    }

    return createSchemaField(
        fieldName,
        schema,
        value,
        (nextValue) => {
            updateField(
                recordId,
                fieldName,
                nextValue,
            );
        },
    );
}

function loadContentReferenceCollection(
    collectionId: string,
): Promise<ContentCollectionPayload> {
    if (
        collection?.id ===
        collectionId
    ) {
        return Promise.resolve(
            collection,
        );
    }

    const cached =
        contentReferenceCollectionCache
            .get(
                collectionId,
            );

    if (cached) {
        return cached;
    }

    const request =
        fetch(
            getCollectionUrl(
                collectionId,
            ),
        )
            .then(
                async (response) => {
                    if (!response.ok) {
                        throw new Error(
                            await readErrorMessage(
                                response,
                            ),
                        );
                    }

                    return (
                        await response.json() as
                            ContentCollectionPayload
                    );
                },
            )
            .catch((error) => {
                contentReferenceCollectionCache
                    .delete(
                        collectionId,
                    );

                throw error;
            });

    contentReferenceCollectionCache
        .set(
            collectionId,
            request,
        );

    return request;
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
    if (collection?.id === SHIPS_COLLECTION_ID && fieldName === 'equipment') {
        return [];
    }

    if (
        collection?.id ===
            SHIP_CHASSIS_COLLECTION_ID &&
        fieldName === 'blueprintId'
    ) {
        const blueprintId =
            getDefaultShipBlueprintId();

        if (!blueprintId) {
            throw new Error(
                'Cannot create ship chassis: no blueprint assets found.',
            );
        }

        return blueprintId;
    }

    if (
        collection?.id ===
            SHIP_CHASSIS_COLLECTION_ID &&
        fieldName === 'slots'
    ) {
        return createDefaultShipSlots();
    }

    const contentReferences =
        schema[
            'x-editor-content-reference'
        ];

    if (
        contentReferences &&
        contentReferences.length > 0
    ) {
        if (
            isNullableStringSchema(
                schema,
            )
        ) {
            return null;
        }

        const sources =
            await Promise.all(
                contentReferences
                    .map(
                        loadContentReferenceCollection,
                    ),
            );

        for (
            const source of
            sources
        ) {
            const firstId =
                Object.keys(
                    source.data,
                )[0];

            if (firstId) {
                return firstId;
            }
        }

        throw new Error(
            (
                'Cannot create record: content reference for field "' +
                fieldName +
                '" has no available records.'
            ),
        );
    }

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

    if (
        (
            collection.id ===
                SHIPS_COLLECTION_ID &&
            fieldName === 'chassisId'
        ) ||
        (
            collection.id ===
                SHIP_CHASSIS_COLLECTION_ID &&
            fieldName === 'blueprintId'
        )
    ) {
        renderInspector();
    }

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
