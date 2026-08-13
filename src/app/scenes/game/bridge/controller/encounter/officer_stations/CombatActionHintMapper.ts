import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type AvailableOfficerCommand,
    type EncounterOfficerCommandId,
} from '../../../../../../../engine/encounter/model/command';

const MAX_COMBAT_ACTION_HINTS = 2;

type CombatActionHintDefinition = {
    id: string;
    label: string;
    priority: number;
};

const COMBAT_ACTION_HINT_BY_COMMAND_ID: Partial<
    Record<EncounterOfficerCommandId, CombatActionHintDefinition>
> = {
    [ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE]: {
        id: 'clear_mine',
        label: 'CLEAR MINE',
        priority: 10,
    },


    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_SIGNATURE_A]: {
        id: 'intercept_missile',
        label: 'INTERCEPT MISSILE',
        priority: 10,
    },
    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_SIGNATURE_B]: {
        id: 'intercept_missile',
        label: 'INTERCEPT MISSILE',
        priority: 10,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT]: {
        id: 'analyze_threat',
        label: 'ANALYZE THREAT',
        priority: 20,
    },
    [ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM]: {
        id: 'purge_spam',
        label: 'PURGE SPAM',
        priority: 30,
    },
    [ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE]: {
        id: 'repair_drive',
        label: 'REPAIR DRIVE',
        priority: 40,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_MISSILE]: {
        id: 'attack_enemy',
        label: 'ATTACK ENEMY',
        priority: 50,
    },
    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_STICKY_MINES]: {
        id: 'attack_enemy',
        label: 'ATTACK ENEMY',
        priority: 50,
    },
    [ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_LASER]: {
        id: 'attack_enemy',
        label: 'ATTACK ENEMY',
        priority: 50,
    },

    [ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO]: {
        id: 'escape',
        label: 'ESCAPE',
        priority: 60,
    },
};

// Collapses target/weapon variants into a short, stable monitor summary.
// Command availability remains the source of truth; this mapper only chooses
// which already-available actions deserve the two display lines.
export default class CombatActionHintMapper {
    public map(commands: readonly AvailableOfficerCommand[]): string[] {
        const hintById = new Map<string, CombatActionHintDefinition>();

        for (const command of commands) {
            const hint = COMBAT_ACTION_HINT_BY_COMMAND_ID[command.commandId];

            if (!hint || hintById.has(hint.id)) {
                continue;
            }

            hintById.set(hint.id, hint);
        }

        return [...hintById.values()]
            .sort((left, right) => {
                return left.priority - right.priority;
            })
            .slice(0, MAX_COMBAT_ACTION_HINTS)
            .map((hint) => {
                return hint.label;
            });
    }
}
