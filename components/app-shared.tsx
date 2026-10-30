import type { ReactNode } from "react"
import {
  LayoutDashboardIcon,
  MousePointerClickIcon,
  FunnelIcon,
  RepeatIcon,
  GitBranchIcon,
  UsersIcon,
  ChartPieIcon,
  UserIcon,
  PlugIcon,
  ArrowDownToLineIcon,
  BarChart3Icon,
  HandshakeIcon,
  ReceiptTextIcon,
} from "lucide-react"

export type SidebarNavItem = {
  title: string
  path?: string
  icon?: ReactNode
  isActive?: boolean
  subItems?: SidebarNavItem[]
}

export type SidebarNavGroup = {
  label: string
  items: SidebarNavItem[]
}

export const navGroups: SidebarNavGroup[] = [
  {
    label: "Explore",
    items: [
      {
        title: "Dashboard",
        path: "#/overview",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
      {
        title: "Events",
        path: "#/events",
        icon: <MousePointerClickIcon />,
      },
      {
        title: "Funnels",
        path: "#/funnels",
        icon: <FunnelIcon />,
      },
      {
        title: "Retention",
        path: "#/retention",
        icon: <RepeatIcon />,
      },
      {
        title: "Flows",
        path: "#/flows",
        icon: <GitBranchIcon />,
      },
    ],
  },
  {
    label: "Audiences",
    items: [
      {
        title: "Segments",
        path: "#/segments",
        icon: <UsersIcon />,
      },
      {
        title: "Cohorts",
        path: "#/cohorts",
        icon: <ChartPieIcon />,
      },
      {
        title: "Profiles",
        path: "#/profiles",
        icon: <UserIcon />,
      },
    ],
  },
  {
    label: "Configure",
    items: [
      {
        title: "Integrations",
        path: "#/integrations",
        icon: <PlugIcon />,
      },
    ],
  },
]

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  ),
]

export function getBusinessNavGroups(pathname?: string): SidebarNavGroup[] {
  const current = pathname || "/dashboard/business"
  return [
    {
      label: "Operasional",
      items: [
        {
          title: "Overview",
          path: "/dashboard/business",
          icon: <LayoutDashboardIcon />,
          isActive:
            current === "/dashboard/business" ||
            current === "/dashboard/business/",
        },
        {
          title: "Transaksi",
          path: "/dashboard/business/transactions",
          icon: <ReceiptTextIcon />,
          isActive: current.startsWith("/dashboard/business/transactions"),
        },
        {
          title: "Setoran masuk",
          path: "/dashboard/business/intake",
          icon: <ArrowDownToLineIcon />,
          isActive: current.startsWith("/dashboard/business/intake"),
        },
        {
          title: "Harga",
          path: "/dashboard/business/harga",
          icon: <BarChart3Icon />,
          isActive: current.startsWith("/dashboard/business/harga"),
        },
      ],
    },
    {
      label: "Jaringan WAVE",
      items: [
        {
          title: "Partner pemasok",
          path: "/dashboard/business/partners",
          icon: <HandshakeIcon />,
          isActive: current.startsWith("/dashboard/business/partners"),
        },
      ],
    },
  ]
}

export const businessNavGroups: SidebarNavGroup[] = getBusinessNavGroups()

export const adminNavGroups: SidebarNavGroup[] = [
  {
    label: "WPI Admin",
    items: [
      {
        title: "Overview",
        path: "/dashboard/admin/wpi#overview",
        icon: <LayoutDashboardIcon />,
        isActive: true,
      },
      {
        title: "Observasi",
        path: "/dashboard/admin/wpi#observations",
        icon: <ClipboardCheckIcon />,
      },
      {
        title: "Material & source",
        path: "/dashboard/admin/wpi#configuration",
        icon: <DatabaseIcon />,
      },
      {
        title: "Audit",
        path: "/dashboard/admin/wpi#audit",
        icon: <ShieldCheckIcon />,
      },
    ],
  },
]
