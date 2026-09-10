export type JsonSchema = {
    type?:
        string |
        string[];
    title?: string;
    description?: string;
    minimum?: number;
    unit?: string;
    enum?: Array<string | number>;
    anyOf?: JsonSchema[];
    properties?: Record<string, JsonSchema>;

    additionalProperties?:
        JsonSchema |
        boolean;

    'x-editor-asset-bucket'?:
        string;

    'x-editor-content-reference'?:
        string[];
};

export function createSchemaField(
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
    onChange: (value: unknown) => void,
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

    const labelTitle =
        document.createElement(
            'span',
        );

    labelTitle.className =
        'field-label-title';

    labelTitle.textContent =
        schema.title ??
        fieldName;

    label.appendChild(
        labelTitle,
    );

    if (schema.description) {
        const description =
            document.createElement(
                'span',
            );

        description.className =
            'field-description';

        description.textContent =
            schema.description;

        label.appendChild(
            description,
        );
    }

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
                onChange(
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

                onChange(
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
                onChange(
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

        const nullableString =
            isNullableStringSchema(
                schema,
            );

        input.value =
            typeof value === 'string'
                ? value
                : '';

        input.addEventListener(
            'input',
            () => {
                onChange(
                    (
                        nullableString &&
                        input.value === ''
                    )
                        ? null
                        : input.value,
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

export function isNullableStringSchema(
    schema: JsonSchema,
): boolean {
    if (
        Array.isArray(
            schema.type,
        )
    ) {
        return (
            schema.type.includes(
                'string',
            ) &&
            schema.type.includes(
                'null',
            )
        );
    }

    const variants =
        schema.anyOf ?? [];

    return (
        variants.some(
            (variant) => {
                return (
                    variant.type ===
                    'string'
                );
            },
        ) &&
        variants.some(
            (variant) => {
                return (
                    variant.type ===
                    'null'
                );
            },
        )
    );
}

type ContentReferenceRecord =
    Record<string, unknown>;

type ContentReferenceCollection = {
    label: string;
    data: Record<
        string,
        ContentReferenceRecord
    >;
};

type AssetReference = {
    id: string;
    previewUrl: string;
};

type AssetReferenceBucket = {
    assets: AssetReference[];
};

export function createContentReferenceField(
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
    sourceCollectionIds: string[],
    loadCollection:
        (
            collectionId: string,
        ) => Promise<ContentReferenceCollection>,
    onChange:
        (value: string | null) => void,
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

    const labelTitle =
        document.createElement(
            'span',
        );

    labelTitle.className =
        'field-label-title';

    labelTitle.textContent =
        schema.title ??
        fieldName;

    label.appendChild(
        labelTitle,
    );

    if (schema.description) {
        const description =
            document.createElement(
                'span',
            );

        description.className =
            'field-description';

        description.textContent =
            schema.description;

        label.appendChild(
            description,
        );
    }

    const control =
        document.createElement(
            'div',
        );

    control.className =
        'field-control';

    const select =
        document.createElement(
            'select',
        );

    const loadingOption =
        document.createElement(
            'option',
        );

    loadingOption.textContent =
        'Loading content…';

    select.appendChild(
        loadingOption,
    );

    select.disabled = true;

    control.appendChild(
        select,
    );

    wrapper.append(
        label,
        control,
    );

    const nullable =
        isNullableStringSchema(
            schema,
        );

    const currentValue =
        typeof value === 'string'
            ? value
            : null;

    void populateContentReferenceField(
        select,
        sourceCollectionIds,
        currentValue,
        nullable,
        loadCollection,
        onChange,
    );

    return wrapper;
}

async function populateContentReferenceField(
    select: HTMLSelectElement,
    sourceCollectionIds: string[],
    currentValue: string | null,
    nullable: boolean,
    loadCollection:
        (
            collectionId: string,
        ) => Promise<ContentReferenceCollection>,
    onChange:
        (value: string | null) => void,
): Promise<void> {
    try {
        const sources =
            await Promise.all(
                sourceCollectionIds
                    .map(
                        loadCollection,
                    ),
            );

        select.replaceChildren();

        if (nullable) {
            const none =
                document.createElement(
                    'option',
                );

            none.value = '';
            none.textContent =
                '— None —';

            select.appendChild(
                none,
            );
        }

        let optionCount = 0;
        let currentFound =
            currentValue === null;

        for (
            const source of
            sources
        ) {
            const entries =
                Object.entries(
                    source.data,
                );

            if (entries.length === 0) {
                continue;
            }

            const parent:
                HTMLSelectElement |
                HTMLOptGroupElement =
                sources.length > 1
                    ? document.createElement(
                        'optgroup',
                    )
                    : select;

            if (
                parent instanceof
                HTMLOptGroupElement
            ) {
                parent.label =
                    source.label;
            }

            for (
                const [
                    referenceId,
                    record,
                ] of entries
            ) {
                const option =
                    document.createElement(
                        'option',
                    );

                option.value =
                    referenceId;

                option.textContent =
                    getContentReferenceOptionLabel(
                        referenceId,
                        record,
                    );

                parent.appendChild(
                    option,
                );

                optionCount += 1;

                if (
                    referenceId ===
                    currentValue
                ) {
                    currentFound =
                        true;
                }
            }

            if (
                parent instanceof
                HTMLOptGroupElement
            ) {
                select.appendChild(
                    parent,
                );
            }
        }

        if (
            currentValue !== null &&
            !currentFound
        ) {
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

        if (
            optionCount === 0 &&
            !nullable &&
            currentValue === null
        ) {
            const empty =
                document.createElement(
                    'option',
                );

            empty.textContent =
                'No records available';

            select.appendChild(
                empty,
            );

            select.disabled = true;

            return;
        }

        select.value =
            currentValue ?? '';

        select.disabled = false;

        select.addEventListener(
            'change',
            () => {
                onChange(
                    (
                        nullable &&
                        select.value === ''
                    )
                        ? null
                        : select.value,
                );
            },
        );
    } catch (error) {
        select.replaceChildren();

        const failed =
            document.createElement(
                'option',
            );

        failed.textContent =
            'Failed to load: ' +
            getErrorMessage(error);

        select.appendChild(
            failed,
        );

        select.disabled = true;
    }
}

function getContentReferenceOptionLabel(
    referenceId: string,
    record: ContentReferenceRecord,
): string {
    const label =
        typeof record.name ===
            'string'
            ? record.name
            : (
                typeof record.label ===
                    'string'
                    ? record.label
                    : undefined
            );

    if (
        !label ||
        label === referenceId
    ) {
        return referenceId;
    }

    return (
        label +
        ' [' +
        referenceId +
        ']'
    );
}

export function createAssetReferenceField(
    fieldName: string,
    schema: JsonSchema,
    value: unknown,
    bucketId: string,
    loadBucket:
        (
            bucketId: string,
        ) => Promise<AssetReferenceBucket>,
    onChange: (value: string) => void,
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
        loadBucket,
        onChange,
    );

    return wrapper;
}

async function populateAssetReferenceField(
    select: HTMLSelectElement,
    preview: HTMLElement,
    bucketId: string,
    currentValue: string,
    loadBucket:
        (
            bucketId: string,
        ) => Promise<AssetReferenceBucket>,
    onChange:
        (value: string) => void,
): Promise<void> {
    try {
        const bucket =
            await loadBucket(
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
    assets: AssetReference[],
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

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : String(error);
}
