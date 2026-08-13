import './style.css';
import './asset_manager.css';

type AssetBucketSummary = {
    id: string;
    label: string;
};

type AssetBucketsPayload = {
    buckets:
        AssetBucketSummary[];
};

type AssetRecord = {
    id: string;
    frameKey: string;
    rawPath: string;
    previewUrl: string;
};

type AssetUsage = {
    collection: string;
    recordId: string;
    label: string;
};

type AssetDeleteInfo = {
    isProtected: boolean;
    usages: AssetUsage[];
};

type AssetBucketPayload = {
    id: string;
    label: string;
    assets: AssetRecord[];
};

type ErrorPayload = {
    error?: string;
};

const bucketList =
    getElement(
        'asset-bucket-list',
    );

const assetList =
    getElement(
        'asset-list',
    );

const inspector =
    getElement(
        'asset-inspector',
    );

const status =
    getElement(
        'asset-status',
    );

const uploadButton =
    getButton(
        'upload-button',
    );

const rebuildAtlasButton =
    getButton(
        'rebuild-atlas-button',
    );

const uploadInput =
    getFileInput(
        'upload-input',
    );

const replaceInput =
    getFileInput(
        'replace-input',
    );

let bucketSummaries:
    AssetBucketSummary[] = [];

let bucket:
    AssetBucketPayload | undefined;

let selectedAssetId:
    string | undefined;

let previewVersion = 0;

void loadAssetManager();

uploadButton.addEventListener(
    'click',
    () => {
        uploadInput.value = '';
        uploadInput.click();
    },
);

rebuildAtlasButton.addEventListener(
    'click',
    () => {
        void rebuildAtlas();
    },
);

uploadInput.addEventListener(
    'change',
    () => {
        const file =
            uploadInput.files?.[0];

        if (!file) {
            return;
        }

        void uploadNewAsset(
            file,
        );
    },
);

replaceInput.addEventListener(
    'change',
    () => {
        const file =
            replaceInput.files?.[0];

        if (
            !file ||
            !bucket ||
            !selectedAssetId
        ) {
            return;
        }

        void replaceSelectedAsset(
            file,
        );
    },
);

async function loadAssetManager():
    Promise<void> {
    setStatus('Loading…');

    try {
        const response =
            await fetch(
                '/__assets/buckets',
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
                AssetBucketsPayload;

        bucketSummaries =
            payload.buckets;

        const first =
            bucketSummaries[0];

        if (!first) {
            throw new Error(
                'No asset buckets are registered.',
            );
        }

        await loadBucket(
            first.id,
        );
    } catch (error) {
        showError(error);
    }
}

async function loadBucket(
    bucketId: string,
    preferredAssetId?: string,
): Promise<void> {
    setStatus('Loading…');

    const response =
        await fetch(
            getBucketUrl(
                bucketId,
            ),
        );

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(
                response,
            ),
        );
    }

    bucket =
        await response.json() as
            AssetBucketPayload;

    selectedAssetId =
        preferredAssetId &&
        bucket.assets.some(
            (asset) => {
                return (
                    asset.id ===
                    preferredAssetId
                );
            },
        )
            ? preferredAssetId
            : bucket.assets[0]?.id;

    render();
    setStatus('Ready');
}

async function uploadNewAsset(
    file: File,
): Promise<void> {
    if (!bucket) {
        return;
    }

    const suggestedId =
        createSuggestedAssetId(
            file.name,
        );

    const enteredId =
        window.prompt(
            'Asset ID',
            suggestedId,
        );

    if (enteredId === null) {
        return;
    }

    const assetId =
        enteredId.trim();

    if (!assetId) {
        setStatus(
            'Asset ID is required.',
            true,
        );

        return;
    }

    setStatus(
        'Uploading ' +
        assetId +
        '…',
    );

    try {
        await sendPng(
            getAssetUrl(
                bucket.id,
                assetId,
            ),
            'POST',
            file,
        );

        previewVersion += 1;

        await loadBucket(
            bucket.id,
            assetId,
        );

        setStatus(
            'Uploaded. Atlas needs rebuild.',
        );
    } catch (error) {
        showError(error);
    }
}

async function replaceSelectedAsset(
    file: File,
): Promise<void> {
    if (
        !bucket ||
        !selectedAssetId
    ) {
        return;
    }

    const assetId =
        selectedAssetId;

    setStatus(
        'Replacing ' +
        assetId +
        '…',
    );

    try {
        await sendPng(
            getAssetUrl(
                bucket.id,
                assetId,
            ),
            'PUT',
            file,
        );

        previewVersion += 1;

        await loadBucket(
            bucket.id,
            assetId,
        );

        setStatus(
            'Replaced. Atlas needs rebuild.',
        );
    } catch (error) {
        showError(error);
    }
}

