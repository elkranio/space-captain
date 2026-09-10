import { describe, expect, it } from 'vitest';
import { getContentCollectionJsonSchema } from '../../tools/content-editor/server/content_registry';
import type { JsonSchema } from '../../tools/content-editor/src/schema_field';

describe('Content editor ship references', () => {
    it('offers the same ship catalog for both starting roles', () => {
        const schema = getContentCollectionJsonSchema('debug_start') as JsonSchema;
        expect(Object.keys(schema.properties ?? {})).toEqual(['playerShipId', 'enemyShipId']);
        for (const field of Object.values(schema.properties ?? {})) {
            expect(field.type).toBe('string');
            expect(field['x-editor-content-reference']).toEqual(['ships']);
        }
    });

    it('keeps chassis and equipment metadata on Ships', () => {
        const schema = getContentCollectionJsonSchema('ships') as {
            additionalProperties: { properties: {
                chassisId: { 'x-editor-content-reference': string[] };
                equipment: { items: { oneOf: Array<{ properties: {
                    type: { const: string };
                    equipmentId: { 'x-editor-content-reference': string[] };
                } }> } };
            } };
        };
        const fields = schema.additionalProperties.properties;
        expect(fields.chassisId['x-editor-content-reference']).toEqual(['ship_chassis']);
        const core = fields.equipment.items.oneOf.find(item => item.properties.type.const === 'power_core');
        expect(core?.properties.equipmentId['x-editor-content-reference']).toEqual(['power_cores']);
    });
});
