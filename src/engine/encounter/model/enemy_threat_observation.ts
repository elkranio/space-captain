// src/engine/encounter/model/enemy_threat_observation.ts

import type {
    LaserTargetZone,
} from '../../defs/laser';
import type {
    MissileSpectralBand,
} from '../../defs/missile';

export const ENEMY_THREAT_KIND = {
    MISSILE: 'missile',
    LASER: 'laser',
    STICKY_MINE: 'sticky_mine',
} as const;

export type EnemyThreatKind =
    (typeof ENEMY_THREAT_KIND)[keyof typeof ENEMY_THREAT_KIND];

export const ENEMY_THREAT_SOURCE_KIND = {
    COMBAT_PROJECTILE:
        'combat_projectile',

    PLAYER_OFFICER_TASK:
        'player_officer_task',

    STICKY_MINE:
        'sticky_mine',
} as const;

export type EnemyThreatSource =
    | {
          kind:
              typeof ENEMY_THREAT_SOURCE_KIND
                  .COMBAT_PROJECTILE;

          projectileId: string;
      }
    | {
          kind:
              typeof ENEMY_THREAT_SOURCE_KIND
                  .PLAYER_OFFICER_TASK;

          officerTaskId: string;
      }
    | {
          kind:
              typeof ENEMY_THREAT_SOURCE_KIND
                  .STICKY_MINE;

          stickyMineId: string;
      };

export type EnemyThreatReport =
    | {
          kind:
              typeof ENEMY_THREAT_KIND
                  .MISSILE;

          spectralBand:
              MissileSpectralBand;
      }
    | {
          kind:
              typeof ENEMY_THREAT_KIND
                  .LASER;

          targetZone:
              LaserTargetZone;
      };

// Это только факт наблюдения enemy crew.
//
// Объективные missileId, targetZone,
// mineId, damage и timers здесь намеренно
// не хранятся. Истина остаётся
// в соответствующем combat object/task.
//
// report — вывод Science, а не истина.
// Он может быть ошибочным и намеренно
// не содержит флага достоверности.
export type EnemyThreatObservationState = {
    id: string;

    kind: EnemyThreatKind;
    source: EnemyThreatSource;

    report?: EnemyThreatReport;
};
