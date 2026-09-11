import { describe, expect, it } from 'vitest';
import * as z from 'zod';
import missileData from '../../../src/engine/content/data/missile_launchers.json';
import mineData from '../../../src/engine/content/data/sticky_mine_dispensers.json';
import turretData from '../../../src/engine/content/data/defense_turrets.json';
import shieldData from '../../../src/engine/content/data/shield_generators.json';
import driveData from '../../../src/engine/content/data/ship_drives.json';
import {
    MISSILE_LAUNCHER_RECORD_SCHEMA, STICKY_MINE_DISPENSER_RECORD_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';
import { DEFENSE_TURRET_RECORD_SCHEMA } from '../../../src/engine/content/schemas/defense_turrets';
import { SHIELD_GENERATOR_RECORD_SCHEMA } from '../../../src/engine/content/schemas/shield_generators';
import { SHIP_DRIVE_RECORD_SCHEMA } from '../../../src/engine/content/schemas/ship_drives';

describe('Equipment execution authoring', () => {
    it.each([
        ['missile', MISSILE_LAUNCHER_RECORD_SCHEMA, missileData.missile_launcher_00, 'targetingDurationMs'],
        ['mine', STICKY_MINE_DISPENSER_RECORD_SCHEMA, mineData.sticky_mine_dispenser_00, 'targetingDurationMs'],
        ['turret', DEFENSE_TURRET_RECORD_SCHEMA, turretData.defense_turret_basic_00, 'loadDurationMs'],
        ['shield', SHIELD_GENERATOR_RECORD_SCHEMA, shieldData.shield_generator_basic_00, 'deploymentDurationMs'],
        ['drive', SHIP_DRIVE_RECORD_SCHEMA, driveData.basic_00, 'repairDurationMs'],
    ] as const)('validates %s duration and exports the editor duration control', (_, schema, data, field) => {
        expect(schema.safeParse(data).success).toBe(true);
        for (const value of [0, 1750]) {
            expect(schema.safeParse({ ...data, [field]: value }).success).toBe(true);
        }
        for (const value of [-1, 1.5, Infinity, NaN, '1000', undefined]) {
            expect(schema.safeParse({ ...data, [field]: value }).success).toBe(false);
        }
        expect(z.toJSONSchema(schema).properties?.[field]).toMatchObject({
            type: 'integer', minimum: 0, unit: 'ms', 'x-editor-control': 'duration',
        });
    });
});