async function deleteSelectedAsset():
    Promise<void> {
    if (!bucket) {
        return;
    }

    const asset =
        getSelectedAsset();

    if (!asset) {
        return;
    }

    setStatus(
        'Checking references…',
    );

    try {
        const infoResponse =
            await fetch(
                getAssetUrl(
                    bucket.id,
                    asset.id,
                ) +
                '/delete-info',
            );

        if (!infoResponse.ok) {
            throw new Error(
                await readErrorMessage(
                    infoResponse,
                ),
            );
        }

        const info =
            await infoResponse.json() as
                AssetDeleteInfo;

        const blockers =
            getDeleteBlockerMessage(
                asset.id,
                info,
            );

        if (blockers) {
            window.alert(
                blockers,
            );

            setStatus('Ready');

            return;
        }

        const confirmed =
            window.confirm(
                (
                    'Delete asset "' +
                    asset.id +
                    '"?\n\n' +
                    'This removes the raw PNG and manifest entry.'
                ),
            );

        if (!confirmed) {
            setStatus('Ready');

            return;
        }

        setStatus(
            'Deleting ' +
            asset.id +
            '…',
        );

        const deleteResponse =
            await fetch(
                getAssetUrl(
                    bucket.id,
                    asset.id,
                ),
                {
                    method:
                        'DELETE',
                },
            );

        if (!deleteResponse.ok) {
            throw new Error(
                await readErrorMessage(
                    deleteResponse,
                ),
            );
        }

        previewVersion += 1;

        await loadBucket(
            bucket.id,
        );

        setStatus(
            'Deleted. Atlas needs rebuild.',
        );
    } catch (error) {
        showError(error);
    }
}

async function rebuildAtlas():
    Promise<void> {
    uploadButton.disabled = true;
    rebuildAtlasButton.disabled = true;

    setStatus(
        'Rebuilding atlas…',
    );

    try {
        const response =
            await fetch(
                '/__assets/rebuild-atlas',
                {
                    method: 'POST',
                },
            );

        if (!response.ok) {
            throw new Error(
                await readErrorMessage(
                    response,
                ),
            );
        }

        setStatus(
            'Atlas rebuilt.',
        );
    } catch (error) {
        showError(error);
    } finally {
        uploadButton.disabled = false;
        rebuildAtlasButton.disabled = false;
    }
}

async function sendPng(
    url: string,
    method: 'POST' | 'PUT',
    file: File,
): Promise<void> {
    const response =
        await fetch(
            url,
            {
                method,

                headers: {
                    'Content-Type':
                        'image/png',
                },

                body:
                    await file
                        .arrayBuffer(),
            },
        );

    if (!response.ok) {
        throw new Error(
            await readErrorMessage(
                response,
            ),
        );
    }
}

function render(): void {
    renderBucketList();
    renderAssetList();
    renderInspector();
}

function renderBucketList(): void {
    bucketList.replaceChildren();

    for (
        const summary of
        bucketSummaries
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
            bucket?.id
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
                    bucket?.id
                ) {
                    return;
                }

                void loadBucket(
                    summary.id,
                ).catch(
                    showError,
                );
            },
        );

        bucketList.appendChild(
            button,
        );
    }
}

function renderAssetList(): void {
    assetList.replaceChildren();

    if (!bucket) {
        return;
    }

    for (
        const asset of
        bucket.assets
    ) {
        const button =
            document.createElement(
                'button',
            );

        button.type = 'button';
        button.className =
            'record-button';

        if (
            asset.id ===
            selectedAssetId
        ) {
            button.classList.add(
                'is-active',
            );
        }

        button.innerHTML =
            '<span class="record-label">' +
            escapeHtml(
                asset.id,
            ) +
            '</span>' +
            '<span class="record-id">' +
            escapeHtml(
                asset.frameKey,
            ) +
            '</span>';

        button.addEventListener(
            'click',
            () => {
                selectedAssetId =
                    asset.id;

                renderAssetList();
                renderInspector();
            },
        );

        assetList.appendChild(
            button,
        );
    }
}

