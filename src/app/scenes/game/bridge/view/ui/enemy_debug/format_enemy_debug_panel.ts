// src/app/scenes/game/bridge/view/ui/enemy_debug/format_enemy_debug_panel.ts

import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../../../../../../engine/defs/officer';
import {
    POINT_DEFENSE_PHASE,
    type PointDefensePhase,
} from '../../../../../../../engine/defs/point_defense';
import type {
    EnemyDebugProgressSnapshot,
    EnemyDebugRoleSnapshot,
    EnemyDebugSnapshot,
    EnemyDebugThreatSnapshot,
} from '../../../../../../../engine/encounter/debug/get_enemy_debug_snapshots';
import {
    ENEMY_THREAT_KIND,
    type EnemyThreatKind,
} from '../../../../../../../engine/encounter/model/enemy_threat_observation';

export type EnemyDebugPanelText = {
    crew: string;
    systems: string;
    threats: string;
};

const ROLE_ORDER = [
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
    OFFICER_ROLE.HELM,
] as const;

const MAX_VISIBLE_THREATS = 7;

export function formatEnemyDebugPanel(
    snapshot: EnemyDebugSnapshot,
): EnemyDebugPanelText {
    return {
        crew:
            ROLE_ORDER
                .map((role) => {
                    return formatRole(
                        role,
                        snapshot.roles,
                    );
                })
                .join('\n'),

        systems:
            formatSystems(
                snapshot,
            ),

        threats:
            formatThreats(
                snapshot.threats,
            ),
    };
}

function formatRole(
    role: OfficerRole,
    roles:
        readonly EnemyDebugRoleSnapshot[],
): string {
    const snapshot =
        roles.find((candidate) => {
            return (
                candidate.role === role
            );
        });

    const prefix =
        getRoleLabel(role)
            .padEnd(5, ' ');

    if (!snapshot) {
        return prefix + 'MISSING !';
    }

    if (!snapshot.present) {
        return snapshot.task
            ? prefix +
                  'ABSENT ' +
                  snapshot.task.label +
                  ' !'
            : prefix + 'ABSENT';
    }

    if (!snapshot.task) {
        return prefix + 'IDLE';
    }

    return (
        prefix +
        snapshot.task.label +
        formatTaskTargetTimer(
            snapshot.task
                .targetRemainingMs,
        ) +
        formatProgress(
            snapshot.task.progress,
        )
    );
}

function formatSystems(
    snapshot: EnemyDebugSnapshot,
): string {
    return [
        ...(snapshot
            .crewProgressMultiplier !==
        undefined
            ? [
                  'SPAM x' +
                      snapshot
                          .crewProgressMultiplier
                          .toFixed(1),
              ]
            : []),

        formatDefenseCapacitor(
            snapshot,
        ),

        formatPointDefense(
            snapshot,
        ),

        ...(snapshot.shield
            ? [
                  formatShield(
                      snapshot,
                  ),
              ]
            : []),
    ].join('   ');
}

function formatShield(
    snapshot: EnemyDebugSnapshot,
): string {
    const shield =
        snapshot.shield;

    if (!shield) {
        return 'SHD NONE';
    }

    const parts = [
        'SHD',

        shield.activeZone
            ?.toUpperCase() ??
            'OFF',
    ];

    if (
        shield.remainingMs !==
        undefined
    ) {
        parts.push(
            formatSeconds(
                shield.remainingMs,
            ),
        );
    }

    parts.push(
        shield.charges +
            '/' +
            shield.maxCharges,
    );

    return parts.join(' ');
}

function formatDefenseCapacitor(
    snapshot: EnemyDebugSnapshot,
): string {
    const defenseCapacitor =
        snapshot.defenseCapacitor;

    if (!defenseCapacitor) {
        return 'DEF NONE';
    }

    const parts = [
        'DEF',

        defenseCapacitor.charges +
            '/' +
            defenseCapacitor.capacity,
    ];

    if (
        defenseCapacitor
            .rechargeProgress
    ) {
        parts.push(
            formatProgressValue(
                defenseCapacitor
                    .rechargeProgress,
            ),
        );
    }

    return parts.join(' ');
}

function formatPointDefense(
    snapshot: EnemyDebugSnapshot,
): string {
    const pointDefense =
        snapshot.pointDefense;

    if (!pointDefense) {
        return 'PD NONE';
    }

    const parts = [
        'PD',
        getPointDefensePhaseLabel(
            pointDefense.phase,
        ),
    ];

    if (pointDefense.targetLabel) {
        parts.push(
            pointDefense.targetLabel,
        );
    }

    if (pointDefense.loadedBand) {
        parts.push(
            pointDefense.loadedBand
                .toUpperCase(),
        );
    }

    if (pointDefense.progress) {
        parts.push(
            formatProgressValue(
                pointDefense.progress,
            ),
        );
    }

    return parts.join(' ');
}

