import debugStartData from "../data/debug_start.json";
import { DEBUG_START_SCHEMA } from "../schemas/debug_start";
import { SHIPS } from "./ships";

export const DEBUG_START = DEBUG_START_SCHEMA.parse(debugStartData);

for (const [field, shipId] of Object.entries(DEBUG_START)) {
    if (!Object.hasOwn(SHIPS, shipId)) {
        throw new Error("Debug Start " + field + " references missing ship: " + shipId);
    }
}
