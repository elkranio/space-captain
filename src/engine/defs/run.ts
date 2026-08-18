// src/engine/defs/run.ts
import type { OfficerDefinition, OfficerRole } from "./officer";
import type { PlayerState } from "./player";
import type { UniverseState } from "./universe";

export type RunState = {
    universe: UniverseState;
    player: PlayerState;
    officers: Record<OfficerRole, OfficerDefinition>;
};
