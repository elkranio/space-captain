import { DEBUG_START } from "../../content/catalogs/debug_start";
import { SHIPS } from "../../content/catalogs/ships";
import type { PlayerShipState } from "../../defs/player";
import ShipFactory, { type CreatedShipState } from "../ship/ShipFactory";

export function createDebugStartPlayerShip(): PlayerShipState {
    return ShipFactory.createFromPreset(SHIPS[DEBUG_START.playerShipId]);
}

export function createDebugStartEnemyShip(): CreatedShipState {
    return ShipFactory.createFromPreset(SHIPS[DEBUG_START.enemyShipId]);
}
