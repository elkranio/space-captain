import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SHIPS_SCHEMA, type ShipsData } from '../../src/engine/content/schemas/ships';
import { handleContentRequest } from '../../tools/content-editor/server/content_api';

let root: string;
let ships: ShipsData;
beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'space-captain-ships-test-'));
    await cp('src/engine/content/data', path.join(root, 'src/engine/content/data'), { recursive: true });
    await cp('src/app/manifests/world/ships', path.join(root, 'src/app/manifests/world/ships'), { recursive: true });
    ships = SHIPS_SCHEMA.parse(await readData('ships'));
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

async function readData(collection: string) {
    return JSON.parse(await readFile(path.join(root, 'src/engine/content/data', collection + '.json'), 'utf8'));
}

async function request(collection: string, data?: unknown) {
    const input = Readable.from(data === undefined ? [] : [Buffer.from(JSON.stringify(data))]);
    Object.assign(input, { method: data === undefined ? 'GET' : 'POST', url: '/__content/' + collection });
    let body: { data?: unknown; error?: string } = {};
    const response = { statusCode: 200, setHeader() {}, end(text: string) { body = JSON.parse(text); } };
    await handleContentRequest(root, input as IncomingMessage, response as unknown as ServerResponse);
    return { status: response.statusCode, body };
}

describe('Ships editor save and reference integrity', () => {
    it('saves a variant and a renamed display name without changing the source or starting references', async () => {
        const start = await readData('debug_start');
        const sourceId = start.playerShipId;
        const draft = structuredClone(ships);
        draft.variant = structuredClone(draft[sourceId]);
        draft.variant.name = 'Variant';
        draft.variant.equipment = draft.variant.equipment.filter(mount => mount.type === 'drive');
        draft[sourceId].name = 'Renamed ship';
        expect((await request('ships', draft)).status).toBe(200);
        expect((await request('ships')).body.data).toEqual(draft);
        expect(await readData('debug_start')).toEqual(start);
        expect(draft[sourceId].equipment).toEqual(ships[sourceId].equipment);

        expect((await request('debug_start', { playerShipId: 'variant', enemyShipId: 'variant' })).status).toBe(200);
        expect(await readData('debug_start')).toEqual({ playerShipId: 'variant', enemyShipId: 'variant' });
        delete draft.variant;
        expect((await request('ships', draft)).status).toBe(409);
        expect((await readData('ships')).variant).toBeDefined();

        expect((await request('debug_start', start)).status).toBe(200);
        expect((await request('ships', draft)).status).toBe(200);
        expect((await readData('ships')).variant).toBeUndefined();
    });

    it('blocks a referenced ID rename and missing Starting Ships references before writing', async () => {
        const start = await readData('debug_start');
        const draft = structuredClone(ships);
        draft.renamed = draft[start.playerShipId];
        delete draft[start.playerShipId];
        expect((await request('ships', draft)).status).toBe(409);
        expect(await readData('ships')).toEqual(ships);
        expect((await request('debug_start', { ...start, enemyShipId: 'missing_ship' })).status).toBe(400);
        expect(await readData('debug_start')).toEqual(start);
    });

    it.each(['chassis', 'equipment', 'slot', 'slotKind', 'duplicateId', 'duplicateSlot', 'missingDrive', 'runtimeState'])(
        'rejects invalid %s without writing', async invalid => {
            const draft = structuredClone(ships);
            const ship = Object.values(draft)[0];
            const drive = ship.equipment.find(mount => mount.type === 'drive')!;
            if (invalid === 'chassis') ship.chassisId = 'missing_chassis';
            if (invalid === 'equipment') drive.equipmentId = 'missing_drive';
            if (invalid === 'slot') drive.slotId = 'missing_slot';
            if (invalid === 'slotKind') drive.slotId = 'hull';
            if (invalid === 'duplicateId') ship.equipment[1].id = drive.id;
            if (invalid === 'duplicateSlot') ship.equipment[1].slotId = drive.slotId;
            if (invalid === 'missingDrive') ship.equipment = ship.equipment.filter(mount => mount !== drive);
            if (invalid === 'runtimeState') Object.assign(drive, { integrity: 1 });
            expect((await request('ships', draft)).status).toBe(400);
            expect(await readData('ships')).toEqual(ships);
        },
    );

    it('cleans deleted optional slots in every saved build and leaves Starting Ships untouched', async () => {
        const start = await readData('debug_start');
        const sourceId = start.playerShipId;
        const ship = ships[sourceId];
        const mount = ship.equipment.find(mount => mount.type === 'weapon' || mount.type === 'defense_turret')!;
        ships.variant = structuredClone(ship);
        expect((await request('ships', ships)).status).toBe(200);
        const chassis = await readData('ship_chassis');
        chassis[ship.chassisId].slots = chassis[ship.chassisId].slots.filter((slot: { id: string }) => slot.id !== mount.slotId);
        expect((await request('ship_chassis', chassis)).status).toBe(200);
        const saved = SHIPS_SCHEMA.parse(await readData('ships'));
        for (const build of Object.values(saved).filter(build => build.chassisId === ship.chassisId)) {
            expect(build.equipment.some(item => item.slotId === mount.slotId)).toBe(false);
        }
        expect(await readData('debug_start')).toEqual(start);
    });

    it('blocks a Drive slot rename before either dependent file is written', async () => {
        const before = await readData('ship_chassis');
        const chassis = structuredClone(before);
        const ship = Object.values(ships)[0];
        const drive = ship.equipment.find(mount => mount.type === 'drive')!;
        chassis[ship.chassisId].slots.find((slot: { id: string }) => slot.id === drive.slotId).id = 'renamed_drive';
        const result = await request('ship_chassis', chassis);
        expect(result.status).toBe(409);
        expect(result.body.error).toContain('Choose another chassis for this ship first');
        expect(await readData('ship_chassis')).toEqual(before);
        expect(await readData('ships')).toEqual(ships);
    });
});