function formatThreats(
    threats:
        readonly EnemyDebugThreatSnapshot[],
): string {
    if (threats.length === 0) {
        return 'NONE';
    }

    if (
        threats.length <=
        MAX_VISIBLE_THREATS
    ) {
        return threats
            .map(formatThreat)
            .join('\n');
    }

    const visible =
        threats
            .slice(
                0,
                MAX_VISIBLE_THREATS - 1,
            )
            .map(formatThreat);

    visible.push(
        '+' +
            (threats.length -
                visible.length) +
            ' MORE',
    );

    return visible.join('\n');
}

function formatThreat(
    threat:
        EnemyDebugThreatSnapshot,
): string {
    const parts = [
        threat.label,
        getThreatKindLabel(
            threat.kind,
        ),
    ];

    if (threat.status === 'stale') {
        parts.push(
            'STALE',
            '!',
        );

        return parts.join(' ');
    }

    if (
        threat.remainingMs !==
        undefined
    ) {
        parts.push(
            getThreatTimerLabel(
                threat.kind,
            ),

            formatTimer(
                threat.remainingMs,
            ),
        );
    }

    if (
        threat.kind !==
        ENEMY_THREAT_KIND
            .STICKY_MINE
    ) {
        parts.push(
            'RPT',
            threat.report
                ?.toUpperCase() ??
                '?',

            'TRUE',
            threat.truth
                ?.toUpperCase() ??
                '?',
        );
    }

    if (threat.mismatch) {
        parts.push('!');
    }

    return parts.join(' ');
}

function formatTaskTargetTimer(
    remainingMs?: number,
): string {
    return remainingMs ===
        undefined
        ? ''
        : ' FUSE ' +
              formatTimer(
                  remainingMs,
              );
}

function formatProgress(
    progress?:
        EnemyDebugProgressSnapshot,
): string {
    return progress
        ? ' ' +
              formatProgressValue(
                  progress,
              )
        : '';
}

function formatProgressValue(
    progress:
        EnemyDebugProgressSnapshot,
): string {
    return (
        formatSeconds(
            progress.elapsedMs,
        ) +
        '/' +
        formatSeconds(
            progress.durationMs,
        )
    );
}

function formatSeconds(
    milliseconds: number,
): string {
    return (
        Math.max(
            0,
            milliseconds,
        ) /
        1000
    ).toFixed(1);
}

function formatTimer(
    milliseconds: number,
): string {
    const tenths =
        Math.max(
            0,
            Math.ceil(
                milliseconds /
                    100,
            ),
        );

    const seconds =
        Math.floor(
            tenths / 10,
        );

    return (
        String(seconds)
            .padStart(2, '0') +
        '.' +
        (tenths % 10)
    );
}

function getRoleLabel(
    role: OfficerRole,
): string {
    switch (role) {
        case OFFICER_ROLE.SCIENCE:
            return 'SCI';

        case OFFICER_ROLE.WEAPONS:
            return 'WPN';

        case OFFICER_ROLE.ENGINEER:
            return 'ENG';

        case OFFICER_ROLE.HELM:
            return 'HELM';

        default:
            return assertNever(role);
    }
}

function getPointDefensePhaseLabel(
    phase: PointDefensePhase,
): string {
    switch (phase) {
        case POINT_DEFENSE_PHASE.READY:
            return 'RDY';

        case POINT_DEFENSE_PHASE.LOADING:
            return 'LOAD';

        case POINT_DEFENSE_PHASE.COOLDOWN:
            return 'CD';

        default:
            return assertNever(phase);
    }
}

function getThreatKindLabel(
    kind: EnemyThreatKind,
): string {
    switch (kind) {
        case ENEMY_THREAT_KIND.MISSILE:
            return 'MSL';

        case ENEMY_THREAT_KIND.LASER:
            return 'LSR';

        case ENEMY_THREAT_KIND
            .STICKY_MINE:
            return 'MINE';

        default:
            return assertNever(kind);
    }
}

function getThreatTimerLabel(
    kind: EnemyThreatKind,
): string {
    switch (kind) {
        case ENEMY_THREAT_KIND.MISSILE:
            return 'ETA';

        case ENEMY_THREAT_KIND.LASER:
            return 'FIRE';

        case ENEMY_THREAT_KIND
            .STICKY_MINE:
            return 'FUSE';

        default:
            return assertNever(kind);
    }
}

function assertNever(
    value: never,
): never {
    throw new Error(
        'Unhandled enemy debug panel value: ' +
            String(value),
    );
}
