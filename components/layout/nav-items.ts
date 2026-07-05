import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  FileText,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Shapes,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Key inside the `nav` message namespace. */
  key: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "expenses", href: "/expenses", icon: ReceiptText },
  { key: "income", href: "/income", icon: HandCoins },
  { key: "transactions", href: "/transactions", icon: ArrowLeftRight },
  { key: "categories", href: "/categories", icon: Shapes },
  { key: "budgets", href: "/budgets", icon: Target },
  { key: "analytics", href: "/analytics", icon: ChartNoAxesCombined },
  { key: "reports", href: "/reports", icon: FileText },
  { key: "settings", href: "/settings", icon: Settings },
];
