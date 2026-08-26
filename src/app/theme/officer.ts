import type { OfficerRole } from "../../engine/defs/officer";

export const OFFICER_ROLE_COLOR = {
    science: 0x62c887,
    helm: 0xf2b36d,
    weapons: 0xff4d4d,
    engineer: 0xe1c84b,
} as const satisfies Record<OfficerRole, number>;
