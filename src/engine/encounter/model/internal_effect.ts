export const ENCOUNTER_INTERNAL_EFFECT = {
    INTERRUPT_RANDOM_PLAYER_OFFICER_TASK: "interrupt_random_player_officer_task",
    PURGE_PLAYER_SPAM_CHANNEL: "purge_player_spam_channel",
} as const;

export type EncounterInternalEffect =
    | {
          kind: typeof ENCOUNTER_INTERNAL_EFFECT.INTERRUPT_RANDOM_PLAYER_OFFICER_TASK;
      }
    | {
          kind: typeof ENCOUNTER_INTERNAL_EFFECT.PURGE_PLAYER_SPAM_CHANNEL;
          channelId: string;
          targetActorId: string;
      };

// Synchronous boundary for the two real encounter ownership cycles.
// This is not an outbox: the effect is applied immediately at the call site.
export type EncounterInternalEffectSink = (effect: EncounterInternalEffect) => boolean | void;
