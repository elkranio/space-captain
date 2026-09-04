import { DEFENSE_TURRETS } from "../../../content/catalogs/defense_turrets";
import { SHIELD_GENERATORS } from "../../../content/catalogs/shield_generators";
import { SHIP_DRIVES } from "../../../content/catalogs/ship_drives";
import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import {
    PLAYER_SPACE_NAVIGATION_KIND,
    type PlayerSpaceNavigationState,
} from "../../../defs/player_location";
import type { ShipEquipmentMountState } from "../../../defs/ship_slot";
import type { ShipWeaponKind } from "../../../defs/ship_weapon";
import type { PlayerBeamTarget } from "../../model/combat";
import type { EncounterState } from "../../model/state";
import { OFFICER_ROLE } from "../../../defs/officer";
import { OFFICER_TASK_KIND } from "../../model/officer_task";

export type EnemyShipDashboardEquipmentSnapshot = {
    id: string;
    definitionId: string;

    integrity: {
        current: number;
        max: number;
    };
};

export type EnemyShipDashboardWeaponSnapshot = EnemyShipDashboardEquipmentSnapshot & {
    kind: ShipWeaponKind;
};

export type EnemyShipDashboardSnapshot = {
    // Public player intent, derived from the active Gunner task; no enemy crew truth is exposed.
    beamTarget?: PlayerBeamTarget;
    actorId: string;
    displayName: string;
    chassisId: string;

    hull: {
        current: number;
        max: number;
    };

    mounts: ShipEquipmentMountState[];

    drive: EnemyShipDashboardEquipmentSnapshot;

    defenseTurret?: EnemyShipDashboardEquipmentSnapshot;

    shieldGenerator?: EnemyShipDashboardEquipmentSnapshot;

    weapons: EnemyShipDashboardWeaponSnapshot[];
};

// Read-only public enemy loadout for the persistent captain dashboard.
// Deliberately excludes ammo, cooldowns, crew tasks and AI decision state.
export function getEnemyShipDashboardSnapshots(state: EncounterState): EnemyShipDashboardSnapshot[] {
    const anchorId = getCurrentNavigationAnchorId(state.navigation);
    const task = state.officerTasks[OFFICER_ROLE.GUNNER];

    return state.actors
        .filter((actor) => {
            return actor.team === ENCOUNTER_TEAM.ENEMY && actor.anchorId === anchorId;
        })
        .map((actor) => {
            const driveDefinition = SHIP_DRIVES[actor.drive.driveId];

            if (!driveDefinition) {
                throw new Error("Enemy dashboard Drive definition not found: " + actor.drive.driveId);
            }

            return {
                ...(task?.kind === OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON &&
                    task.targetActorId === actor.id
                    ? { beamTarget: { ...task.target } } : {}),
                actorId: actor.id,
                displayName: actor.displayName,
                chassisId: actor.chassisId,

                hull: {
                    current: actor.hull,
                    max: actor.maxHull,
                },

                mounts: actor.mounts.map((mount) => ({ ...mount })),

                drive: {
                    id: actor.drive.id,
                    definitionId: actor.drive.driveId,

                    integrity: {
                        current: actor.drive.integrity,
                        max: driveDefinition.maxIntegrity,
                    },
                },

                ...mapDefenseTurret(actor),

                ...mapShieldGenerator(actor),

                weapons: actor.weapons.map((weapon) => {
                    const definition = SHIP_WEAPONS[weapon.weaponId];

                    if (!definition) {
                        throw new Error("Enemy dashboard weapon definition not found: " + weapon.weaponId);
                    }

                    return {
                        id: weapon.id,
                        definitionId: weapon.weaponId,
                        kind: weapon.kind,

                        integrity: {
                            current: weapon.integrity,
                            max: definition.maxIntegrity,
                        },
                    };
                }),
            };
        });
}

function mapDefenseTurret(
    actor: EncounterState["actors"][number],
): Pick<EnemyShipDashboardSnapshot, "defenseTurret"> {
    const defenseTurret = actor.defenseTurret;

    if (!defenseTurret) {
        return {};
    }

    const definition = DEFENSE_TURRETS[defenseTurret.defenseTurretId];

    if (!definition) {
        throw new Error(
            "Enemy dashboard Defense Turret definition not found: " + defenseTurret.defenseTurretId,
        );
    }

    return {
        defenseTurret: {
            id: defenseTurret.id,
            definitionId: defenseTurret.defenseTurretId,

            integrity: {
                current: defenseTurret.integrity,
                max: definition.maxIntegrity,
            },
        },
    };
}

function mapShieldGenerator(
    actor: EncounterState["actors"][number],
): Pick<EnemyShipDashboardSnapshot, "shieldGenerator"> {
    const shieldGenerator = actor.shieldGenerator;

    if (!shieldGenerator) {
        return {};
    }

    const definition = SHIELD_GENERATORS[shieldGenerator.shieldGeneratorId];

    if (!definition) {
        throw new Error(
            "Enemy dashboard Shield Generator definition not found: " + shieldGenerator.shieldGeneratorId,
        );
    }

    return {
        shieldGenerator: {
            id: shieldGenerator.id,
            definitionId: shieldGenerator.shieldGeneratorId,

            integrity: {
                current: shieldGenerator.integrity,
                max: definition.maxIntegrity,
            },
        },
    };
}

function getCurrentNavigationAnchorId(navigation: PlayerSpaceNavigationState): string {
    switch (navigation.kind) {
        case PLAYER_SPACE_NAVIGATION_KIND.ARRIVING:
            return navigation.targetAnchorId;

        case PLAYER_SPACE_NAVIGATION_KIND.ANCHORED:
            return navigation.anchorId;

        case PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING:
            return navigation.targetAnchorId;

        default:
            return assertNever(navigation);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unhandled player navigation: ${String(value)}`);
}
