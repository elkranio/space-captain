// src/engine/content/catalogs/crew_actions.ts

import crewActionsData from "../data/crew_actions.json";
import { CREW_ACTIONS_SCHEMA } from "../schemas/crew_actions";

export const CREW_ACTIONS = CREW_ACTIONS_SCHEMA.parse(crewActionsData);
