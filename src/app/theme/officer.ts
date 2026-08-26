import type { OfficerRole } from "../../engine/defs/officer";

export const OFFICER_ROLE_COLOR = {
    science: 0x69bff2,
    helm: 0x62c887,
    weapons: 0xff4d4d,
    engineer: 0xe1c84b,
} as const satisfies Record<OfficerRole, number>;
