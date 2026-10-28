export const organizationRoles = ["owner", "admin", "operator", "aggregator", "buyer", "data_viewer"] as const

export type OrganizationRole = (typeof organizationRoles)[number]

export const permissions = {
  organizationRead: "organization:read",
  membersManage: "members:manage",
  depositsCreate: "deposits:create",
  transactionsConfirm: "transactions:confirm",
  transactionsVoid: "transactions:void",
  inventoryRead: "inventory:read",
  batchesCreate: "batches:create",
  batchesSell: "batches:sell",
  marketDataRead: "market-data:read",
  marketDataExport: "market-data:export",
  demandCreate: "demand:create",
} as const

export type Permission = (typeof permissions)[keyof typeof permissions]

export const rolePermissions: Readonly<Record<OrganizationRole, readonly Permission[]>> = {
  owner: Object.values(permissions),
  admin: Object.values(permissions),
  operator: [
    permissions.organizationRead,
    permissions.depositsCreate,
    permissions.transactionsConfirm,
    permissions.transactionsVoid,
    permissions.inventoryRead,
    permissions.batchesCreate,
    permissions.batchesSell,
    permissions.marketDataRead,
  ],
  aggregator: [
    permissions.organizationRead,
    permissions.inventoryRead,
    permissions.batchesCreate,
    permissions.batchesSell,
    permissions.marketDataRead,
  ],
  buyer: [permissions.organizationRead, permissions.marketDataRead, permissions.demandCreate],
  data_viewer: [permissions.organizationRead, permissions.marketDataRead, permissions.marketDataExport],
}

export function hasPermission(role: OrganizationRole, permission: Permission) {
  return rolePermissions[role].includes(permission)
}
