import { describe, expect, it } from 'vitest';
import CombatActionHintMapper from '../../src/app/scenes/game/bridge/controller/encounter/officer_stations/CombatActionHintMapper';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../src/engine/encounter/model/command';

describe('CombatActionHintMapper', () => {
    it('deduplicates command variants into shared action hints', () => {
        const mapper = new CombatActionHintMapper();

        expect(
            mapper.map([
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_INTERCEPT_MISSILE),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_LASER),
            ]),
        ).toEqual(['INTERCEPT MISSILE', 'ATTACK ENEMY']);
    });

    it('uses fixed urgency and returns no more than two hints', () => {
        const mapper = new CombatActionHintMapper();

        expect(
            mapper.map([
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT),
            ]),
        ).toEqual(['CLEAR MINE', 'ANALYZE THREAT']);
    });

    it('ignores commands that have no combat hint', () => {
        const mapper = new CombatActionHintMapper();

        expect(
            mapper.map([
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK),
                createCommand(ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP),
            ]),
        ).toEqual([]);
    });
});

function createCommand(commandId: EncounterOfficerCommandId): AvailableOfficerCommand {
    return {
        commandId,
        label: commandId,

        target: {
            kind: OFFICER_COMMAND_TARGET_KIND.NONE,
        },
    };
}
