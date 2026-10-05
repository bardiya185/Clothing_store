"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, LockKeyhole, ShieldCheck, UserCog } from "lucide-react";
import { assignAdminRole, changeAdminRole, getAdminAuditLogs, getAdminRoles, getAdminUsers, revokeAdminRole } from "@/services/admin.service";
import { getApiErrorMessage } from "@/lib/api-error";
import { getLocaleConfig } from "@/lib/i18n";
import { getAdminMessages } from "../admin-copy";
import { AdminBadge, AdminButton, AdminCard, AdminCardHeader, AdminDataTable, AdminEmptyState, AdminErrorState, AdminPageHeader, AdminTableCell, AdminTableRow, useAdminPermission } from "@/components/admin-ui/AdminPrimitives";

function auditLabel(action: string, locale: string) {
  const key = action.split(".").at(-1) ?? action;
  const labels = locale === "fa"
    ? { created: "ایجاد شد", updated: "به‌روزرسانی شد", deleted: "حذف شد", adjusted: "تنظیم شد", requested: "درخواست شد", assigned: "اختصاص داده شد", changed: "تغییر کرد", revoked: "لغو تخصیص شد", status_updated: "وضعیت تغییر کرد" }
    : { created: "Created", updated: "Updated", deleted: "Deleted", adjusted: "Adjusted", requested: "Requested", assigned: "Assigned", changed: "Changed", revoked: "Assignment revoked", status_updated: "Status changed" };
  return (labels as Record<string, string>)[key] ?? action;
}

function entityLabel(type: string | null | undefined, locale: string) {
  const key = type?.split("\\").at(-1) ?? "";
  const labels = locale === "fa"
    ? { Product: "محصول", Order: "سفارش", ProductReview: "نظر محصول", InventoryMovement: "حرکت موجودی", Shipment: "ارسال", ReturnRequest: "مرجوعی", Refund: "بازپرداخت", HomepageSection: "بخش صفحه اصلی", ShippingMethod: "روش ارسال", User: "کاربر" }
    : { Product: "Product", Order: "Order", ProductReview: "Product review", InventoryMovement: "Inventory movement", Shipment: "Shipment", ReturnRequest: "Return request", Refund: "Refund", HomepageSection: "Homepage section", ShippingMethod: "Shipping method", User: "User" };
  return (labels as Record<string, string>)[key] ?? (key || "—");
}

