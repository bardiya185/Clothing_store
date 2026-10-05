"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminMe } from "@/services/admin.service";
import { useLocale } from "@/hooks/useLocale";
import { getAdminMessages } from "@/features/admin/admin-copy";
import { AdminShell, type AdminSection } from "@/features/admin/AdminShell";
import { AdminDashboardView } from "@/features/admin/dashboard/AdminDashboardView";
import { AdminProductsView } from "@/features/admin/catalog/AdminProductsView";
import { AdminCatalogManagementView } from "@/features/admin/catalog/AdminCatalogManagementView";
import { AdminOrdersView, AdminCustomersView } from "@/features/admin/sales/AdminSalesViews";
import { AdminFulfillmentView } from "@/features/admin/sales/AdminFulfillmentView";
import { AdminMarketingView } from "@/features/admin/marketing/AdminMarketingView";
import { AdminInventoryView, AdminReviewsView } from "@/features/admin/content/AdminContentViews";
import { AdminAccessView, AdminActivityView } from "@/features/admin/access/AdminAccessViews";
import { AdminAnalyticsView } from "@/features/admin/analytics/AdminAnalyticsView";
import { AdminErrorState, AdminLoadingState } from "@/components/admin-ui/AdminPrimitives";
import { getApiErrorMessage } from "@/lib/api-error";

export default function AdminApp() {
  const { locale } = useLocale();
  const copy = getAdminMessages(locale);
  const [section, setSection] = useState<AdminSection>("dashboard");
  const me = useQuery({ queryKey: ["admin", "me"], queryFn: getAdminMe, staleTime: 5 * 60_000 });

  if (me.isLoading) return <div className="admin-panel min-h-screen p-5 sm:p-8"><AdminLoadingState /></div>;
  if (me.isError || !me.data) return <div className="admin-panel min-h-screen p-5 sm:p-8"><AdminErrorState message={getApiErrorMessage(me.error, copy.noPermission)} onRetry={() => void me.refetch()} /></div>;

  const permissions = me.data.permissions ?? [];
  const renderSection = () => {
    if (section === "dashboard") return <AdminDashboardView locale={locale} onNavigate={setSection} />;
    if (section === "catalog") return <AdminCatalogManagementView locale={locale} />;
    if (section === "products") return <AdminProductsView locale={locale} />;
    if (section === "inventory") return <AdminInventoryView locale={locale} />;
    if (section === "orders") return <AdminOrdersView locale={locale} />;
    if (section === "customers") return <AdminCustomersView locale={locale} />;
    if (section === "fulfillment") return <AdminFulfillmentView locale={locale} />;
    if (section === "marketing") return <AdminMarketingView locale={locale} />;
    if (section === "reviews") return <AdminReviewsView locale={locale} />;
    if (section === "analytics") return <AdminAnalyticsView locale={locale} />;
    if (section === "roles") return <AdminAccessView locale={locale} />;
    return <AdminActivityView locale={locale} />;
  };

  return <AdminShell permissions={permissions} adminName={me.data.name || me.data.phone} activeSection={section} onSectionChange={setSection} onRefresh={() => { void me.refetch(); }}><div className="animate-page-entry">{renderSection()}</div></AdminShell>;
}
