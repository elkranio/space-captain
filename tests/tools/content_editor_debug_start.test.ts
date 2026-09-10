import { describe, expect, it } from 'vitest';
import debugStartData from '../../src/engine/content/data/debug_start.json';
import { DEBUG_START_SCHEMA } from '../../src/engine/content/schemas/debug_start';
import {
    getContentRecordDeleteInfo,
    validateContentCollectionReferences,
} from '../../tools/content-editor/server/content_references';

describe('Content editor Starting Ships', () => {
    it('accepts configured ships, swapped roles and the same ship for both sides', async () => {
        for (const data of [
            debugStartData,
            { playerShipId: debugStartData.enemyShipId, enemyShipId: debugStartData.playerShipId },
            { playerShipId: debugStartData.enemyShipId, enemyShipId: debugStartData.enemyShipId },
        ]) {
            await expect(validateContentCollectionReferences(process.cwd(), 'debug_start', data))
                .resolves.toBeUndefined();
        }
    });

    it.each(['playerShipId', 'enemyShipId'])('rejects missing %s', async field => {
        await expect(validateContentCollectionReferences(process.cwd(), 'debug_start', {
            ...debugStartData, [field]: 'missing_ship',
        })).rejects.toThrow('references missing ship "missing_ship"');
    });

    it('rejects the old embedded layout', () => {
        expect(DEBUG_START_SCHEMA.safeParse({ player: {}, enemy: {} }).success).toBe(false);
    });

    it('reports both starting ship references as deletion blockers', async () => {
        for (const [side, shipId] of [['player', debugStartData.playerShipId], ['enemy', debugStartData.enemyShipId]]) {
            const info = await getContentRecordDeleteInfo(process.cwd(), 'ships', shipId);
            expect(info.usages).toContainEqual({
                collection: 'Debug Start', recordId: side, label: side === 'player' ? 'Player Ship' : 'Enemy Ship',
            });
        }
    });
});
