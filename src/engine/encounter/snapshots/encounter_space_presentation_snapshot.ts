import type {
    AsteroidObjectSpriteId,
} from '../../defs/asteroid';
import type {
    BeaconObjectSpriteId,
} from '../../defs/beacon';
import type {
    JumpPointObjectSpriteId,
} from '../../defs/jump_point';
import type {
    ShipChassisId,
} from '../../defs/ship_chassis';
import type {
    StationObjectSpriteId,
} from '../../defs/station';
import {
    ENCOUNTER_ACTOR_KIND,
    type EncounterActorState,
} from '../actors/encounter_actor';
import {
    ENCOUNTER_ANCHOR_KIND,
    type EncounterAnchorBaseState,
    type EncounterAnchorState,
} from '../anchors/encounter_anchor';
import type {
    EncounterState,
} from '../model/state';

type EncounterSpaceAnchorBasePresentationSnapshot = {
    id:
        EncounterAnchorBaseState[
            'id'
        ];

    localPosition:
        EncounterAnchorBaseState[
            'localPosition'
        ];

    position:
        EncounterAnchorBaseState[
            'position'
        ];

    perspectiveDepth:
        EncounterAnchorBaseState[
            'perspectiveDepth'
        ];
};

export type EncounterSpaceAnchorPresentationSnapshot =
    EncounterSpaceAnchorBasePresentationSnapshot &
        (
            | {
                  kind:
                      typeof ENCOUNTER_ANCHOR_KIND
                          .STATION;

                  station: {
                      objectSpriteId:
                          StationObjectSpriteId;
                  };
              }
            | {
                  kind:
                      typeof ENCOUNTER_ANCHOR_KIND
                          .NAVIGATION_BEACON;

                  beacon: {
                      objectSpriteId:
                          BeaconObjectSpriteId;
                  };
              }
            | {
                  kind:
                      typeof ENCOUNTER_ANCHOR_KIND
                          .ASTEROID;

                  asteroid: {
                      objectSpriteId:
                          AsteroidObjectSpriteId;
                  };
              }
            | {
                  kind:
                      typeof ENCOUNTER_ANCHOR_KIND
                          .JUMP_POINT;

                  jumpPoint: {
                      objectSpriteId:
                          JumpPointObjectSpriteId;
                  };
              }
        );

export type EncounterSpaceActorPresentationSnapshot = {
    kind:
        typeof ENCOUNTER_ACTOR_KIND
            .SHIP;

    id: string;
    anchorId: string;

    chassisId:
        ShipChassisId;
};

export type EncounterSpacePresentationSnapshot = {
    anchors:
        EncounterSpaceAnchorPresentationSnapshot[];

    actors:
        EncounterSpaceActorPresentationSnapshot[];
};

export function createEncounterSpacePresentationSnapshot(
    state:
        EncounterState,
): EncounterSpacePresentationSnapshot {
    return {
        anchors:
            state.anchors.map(
                createAnchorPresentationSnapshot,
            ),

        actors:
            state.actors.map(
                createActorPresentationSnapshot,
            ),
    };
}

function createAnchorPresentationSnapshot(
    anchor:
        EncounterAnchorState,
): EncounterSpaceAnchorPresentationSnapshot {
    const base = {
        id:
            anchor.id,

        localPosition: {
            ...anchor.localPosition,
        },

        position: {
            ...anchor.position,
        },

        perspectiveDepth:
            anchor.perspectiveDepth,
    };

    switch (anchor.kind) {
        case ENCOUNTER_ANCHOR_KIND.STATION:
            return {
                ...base,
                kind:
                    anchor.kind,

                station: {
                    objectSpriteId:
                        anchor.station
                            .objectSpriteId,
                },
            };

        case ENCOUNTER_ANCHOR_KIND
            .NAVIGATION_BEACON:
            return {
                ...base,
                kind:
                    anchor.kind,

                beacon: {
                    objectSpriteId:
                        anchor.beacon
                            .objectSpriteId,
                },
            };

        case ENCOUNTER_ANCHOR_KIND.ASTEROID:
            return {
                ...base,
                kind:
                    anchor.kind,

                asteroid: {
                    objectSpriteId:
                        anchor.asteroid
                            .objectSpriteId,
                },
            };

        case ENCOUNTER_ANCHOR_KIND.JUMP_POINT:
            return {
                ...base,
                kind:
                    anchor.kind,

                jumpPoint: {
                    objectSpriteId:
                        anchor.jumpPoint
                            .objectSpriteId,
                },
            };

        default:
            return assertNeverAnchor(
                anchor,
            );
    }
}

function createActorPresentationSnapshot(
    actor:
        EncounterActorState,
): EncounterSpaceActorPresentationSnapshot {
    return {
        kind:
            actor.kind,

        id:
            actor.id,

        anchorId:
            actor.anchorId,

        chassisId:
            actor.chassisId,
    };
}

function assertNeverAnchor(
    value:
        never,
): never {
    throw new Error(
        `Unhandled encounter anchor presentation kind: ${String(value)}`,
    );
}
