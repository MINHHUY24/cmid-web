/*
 * Vai trò: Kiểm tra permission và quyết định user có được vào `AdminView` hay không.
 */
import type { AdminView } from "./DieuHuongQuanTri";

export function hasPermission(
  grantedPermissions: string[],
  requiredPermission: string,
) {
  return grantedPermissions.some(
    (permission) =>
      permission === "*" ||
      permission === requiredPermission ||
      (permission.endsWith(".*") &&
        requiredPermission.startsWith(permission.slice(0, -1))),
  );
}

const viewPermissions: Record<AdminView, string> = {
  dashboard: "dashboard.view",
  products: "product.view",
  "product-editor": "product.view",
  categories: "category.manage",
  brands: "brand.manage",
  materials: "product.update",
  suppliers: "product.update",
  orders: "order.view",
  returns: "order.update",
  customers: "customer.view",
  "customer-groups": "customer.manage",
  gifts: "customer.manage",
  news: "content.manage",
  projects: "content.manage",
  banners: "content.manage",
  inquiries: "quotation.view",
  showrooms: "content.manage",
  reports: "report.view",
  settings: "settings.manage",
  profile: "admin.access",
  users: "user.manage",
  helpdesk: "helpdesk.access",
  roles: "role.manage",
  logs: "audit.view",
};

export function canAccessAdminView(permissions: string[], view: AdminView) {
  return hasPermission(permissions, viewPermissions[view]);
}

export function getFirstAccessibleAdminView(
  permissions: string[],
): AdminView | null {
  const views = Object.keys(viewPermissions) as AdminView[];
  return views.find((view) => canAccessAdminView(permissions, view)) ?? null;
}
