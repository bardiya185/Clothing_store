import { api } from "./api";
import type { AdminBrand, AdminCategory, AdminCollection, AdminHomepageSection, AdminInventoryMovement, AdminPageMeta, AdminPaymentTransaction, AdminRefund, AdminReturnRequest, AdminShipment, AdminShippingMethod } from "./admin.service";

export type AdminListResponse<T> = { data: T[]; meta?: AdminPageMeta };

export async function getAdminBrands(search = "") {
  const response = await api.get<AdminListResponse<AdminBrand>>("/admin/brands", { params: { search, per_page: 100 } });
  return response.data;
}
export async function getAdminCollections(search = "") {
  const response = await api.get<AdminListResponse<AdminCollection>>("/admin/collections", { params: { search, per_page: 100 } });
  return response.data;
}
export async function createAdminBrand(payload: { slug: string; translations: Record<string, { name: string; description?: string }>; is_active: boolean; sort_order: number }) {
  const response = await api.post<{ data: AdminBrand }>("/admin/brands", payload);
  return response.data.data;
}
export async function updateAdminBrand(id: number, payload: { slug: string; translations: Record<string, { name: string; description?: string }>; is_active: boolean; sort_order: number }) {
  const response = await api.patch<{ data: AdminBrand }>(`/admin/brands/${id}`, payload);
  return response.data.data;
}
export async function deleteAdminBrand(id: number) { await api.delete(`/admin/brands/${id}`); }
export async function createAdminCollection(payload: { slug: string; translations: Record<string, { name: string; description?: string }>; is_active: boolean; sort_order: number; product_ids?: number[] }) {
  const response = await api.post<{ data: AdminCollection }>("/admin/collections", payload);
  return response.data.data;
}
export async function updateAdminCollection(id: number, payload: { slug: string; translations: Record<string, { name: string; description?: string }>; is_active: boolean; sort_order: number; product_ids?: number[] }) {
  const response = await api.patch<{ data: AdminCollection }>(`/admin/collections/${id}`, payload);
  return response.data.data;
}
export async function deleteAdminCollection(id: number) { await api.delete(`/admin/collections/${id}`); }
export async function createAdminCategory(payload: { slug: string; translations: Record<string, { name: string; description?: string }>; parent_id?: number | null; is_active: boolean; sort_order: number }) {
  const response = await api.post<{ data: AdminCategory }>("/admin/categories", payload);
  return response.data.data;
}
export async function updateAdminCategory(id: number, payload: { slug: string; translations: Record<string, { name: string; description?: string }>; parent_id?: number | null; is_active: boolean; sort_order: number }) {
  const response = await api.patch<{ data: AdminCategory }>(`/admin/categories/${id}`, payload);
  return response.data.data;
}
export async function deleteAdminCategory(id: number) { await api.delete(`/admin/categories/${id}`); }
export async function getAdminCategoryTree() {
  const response = await api.get<{ data: AdminCategory[] }>("/admin/categories");
  return response.data.data;
}
export async function getAdminInventory(page = 1, variantId?: number) {
  const response = await api.get<AdminListResponse<AdminInventoryMovement>>("/admin/inventory/movements", { params: { page, variant_id: variantId, per_page: 50 } });
  return response.data;
}
export async function adjustAdminInventory(variantId: number, quantityDelta: number, reason: string) {
  const response = await api.post<{ data: AdminInventoryMovement }>("/admin/inventory/adjust", { variant_id: variantId, quantity_delta: quantityDelta, reason });
  return response.data.data;
}
export async function getAdminPayments(status = "") {
  const response = await api.get<AdminListResponse<AdminPaymentTransaction>>("/admin/payments", { params: { status, per_page: 50 } });
  return response.data;
}
export async function getAdminShipments(status = "") {
  const response = await api.get<AdminListResponse<AdminShipment>>("/admin/shipments", { params: { status, per_page: 50 } });
  return response.data;
}
export async function updateAdminShipment(id: number, payload: { status: string; tracking_code?: string; failure_reason?: string }) {
  const response = await api.patch<{ data: AdminShipment }>(`/admin/shipments/${id}`, payload);
  return response.data.data;
}
export async function getAdminShippingMethods() {
  const response = await api.get<{ data: AdminShippingMethod[] }>("/admin/shipping-methods");
  return response.data.data;
}
export async function createAdminShippingMethod(payload: Omit<AdminShippingMethod, "id">) {
  const response = await api.post<{ data: AdminShippingMethod }>("/admin/shipping-methods", payload);
  return response.data.data;
}
export async function updateAdminShippingMethod(id: number, payload: Omit<AdminShippingMethod, "id">) {
  const response = await api.patch<{ data: AdminShippingMethod }>(`/admin/shipping-methods/${id}`, payload);
  return response.data.data;
}
export async function deleteAdminShippingMethod(id: number) { await api.delete(`/admin/shipping-methods/${id}`); }
export async function getAdminReturns(status = "") {
  const response = await api.get<AdminListResponse<AdminReturnRequest>>("/admin/returns", { params: { status, per_page: 50 } });
  return response.data;
}
export async function updateAdminReturn(id: number, payload: { status: string; note?: string }) {
  const response = await api.patch<{ data: AdminReturnRequest }>(`/admin/returns/${id}`, payload);
  return response.data.data;
}
export async function getAdminRefunds(status = "") {
  const response = await api.get<AdminListResponse<AdminRefund>>("/admin/refunds", { params: { status, per_page: 50 } });
  return response.data;
}
export async function createAdminRefund(returnId: number, payload: { provider: string; amount_toman: number; amount_usd: number; reason?: string }) {
  const response = await api.post<{ data: AdminRefund }>(`/admin/returns/${returnId}/refund`, payload);
  return response.data.data;
}
export async function updateAdminRefund(id: number, payload: { status: string; reference?: string; reason?: string }) {
  const response = await api.patch<{ data: AdminRefund }>(`/admin/refunds/${id}`, payload);
  return response.data.data;
}
export async function getAdminHomepageSections() {
  const response = await api.get<{ data: AdminHomepageSection[] }>("/admin/homepage-sections");
  return response.data.data;
}
export async function createAdminHomepageSection(payload: Omit<AdminHomepageSection, "id" | "published_at">) {
  const response = await api.post<{ data: AdminHomepageSection }>("/admin/homepage-sections", payload);
  return response.data.data;
}
export async function updateAdminHomepageSection(id: number, payload: Omit<AdminHomepageSection, "id" | "published_at">) {
  const response = await api.patch<{ data: AdminHomepageSection }>(`/admin/homepage-sections/${id}`, payload);
  return response.data.data;
}
export async function deleteAdminHomepageSection(id: number) {
  await api.delete(`/admin/homepage-sections/${id}`);
}
export type AdminAnalytics = { period: number; summary: { orders: number; paid_orders: number; revenue_toman: number; average_order_toman: number }; sales: { date: string; label: string; orders: number; revenue_toman: number }[] };
export async function getAdminAnalytics(period: 7 | 30 | 90 = 30) {
  const response = await api.get<{ data: AdminAnalytics }>("/admin/analytics", { params: { period } });
  return response.data.data;
}
export async function searchAdmin(query: string) {
  const response = await api.get<{ data: { type: string; id: number; label: string; meta?: string | null }[] }>("/admin/search", { params: { q: query } });
  return response.data.data;
}
export async function getAdminNotifications(unreadOnly = false) {
  const response = await api.get<AdminListResponse<{ id: number; title: string; body?: string | null; read_at?: string | null; created_at?: string | null }>>("/admin/notifications", { params: { unread_only: unreadOnly, per_page: 30 } });
  return response.data;
}
export async function markAdminNotificationRead(id: number) {
  await api.patch(`/admin/notifications/${id}/read`);
}
