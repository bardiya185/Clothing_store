export type AdminPermission = string;

/**
 * This map controls visibility and routing only. The Laravel middleware is the
 * security boundary and independently returns 403 for every protected API.
 */
export const adminNavigationPermissions = {
  dashboard: "dashboard.view",
  catalog: "catalog.view",
  products: "products.view",
  inventory: "inventory.view",
  orders: "orders.view",
  customers: "customers.view",
  fulfillment: "fulfillment.view",
  marketing: "marketing.view",
  reviews: "reviews.view",
  analytics: "analytics.view",
  roles: "roles.view",
  activity: "audit.view",
  recovery: "orders.view",
} as const;

export function hasAdminPermission(
  permissions: readonly AdminPermission[],
  requiredPermission: AdminPermission,
): boolean {
  return permissions.includes(requiredPermission);
}

export function canLoadAdminResource(
  permissions: readonly AdminPermission[],
  requiredPermission: AdminPermission,
): boolean {
  return hasAdminPermission(permissions, requiredPermission);
}
