"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useLocale } from "@/hooks/useLocale";
import { getAdminMessages } from "./admin-copy";
import { adminNavigationPermissions, canLoadAdminResource } from "@/lib/admin-permissions";
import {
  Activity, BadgePercent, BarChart3, Boxes, ChevronLeft, ChevronRight, Command, LayoutDashboard,
  LogOut, Menu, Moon, Package, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, ShieldCheck,
  ShoppingBag, Star, Sun, Tags, Truck, Users, X,
} from "lucide-react";
import { useLogOut } from "@/hooks/useAuth";
import { searchAdmin } from "@/services/admin-extended.service";
import { AdminDialog, AdminPermissionProvider } from "@/components/admin-ui/AdminPrimitives";

export type AdminSection = "dashboard" | "catalog" | "products" | "inventory" | "orders" | "customers" | "fulfillment" | "marketing" | "reviews" | "analytics" | "roles" | "activity";

type NavItem = { id: AdminSection; icon: typeof LayoutDashboard; permission: string; labelKey: keyof ReturnType<typeof getAdminMessages>; descriptionKey?: keyof ReturnType<typeof getAdminMessages> };
type NavGroup = { labelKey: keyof ReturnType<typeof getAdminMessages>; items: NavItem[] };

const groups: NavGroup[] = [
  { labelKey: "workspace", items: [{ id: "dashboard", icon: LayoutDashboard, permission: adminNavigationPermissions.dashboard, labelKey: "overview" }] },
  { labelKey: "catalog", items: [
    { id: "catalog", icon: Tags, permission: adminNavigationPermissions.products, labelKey: "catalog", descriptionKey: "productsHint" },
    { id: "products", icon: Package, permission: adminNavigationPermissions.products, labelKey: "products", descriptionKey: "productsHint" },
    { id: "inventory", icon: Boxes, permission: adminNavigationPermissions.inventory, labelKey: "inventory", descriptionKey: "inventoryHint" },
  ] },
  { labelKey: "sales", items: [
    { id: "orders", icon: ShoppingBag, permission: adminNavigationPermissions.orders, labelKey: "orders", descriptionKey: "ordersHint" },
    { id: "customers", icon: Users, permission: adminNavigationPermissions.customers, labelKey: "customers", descriptionKey: "customersHint" },
    { id: "fulfillment", icon: Truck, permission: adminNavigationPermissions.orders, labelKey: "fulfillment", descriptionKey: "ordersHint" },
  ] },
  { labelKey: "marketing", items: [{ id: "marketing", icon: BadgePercent, permission: adminNavigationPermissions.marketing, labelKey: "marketing", descriptionKey: "marketingHint" }] },
  { labelKey: "content", items: [{ id: "reviews", icon: Star, permission: adminNavigationPermissions.reviews, labelKey: "reviews", descriptionKey: "reviewsHint" }] },
  { labelKey: "analytics", items: [{ id: "analytics", icon: BarChart3, permission: adminNavigationPermissions.dashboard, labelKey: "analytics" }] },
  { labelKey: "administration", items: [
    { id: "roles", icon: ShieldCheck, permission: adminNavigationPermissions.roles, labelKey: "roles" },
    { id: "activity", icon: Activity, permission: adminNavigationPermissions.activity, labelKey: "activity" },
  ] },
];