export function AdminAccessView({ locale }: { locale: string }) {
  const copy = getAdminMessages(locale);
  const canViewRoles = useAdminPermission("roles.view");
  const canManageRolesPermission = useAdminPermission("roles.manage");
  const canManageUsers = useAdminPermission("users.manage");
  const canManageRoles = canManageRolesPermission && canManageUsers;
  const client = useQueryClient();
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: getAdminRoles, staleTime: 5 * 60_000, enabled: canViewRoles });
  const users = useQuery({ queryKey: ["admin", "users", "role-assignment"], queryFn: () => getAdminUsers(), staleTime: 30_000, enabled: canManageRoles });
  const [userId, setUserId] = React.useState("");
  const [roleId, setRoleId] = React.useState("");
  const selectedUser = users.data?.data.find((user) => String(user.id) === userId);

  const mutation = useMutation({
    mutationFn: ({ mode }: { mode: "assign" | "change" | "revoke" }) => {
      const numericUserId = Number(userId);
      const numericRoleId = Number(roleId);
      if (mode === "change") return changeAdminRole(numericUserId, numericRoleId);
      return mode === "assign" ? assignAdminRole(numericUserId, numericRoleId) : revokeAdminRole(numericUserId, numericRoleId);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["admin", "users"] });
      void client.invalidateQueries({ queryKey: ["admin", "roles"] });
    },
  });

  const userRoles = (selectedUser?.roles ?? []).map((role) => role.label || "نقش").join(locale === "fa" ? "، " : ", ");

  return <>
    <AdminPageHeader eyebrow={copy.administration} title={copy.roles} description={locale === "fa" ? "نقش‌ها مجموعه‌ای از permissionها هستند و تغییر نقش مستقیماً از طریق بک‌اند انجام می‌شود." : "Roles are permission collections and role changes are applied by the backend."} />
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <AdminCard className="overflow-hidden">
        <AdminCardHeader title={locale === "fa" ? "نقش‌های فعال" : "Active roles"} subtitle={locale === "fa" ? "هر نقش، مجموعه‌ای از دسترسی‌های granular است." : "Each role is a collection of granular permissions."} />
        <div className="grid gap-3 p-4">
          {roles.isLoading ? <div className="admin-skeleton h-40" /> : roles.isError ? <AdminErrorState message={getApiErrorMessage(roles.error, copy.noData)} onRetry={() => void roles.refetch()} /> : roles.data?.length ? roles.data.map((role) => <div key={role.id} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-soft)] p-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--admin-border-strong)] text-[var(--admin-accent)]"><ShieldCheck size={17} /></span><span className="min-w-0 flex-1"><span className="block font-black">{role.label}</span><span className="mt-1 block text-[10px] text-[var(--admin-muted)]">{role.permissions.length} {locale === "fa" ? "دسترسی ثبت‌شده" : "permissions"}</span></span><AdminBadge tone={role.is_active ? "success" : "neutral"}>{role.users_count} {locale === "fa" ? "کاربر" : "users"}</AdminBadge></div></div>) : <AdminEmptyState title={copy.noData} />}
        </div>
      </AdminCard>
      <AdminCard>
        <AdminCardHeader title={locale === "fa" ? "تغییر نقش کاربر" : "Change user role"} subtitle={locale === "fa" ? "تغییر نقش، نقش‌های قبلی کاربر را با نقش انتخاب‌شده جایگزین می‌کند." : "Change replaces the selected user’s current roles with the selected role."} />
        <div className="grid gap-4 p-5">
          <label className="admin-field"><span>{locale === "fa" ? "کاربر" : "User"}</span><select className="admin-form-input" value={userId} onChange={(event) => { setUserId(event.target.value); setRoleId(""); }} disabled={!canManageRoles || users.isLoading}><option value="">{locale === "fa" ? "انتخاب کاربر" : "Select user"}</option>{users.data?.data.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.phone}{user.roles?.length ? ` · ${user.roles.map((role) => role.label || "نقش").join(", ")}` : ""}</option>)}</select></label>
          <label className="admin-field"><span>{locale === "fa" ? "نقش جدید" : "New role"}</span><select className="admin-form-input" value={roleId} onChange={(event) => setRoleId(event.target.value)} disabled={!canManageRoles || roles.isLoading}><option value="">{locale === "fa" ? "انتخاب نقش" : "Select role"}</option>{roles.data?.filter((role) => role.is_active).map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
          {selectedUser && <p className="rounded-xl bg-[var(--admin-surface-soft)] p-3 text-xs font-bold text-[var(--admin-muted)]">{locale === "fa" ? "نقش فعلی: " : "Current roles: "}{userRoles || (locale === "fa" ? "بدون نقش" : "No role")}</p>}
          {!canManageRoles && <p className="rounded-xl bg-amber-500/10 p-3 text-xs font-bold text-[var(--admin-orange)]">{locale === "fa" ? "برای تغییر نقش به users.manage و roles.manage نیاز دارید." : "You need users.manage and roles.manage to change roles."}</p>}
          <div className="flex flex-wrap gap-2"><AdminButton disabled={!canManageRoles || !userId || !roleId || mutation.isPending} onClick={() => mutation.mutate({ mode: "change" })}><UserCog size={15} />{locale === "fa" ? "تغییر نقش" : "Change role"}</AdminButton><AdminButton variant="secondary" disabled={!canManageRoles || !userId || !roleId || mutation.isPending} onClick={() => mutation.mutate({ mode: "assign" })}><ShieldCheck size={15} />{locale === "fa" ? "افزودن نقش" : "Add role"}</AdminButton><AdminButton variant="ghost" disabled={!canManageRoles || !userId || !roleId || mutation.isPending} onClick={() => mutation.mutate({ mode: "revoke" })}><LockKeyhole size={15} />{locale === "fa" ? "لغو نقش" : "Revoke"}</AdminButton></div>
          {mutation.isError && <p className="rounded-xl bg-rose-500/10 p-3 text-xs font-bold text-[var(--admin-red)]">{getApiErrorMessage(mutation.error, locale === "fa" ? "تغییر نقش انجام نشد. دسترسی یا داده‌های انتخاب‌شده را بررسی کنید." : "Role update failed. Check permissions and the selected data.")}</p>}
          {users.isError && canManageRoles && <p className="rounded-xl bg-rose-500/10 p-3 text-xs font-bold text-[var(--admin-red)]">{getApiErrorMessage(users.error, locale === "fa" ? "فهرست کاربران دریافت نشد." : "Users could not be loaded.")}</p>}
        </div>
      </AdminCard>
    </div>
  </>;
}

export function AdminActivityView({ locale }: { locale: string }) {
  const copy = getAdminMessages(locale);
  const query = useQuery({ queryKey: ["admin", "activity"], queryFn: () => getAdminAuditLogs(), staleTime: 20_000 });
  return <><AdminPageHeader eyebrow={copy.administration} title={copy.activity} description={locale === "fa" ? "تغییرات مدیریتی ثبت‌شده در بک‌اند." : "Administrative changes recorded by the backend."} /><AdminCard className="overflow-hidden"><AdminCardHeader title={copy.activity} /><div>{query.isLoading ? <div className="p-5"><div className="admin-skeleton h-72" /></div> : query.isError ? <AdminErrorState message={getApiErrorMessage(query.error, copy.noData)} onRetry={() => void query.refetch()} /> : query.data?.data?.length ? <AdminDataTable headers={[locale === "fa" ? "عملیات" : "Action", locale === "fa" ? "موجودیت" : "Entity", locale === "fa" ? "عامل" : "Actor", copy.date]}>{query.data.data.map((log) => <AdminTableRow key={log.id}><AdminTableCell><span className="flex items-center gap-2 font-black"><Activity size={15} className="text-[var(--admin-accent)]" />{auditLabel(log.action, locale)}</span></AdminTableCell><AdminTableCell><span className="font-mono text-xs">{entityLabel(log.auditable_type, locale)}{log.auditable_id ? ` #${log.auditable_id}` : ""}</span></AdminTableCell><AdminTableCell>{log.actor?.name || log.actor?.phone || "—"}</AdminTableCell><AdminTableCell><span className="text-xs text-[var(--admin-muted)]">{log.created_at ? new Date(log.created_at).toLocaleString(getLocaleConfig(locale).numberLocale) : "—"}</span></AdminTableCell></AdminTableRow>)}</AdminDataTable> : <AdminEmptyState title={copy.noData} />}</div></AdminCard></>;
}
