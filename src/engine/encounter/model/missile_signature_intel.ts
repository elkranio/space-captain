// src/engine/encounter/model/missile_signature_intel.ts

import type {
    MissileSignature,
} from '../../defs/missile';

export const MISSILE_SIGNATURE_INTEL_STATUS = {
    UNKNOWN: 'unknown',
    UNCERTAIN: 'uncertain',
    CONFIRMED: 'confirmed',
} as const;

export type MissileSignatureIntelStatus =
    (typeof MISSILE_SIGNATURE_INTEL_STATUS)[
        keyof typeof MISSILE_SIGNATURE_INTEL_STATUS
    ];

// Observer knowledge about one concrete missile projectile.
//
// UNKNOWN:
// no hypothesis exists yet.
//
// UNCERTAIN:
// a concrete hypothesis exists and is operationally usable,
// but may objectively be right or wrong.
//
// CONFIRMED:
// a concrete hypothesis exists and engine logic must guarantee
// that it matches the projectile's objective runtime signature.
//
// Hidden correctness is intentionally not stored here.
export type MissileSignatureIntel =
    | {
          status:
              typeof MISSILE_SIGNATURE_INTEL_STATUS
                  .UNKNOWN;
      }
    | {
          status:
              typeof MISSILE_SIGNATURE_INTEL_STATUS
                  .UNCERTAIN;

          hypothesis:
              MissileSignature;
      }
    | {
          status:
              typeof MISSILE_SIGNATURE_INTEL_STATUS
                  .CONFIRMED;

          hypothesis:
              MissileSignature;
      };

export type ResolvedMissileSignatureIntel =
    Exclude<
        MissileSignatureIntel,
        {
            status:
                typeof MISSILE_SIGNATURE_INTEL_STATUS
                    .UNKNOWN;
        }
    >;