export function AdminShell({ children, permissions, adminName, activeSection, onSectionChange, onRefresh }: { children: React.ReactNode; permissions: string[]; adminName: string; activeSection: AdminSection; onSectionChange: (section: AdminSection) => void; onRefresh: () => void }) {
  const { locale, direction } = useLocale();
  const copy = getAdminMessages(locale);
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogOut();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const visibleGroups = useMemo(() => groups.map((group) => ({ ...group, items: group.items.filter((item) => canLoadAdminResource(permissions, item.permission)) })).filter((group) => group.items.length > 0), [permissions]);
  const current = visibleGroups.flatMap((group) => group.items).find((item) => item.id === activeSection);

  const navigate = (section: AdminSection) => { onSectionChange(section); setMobileOpen(false); setCommandOpen(false); };
  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return <AdminPermissionProvider permissions={permissions}><div className="admin-panel" dir={direction}>
    {mobileOpen && <button aria-label={locale === "fa" ? "بستن منو" : "Close menu"} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 z-50 flex flex-col border-e border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl backdrop-blur-2xl transition-all duration-300 ${collapsed ? "w-[5.5rem]" : "w-[17rem]"} ${mobileOpen ? "translate-x-0" : direction === "rtl" ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-[4.6rem] items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4"><button className="flex min-w-0 items-center gap-3 text-start" onClick={() => navigate("dashboard")}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--admin-accent)] to-[var(--admin-accent-strong)] text-sm font-black text-white shadow-lg shadow-orange-500/20">B</span>{!collapsed && <span className="min-w-0"><span className="block truncate text-xs font-black tracking-[.15em] text-[var(--admin-text)]">{copy.brand}</span><span className="mt-1 block truncate text-[10px] font-semibold text-[var(--admin-muted)]">{copy.workspace}</span></span>}</button><button aria-label={collapsed ? (locale === "fa" ? "باز کردن نوار کناری" : "Expand sidebar") : (locale === "fa" ? "جمع کردن نوار کناری" : "Collapse sidebar")} onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-surface-soft)] lg:block">{collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button><button aria-label={locale === "fa" ? "بستن منو" : "Close menu"} onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-[var(--admin-muted)] lg:hidden"><X size={18} /></button></div>
      <div className="admin-scrollbar flex-1 overflow-y-auto px-3 py-5">
        {visibleGroups.map((group) => <div key={group.labelKey} className="mb-6"><p className={`mb-2 px-3 text-[10px] font-black uppercase tracking-[.16em] text-[var(--admin-muted)] ${collapsed ? "text-center" : ""}`}>{collapsed ? "•" : copy[group.labelKey]}</p><div className="grid gap-1">{group.items.map((item) => { const Icon = item.icon; const active = item.id === activeSection; return <button key={item.id} title={collapsed ? copy[item.labelKey] : undefined} onClick={() => navigate(item.id)} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-xs font-black transition ${active ? "bg-[var(--admin-accent)] text-white shadow-lg shadow-orange-500/20" : "text-[var(--admin-muted)] hover:bg-[var(--admin-surface-soft)] hover:text-[var(--admin-text)]"}`}><Icon size={17} className="shrink-0" /><span className={`min-w-0 flex-1 truncate ${collapsed ? "hidden" : ""}`}>{copy[item.labelKey]}</span>{active && !collapsed && <ChevronLeft size={14} className="shrink-0 opacity-70" />}</button>; })}</div></div>)}
      </div>
      <div className="border-t border-[var(--admin-border)] p-3"><div className={`mb-2 flex items-center gap-3 rounded-xl bg-[var(--admin-surface-soft)] p-2.5 ${collapsed ? "justify-center" : ""}`}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-border-strong)] text-xs font-black text-[var(--admin-accent-strong)]">{(adminName || "A").slice(0, 1).toUpperCase()}</span>{!collapsed && <span className="min-w-0 truncate text-xs font-black text-[var(--admin-text)]">{adminName}</span>}</div><button title={copy.signOut} onClick={() => logout.mutate()} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black text-[var(--admin-muted)] hover:bg-rose-500/10 hover:text-[var(--admin-red)] ${collapsed ? "justify-center" : ""}`}><LogOut size={17} />{!collapsed && copy.signOut}</button></div>
    </aside>
    <main className={`min-h-screen transition-[padding] duration-300 ${collapsed ? "lg:ps-[5.5rem]" : "lg:ps-[17rem]"}`}><header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/85 backdrop-blur-2xl"><div className="flex min-h-[4.6rem] items-center gap-3 px-4 sm:px-6 lg:px-8"><button aria-label={locale === "fa" ? "باز کردن منو" : "Open menu"} onClick={() => setMobileOpen(true)} className="rounded-xl border border-[var(--admin-border)] p-2.5 text-[var(--admin-muted)] lg:hidden"><Menu size={19} /></button><div className="min-w-0 flex-1"><p className="admin-eyebrow truncate">{copy.workspace}</p><h2 className="mt-1 truncate text-lg font-black text-[var(--admin-text)]">{current ? copy[current.labelKey] : copy.overview}</h2></div><button aria-label={copy.search} onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface-solid)] px-3 py-2.5 text-xs font-bold text-[var(--admin-muted)] hover:border-[var(--admin-border-strong)] sm:flex"><Search size={16} /><span>{copy.search}</span><kbd className="rounded-md bg-[var(--admin-surface-soft)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd></button><button aria-label={copy.refresh} onClick={onRefresh} className="rounded-xl border border-[var(--admin-border)] p-2.5 text-[var(--admin-muted)] hover:text-[var(--admin-accent)]"><RefreshCw size={17} /></button><button aria-label={resolvedTheme === "dark" ? copy.lightMode : copy.darkMode} onClick={toggleTheme} className="rounded-xl border border-[var(--admin-border)] p-2.5 text-[var(--admin-muted)] hover:text-[var(--admin-accent)]">{resolvedTheme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button></div></header><div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div></main>
    {commandOpen && <CommandPalette locale={locale} copy={copy} visibleGroups={visibleGroups} onClose={() => setCommandOpen(false)} onNavigate={navigate} onToggleTheme={toggleTheme} />}
  </div></AdminPermissionProvider>;
}

function CommandPalette({ locale, copy, visibleGroups, onClose, onNavigate, onToggleTheme }: { copy: ReturnType<typeof getAdminMessages>; locale: string; visibleGroups: NavGroup[]; onClose: () => void; onNavigate: (section: AdminSection) => void; onToggleTheme: () => void }) {
  const [query, setQuery] = useState("");
  const searchResults = useQuery({ queryKey: ["admin", "global-search", query], queryFn: () => searchAdmin(query), enabled: query.trim().length > 1, staleTime: 30_000 });
  const actions = [{ id: "theme", label: copy.darkMode, icon: Moon, run: onToggleTheme }, ...visibleGroups.flatMap((group) => group.items).map((item) => ({ id: item.id, label: copy[item.labelKey], icon: item.icon, run: () => onNavigate(item.id) }))];
  const filtered = actions.filter((action) => action.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <AdminDialog onClose={onClose} closeLabel={locale === "fa" ? "بستن" : "Close"} className="max-w-xl overflow-hidden"><div className="w-full"><div className="flex items-center gap-3 border-b border-[var(--admin-border)] px-4 py-4"><Command size={18} className="text-[var(--admin-accent)]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${copy.search}...`} className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[var(--admin-text)] outline-none" /><kbd className="rounded-md bg-[var(--admin-surface-soft)] px-2 py-1 font-mono text-[10px] text-[var(--admin-muted)]">ESC</kbd></div><div className="max-h-[50vh] overflow-y-auto p-2">{query.trim().length > 1 && searchResults.data?.map((result) => <button key={`${result.type}-${result.id}`} onClick={onClose} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm text-[var(--admin-text)] hover:bg-[var(--admin-surface-soft)]"><Search size={16} className="text-[var(--admin-accent)]" /><span className="min-w-0 flex-1 truncate font-black">{result.label}</span><span className="text-[10px] text-[var(--admin-muted)]">{{ product: copy.products, order: copy.orders, customer: copy.customers, brand: locale === "fa" ? "برند" : "Brand", category: locale === "fa" ? "دسته‌بندی" : "Category" }[result.type] ?? result.type}{result.meta ? ` · ${result.meta}` : ""}</span></button>)}{filtered.map((action) => { const Icon = action.icon; return <button key={action.id} onClick={action.run} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-black text-[var(--admin-text)] hover:bg-[var(--admin-surface-soft)]"><Icon size={17} className="text-[var(--admin-accent)]" />{action.label}<ChevronRight size={14} className="ms-auto text-[var(--admin-muted)]" /></button>; })}</div></div></AdminDialog>;
}
