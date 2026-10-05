"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ArrowUpRight, CheckCircle2, Inbox, Loader2, RefreshCw, X } from "lucide-react";

const AdminPermissionContext = createContext<readonly string[]>([]);

export function AdminPermissionProvider({ permissions, children }: { permissions: readonly string[]; children: ReactNode }) {
  return <AdminPermissionContext.Provider value={permissions}>{children}</AdminPermissionContext.Provider>;
}

export function useAdminPermission(permission: string) {
  return useContext(AdminPermissionContext).includes(permission);
}

export function AdminCard({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={`admin-card ${className}`} {...props}>{children}</section>;
}

export function AdminCardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--admin-border)] px-5 py-4 sm:px-6">
    <div><h2 className="text-base font-black tracking-tight text-[var(--admin-text)]">{title}</h2>{subtitle && <p className="mt-1 text-xs leading-5 text-[var(--admin-muted)]">{subtitle}</p>}</div>
    {action}
  </div>;
}

export function AdminButton({ variant = "primary", size = "md", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  return <button className={`admin-button admin-button-${variant} admin-button-${size} ${className}`} {...props}>{children}</button>;
}

export function AdminBadge({ tone = "neutral", children }: { tone?: "neutral" | "success" | "warning" | "danger" | "info" | "purple"; children: ReactNode }) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>;
}

export function AdminStatCard({ label, value, detail, icon, tone = "purple" }: { label: string; value: string | number; detail?: string; icon: ReactNode; tone?: "purple" | "blue" | "green" | "orange" }) {
  return <AdminCard className="relative overflow-hidden p-5">
    <div className={`admin-stat-glow admin-stat-glow-${tone}`} />
    <div className="relative flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[var(--admin-muted)]">{label}</p><p className="mt-3 text-2xl font-black tracking-tight text-[var(--admin-text)] sm:text-3xl">{value}</p>{detail && <p className="mt-2 text-[11px] font-semibold text-[var(--admin-muted)]">{detail}</p>}</div><span className={`admin-stat-icon admin-stat-icon-${tone}`}>{icon}</span></div>
  </AdminCard>;
}

export function AdminPageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="admin-eyebrow">{eyebrow}</p><h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--admin-text)] sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--admin-muted)]">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}

export function AdminSearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input className="admin-search-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}

export function AdminSkeleton({ className = "" }: { className?: string }) { return <div className={`admin-skeleton ${className}`} />; }

export function AdminLoadingState() { return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><AdminSkeleton className="h-32" /><AdminSkeleton className="h-32" /><AdminSkeleton className="h-32" /><AdminSkeleton className="h-32" /></div>; }

export function AdminEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--admin-surface-soft)] text-[var(--admin-muted)]"><Inbox size={22} /></span><h3 className="mt-4 text-sm font-black text-[var(--admin-text)]">{title}</h3>{description && <p className="mt-2 max-w-sm text-xs leading-5 text-[var(--admin-muted)]">{description}</p>}{action && <div className="mt-5">{action}</div>}</div>;
}

export function AdminErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><AlertCircle className="text-rose-500" size={28} /><h3 className="mt-4 text-sm font-black text-[var(--admin-text)]">{message}</h3>{onRetry && <AdminButton variant="secondary" size="sm" className="mt-5" onClick={onRetry}><RefreshCw size={14} /> تلاش دوباره</AdminButton>}</div>;
}

export function AdminDataTable({ headers, children, empty }: { headers: string[]; children: ReactNode; empty?: ReactNode }) {
  return <div className="overflow-x-auto"><table className="admin-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table>{empty}</div>;
}

export function AdminTableRow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return <tr className={onClick ? "cursor-pointer" : ""} onClick={onClick}>{children}</tr>;
}

export function AdminTableCell({ children, className = "", colSpan, rowSpan }: { children: ReactNode; className?: string; colSpan?: number; rowSpan?: number }) { return <td className={className} colSpan={colSpan} rowSpan={rowSpan}>{children}</td>; }

export function AdminLinkAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) { return <button onClick={onClick} className="inline-flex items-center gap-1 text-xs font-black text-[var(--admin-accent)] hover:underline">{children}<ArrowUpRight size={13} /></button>; }

function useAdminOverlayLifecycle(onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousActive = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); previousActive?.focus?.(); };
  }, []);
}

export function AdminDialog({ children, onClose, className = "", labelledBy, closeLabel = "بستن" }: { children: ReactNode; onClose: () => void; className?: string; labelledBy?: string; closeLabel?: string }) {
  useAdminOverlayLifecycle(onClose);
  if (typeof document === "undefined") return null;
  return createPortal(<div data-admin-overlay="dialog" className="admin-panel admin-overlay" style={{ position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "auto" }} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><div className={`admin-overlay-panel ${className}`} onMouseDown={(event) => event.stopPropagation()}><button type="button" aria-label={closeLabel} className="admin-dialog-close" onClick={onClose}><X size={17} /></button>{children}</div></div>, document.body);
}

export function AdminDrawer({ children, onClose, className = "", labelledBy, closeLabel = "بستن" }: { children: ReactNode; onClose: () => void; className?: string; labelledBy?: string; closeLabel?: string }) {
  useAdminOverlayLifecycle(onClose);
  if (typeof document === "undefined") return null;
  return createPortal(<div data-admin-overlay="drawer" className="admin-panel admin-overlay admin-overlay-drawer" style={{ position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "auto" }} role="dialog" aria-modal="true" aria-labelledby={labelledBy} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}><aside className={`admin-drawer-panel ${className}`} onMouseDown={(event) => event.stopPropagation()}><button type="button" aria-label={closeLabel} className="admin-drawer-close" onClick={onClose}><X size={18} /></button>{children}</aside></div>, document.body);
}

export function AdminSpinner() { return <Loader2 className="animate-spin" size={16} />; }
export function AdminSuccessIcon() { return <CheckCircle2 size={16} />; }
