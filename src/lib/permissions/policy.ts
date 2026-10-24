/**
 * Role/permission policy (pure functions, no I/O).
 *
 * This is the single source of truth for authorization decisions. Server actions
 * and server components must call `requirePermission()` (see `src/lib/auth/session.ts`)
 * instead of checking roles inline.
 *
 * NOTE: Firestore Security Rules (docs/task.md T014) must mirror this policy once
 * Firebase is wired; UI hiding is not a security control.
 */

export const ROLES = [
  "entrepreneur_admin",
  "research",
  "marketing",
  "executive_viewer",
] as const;

export type Role = (typeof ROLES)[number];

/** An actor can be one of the official roles or anonymous (no verified identity). */
export type ActorRole = Role | "anonymous";

export const ROLE_LABELS: Record<Role, string> = {
  entrepreneur_admin: "Admin Entrepreneur",
  research: "Research",
  marketing: "Marketing",
  executive_viewer: "Pimpinan (baca saja)",
};

export const PERMISSIONS = [
  /** Read the internal product catalogue (including HPP/margin). */
  "products:read",
  /** Create and update products, including selling price and HPP. */
  "products:write",
  /** Change product lifecycle status (approved/active/archived). */
  "products:manage-status",
  /** Read internal orders. */
  "orders:read",
  /** Read finance records and reports. */
  "finance:read",
  /** Read/export executive reporting data. */
  "reports:read",
  /** Write research workspace data. */
  "research:write",
  /** Write marketing workspace data. */
  "marketing:write",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const READ_ONLY_PERMISSIONS: readonly Permission[] = [
  "products:read",
  "orders:read",
  "finance:read",
  "reports:read",
];

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  entrepreneur_admin: PERMISSIONS,
  research: ["products:read", "products:write", "research:write"],
  marketing: ["products:read", "marketing:write", "reports:read"],
  executive_viewer: READ_ONLY_PERMISSIONS,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

/** Returns false for `null`/`undefined`/unknown roles so anonymous callers never pass. */
export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role || !isRole(role)) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export class ForbiddenError extends Error {
  readonly permission: Permission;
  readonly role: ActorRole;

  constructor(role: ActorRole, permission: Permission) {
    super(`Role "${role}" tidak memiliki izin "${permission}".`);
    this.name = "ForbiddenError";
    this.role = role;
    this.permission = permission;
  }
}