function renderInspector(): void {
    inspector.replaceChildren();

    const asset =
        getSelectedAsset();

    if (!asset) {
        inspector.innerHTML =
            '<div class="empty-state">' +
            'No assets in this bucket yet.' +
            '</div>';

        return;
    }

    const heading =
        document.createElement(
            'div',
        );

    heading.className =
        'inspector-heading';

    const title =
        document.createElement(
            'h2',
        );

    title.textContent =
        asset.id;

    const code =
        document.createElement(
            'code',
        );

    code.textContent =
        asset.frameKey;

    heading.append(
        title,
        code,
    );

    const previewShell =
        document.createElement(
            'div',
        );

    previewShell.className =
        'asset-preview-shell';

    const image =
        document.createElement(
            'img',
        );

    image.className =
        'asset-preview-image';

    image.alt =
        asset.id;

    image.src =
        asset.previewUrl +
        '?v=' +
        previewVersion;

    previewShell.appendChild(
        image,
    );

    const metadata =
        document.createElement(
            'div',
        );

    metadata.className =
        'asset-metadata';

    metadata.append(
        createMetadataRow(
            'Asset ID',
            asset.id,
        ),
        createMetadataRow(
            'Atlas frame',
            asset.frameKey,
        ),
        createMetadataRow(
            'Raw file',
            asset.rawPath,
        ),
    );

    const actions =
        document.createElement(
            'div',
        );

    actions.className =
        'asset-actions';

    const replaceButton =
        document.createElement(
            'button',
        );

    replaceButton.type =
        'button';

    replaceButton.className =
        'secondary-button';

    replaceButton.textContent =
        'Replace PNG';

    replaceButton.addEventListener(
        'click',
        () => {
            replaceInput.value = '';
            replaceInput.click();
        },
    );

    const deleteButton =
        document.createElement(
            'button',
        );

    deleteButton.type =
        'button';

    deleteButton.className =
        'danger-button';

    deleteButton.textContent =
        'Delete Asset';

    deleteButton.addEventListener(
        'click',
        () => {
            void deleteSelectedAsset();
        },
    );

    actions.append(
        replaceButton,
        deleteButton,
    );

    const help =
        document.createElement(
            'div',
        );

    help.className =
        'asset-help';

    help.textContent =
        (
            'Preview uses the raw PNG directly. ' +
            'Upload, replace and delete mark the atlas as stale; ' +
            'use Rebuild Atlas before testing in the game.'
        );

    inspector.append(
        heading,
        previewShell,
        metadata,
        actions,
        help,
    );
}

function getDeleteBlockerMessage(
    assetId: string,
    info: AssetDeleteInfo,
): string | undefined {
    const lines:
        string[] = [];

    if (info.isProtected) {
        lines.push(
            'Protected built-in sprite id.',
        );
    }

    if (info.usages.length > 0) {
        lines.push(
            (
                'Used by ' +
                info.usages.length +
                ' configuration' +
                (
                    info.usages.length === 1
                        ? ''
                        : 's'
                ) +
                ':'
            ),
        );

        for (
            const usage of
            info.usages
        ) {
            lines.push(
                (
                    '- ' +
                    usage.collection +
                    ': ' +
                    usage.label +
                    ' [' +
                    usage.recordId +
                    ']'
                ),
            );
        }
    }

    if (lines.length === 0) {
        return undefined;
    }

    return (
        'Cannot delete "' +
        assetId +
        '".\n\n' +
        lines.join('\n')
    );
}

function createMetadataRow(
    labelText: string,
    valueText: string,
): HTMLElement {
    const row =
        document.createElement(
            'div',
        );

    row.className =
        'asset-metadata-row';

    const label =
        document.createElement(
            'div',
        );

    label.className =
        'asset-metadata-label';

    label.textContent =
        labelText;

    const value =
        document.createElement(
            'div',
        );

    value.className =
        'asset-metadata-value';

    value.textContent =
        valueText;

    row.append(
        label,
        value,
    );

    return row;
}

function getSelectedAsset():
    AssetRecord | undefined {
    return bucket
        ?.assets
        .find((asset) => {
            return (
                asset.id ===
                selectedAssetId
            );
        });
}

function createSuggestedAssetId(
    filename: string,
): string {
    const withoutExtension =
        filename.replace(
            /\.png$/i,
            '',
        );

    let result =
        withoutExtension
            .toLowerCase()
            .replace(
                /[^a-z0-9]+/g,
                '_',
            )
            .replace(
                /^_+|_+$/g,
                '',
            );

    if (
        !/^[a-z]/.test(
            result,
        )
    ) {
        result =
            'asset_' +
            result;
    }

    return (
        result ||
        'asset_00'
    );
}

function getBucketUrl(
    bucketId: string,
): string {
    return (
        '/__assets/' +
        encodeURIComponent(
            bucketId,
        )
    );
}

function getAssetUrl(
    bucketId: string,
    assetId: string,
): string {
    return (
        getBucketUrl(
            bucketId,
        ) +
        '/' +
        encodeURIComponent(
            assetId,
        )
    );
}

function setStatus(
    text: string,
    isError = false,
): void {
    status.textContent = text;

    status.classList.toggle(
        'is-error',
        isError,
    );
}

function showError(
    error: unknown,
): void {
    setStatus(
        getErrorMessage(error),
        true,
    );
}

async function readErrorMessage(
    response: Response,
): Promise<string> {
    try {
        const payload =
            await response.json() as
                ErrorPayload;

        return (
            payload.error ??
            (
                'Request failed: ' +
                response.status
            )
        );
    } catch {
        return (
            'Request failed: ' +
            response.status
        );
    }
}

function getElement(
    id: string,
): HTMLElement {
    const element =
        document.getElementById(
            id,
        );

    if (!element) {
        throw new Error(
            (
                'Missing asset-manager element: ' +
                id
            ),
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
            (
                'Asset-manager element is not a button: ' +
                id
            ),
        );
    }

    return element;
}

function getFileInput(
    id: string,
): HTMLInputElement {
    const element =
        getElement(id);

    if (
        !(
            element instanceof
            HTMLInputElement
        ) ||
        element.type !== 'file'
    ) {
        throw new Error(
            (
                'Asset-manager element is not a file input: ' +
                id
            ),
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
