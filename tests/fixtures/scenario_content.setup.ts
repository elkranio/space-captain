// Fixed scenario input only. Live-content tests never load this setup.
// Keep catalogs, schemas, factories and gameplay implementation real.
import { vi } from "vitest";
import content from "./scenario_content.json";

vi.mock("../../src/engine/content/data/beam_cannons.json", () => ({
    default: structuredClone(content.beam_cannons),
}));
vi.mock("../../src/engine/content/data/debug_start.json", () => ({
    default: structuredClone(content.debug_start),
}));
vi.mock("../../src/engine/content/data/defense_turrets.json", () => ({
    default: structuredClone(content.defense_turrets),
}));
vi.mock("../../src/engine/content/data/enemy_behavior_rules.json", () => ({
    default: structuredClone(content.enemy_behavior_rules),
}));
vi.mock("../../src/engine/content/data/missile_launchers.json", () => ({
    default: structuredClone(content.missile_launchers),
}));
vi.mock("../../src/engine/content/data/officer_tasks_engineer.json", () => ({
    default: structuredClone(content.officer_tasks_engineer),
}));
vi.mock("../../src/engine/content/data/officer_tasks_gunner.json", () => ({
    default: structuredClone(content.officer_tasks_gunner),
}));
vi.mock("../../src/engine/content/data/officer_tasks_pilot.json", () => ({
    default: structuredClone(content.officer_tasks_pilot),
}));
vi.mock("../../src/engine/content/data/officer_tasks_scientist.json", () => ({
    default: structuredClone(content.officer_tasks_scientist),
}));
vi.mock("../../src/engine/content/data/power_cores.json", () => ({
    default: structuredClone(content.power_cores),
}));
vi.mock("../../src/engine/content/data/shield_generators.json", () => ({
    default: structuredClone(content.shield_generators),
}));
vi.mock("../../src/engine/content/data/ship_behaviors.json", () => ({
    default: structuredClone(content.ship_behaviors),
}));
vi.mock("../../src/engine/content/data/ship_chassis.json", () => ({
    default: structuredClone(content.ship_chassis),
}));
vi.mock("../../src/engine/content/data/ship_drives.json", () => ({
    default: structuredClone(content.ship_drives),
}));
vi.mock("../../src/engine/content/data/spam_projectors.json", () => ({
    default: structuredClone(content.spam_projectors),
}));
vi.mock("../../src/engine/content/data/sticky_mine_dispensers.json", () => ({
    default: structuredClone(content.sticky_mine_dispensers),
}));
