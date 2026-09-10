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
