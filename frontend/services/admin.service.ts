import { api } from "./api";

export type AdminMetrics = {
  revenue_toman: number;
  orders: number;
  customers: number;
  products: number;
  published_products: number;
  pending_orders: number;
  pending_reviews: number;
  abandoned_carts: number;
};
export type AdminAuditLog = { id: number; action: string; auditable_type?: string | null; auditable_id?: number | null; metadata?: Record<string, unknown>; actor?: { name?: string | null; phone?: string | null } | null; created_at?: string | null };
export type AdminAbandonedCart = { id: number; customer_name?: string | null; customer_phone?: string | null; customer_email?: string | null; items_count: number; total_toman: number; last_activity_at?: string | null; recovery_reminded_at?: string | null; can_recover: boolean };
export type AdminDashboard = {
  metrics: AdminMetrics;
  sales: { date: string; label: string; orders: number; revenue_toman: number }[];
  recent_orders: AdminOrder[];
  top_selling: { id: number; name_fa: string; name_en: string; sold_quantity: number }[];
  low_stock: { id: number; sku: string; stock: number; threshold: number; product: string }[];
};
export type AdminProductImage = { id?: number; path: string; alt_text?: string | null; is_primary: boolean; sort_order: number };
export type AdminProductVariant = {
  id?: number;
  sku: string;
  price_toman: number;
  price_usd: number;
  compare_at_toman?: number | null;
  compare_at_usd?: number | null;
  stock: number;
  low_stock_threshold: number;
  is_default: boolean;
  is_active: boolean;
  attribute_value_ids?: number[];
};
export type AdminAttributeValue = { id: number; slug: string; color?: string | null; name_fa: string; name_en: string };
export type AdminAttribute = { id: number; slug: string; type: string; name_fa: string; name_en: string; values: AdminAttributeValue[] };
export type AdminProduct = {
  id: number;
  slug: string;
  sku: string;
  status: "draft" | "published" | "archived";
  gender: string;
  is_featured: boolean;
  is_new: boolean;
  name_fa: string;
  name_en: string;
  category?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  description_fa?: string | null;
  description_en?: string | null;
  price_toman: number;
  price_usd: number;
  compare_at_toman?: number | null;
  compare_at_usd?: number | null;
  stock: number;
  low_stock_threshold?: number;
  low_stock: boolean;
  sort_order?: number;
  sold_quantity: number;
  variants?: AdminProductVariant[];
  images?: AdminProductImage[];
  translations?: Record<string, { name: string; description?: string | null }>;
};
export type AdminOrder = {
  id: number;
  number: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  items_count: number;
  total_toman: number;
  total_usd: number;
  created_at?: string | null;
  items?: { id: number; sku: string; name_fa: string; name_en: string; quantity: number; unit_price_toman: number; total_toman: number }[];
};
export type AdminCustomer = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  orders_count: number;
  created_at?: string | null;
  roles?: { id: number; name: string; label?: string | null }[];
};
export type AdminCustomerDetail = { customer: AdminCustomer; metrics: { orders_count: number; paid_orders: number; spent_toman: number; payment_transactions: number; returns_count: number }; orders: AdminOrder[]; returns: { id: number; order_number?: string | null; status: string; reason?: string | null; created_at?: string | null }[] };
export type AdminRole = { id: number; name: string; label: string; is_active: boolean; users_count: number; permissions: string[] };
export type AdminUser = { id: number; name: string; phone: string; email?: string | null; roles: { id: number; name: string; label?: string | null }[]; created_at?: string | null };
export type AdminBanner = { id: number; placement: string; title_fa?: string | null; title_en?: string | null; subtitle_fa?: string | null; subtitle_en?: string | null; image?: string | null; mobile_image?: string | null; href?: string | null; cta_fa?: string | null; cta_en?: string | null; accent_color: string; text_color: string; sort_order: number; starts_at?: string | null; ends_at?: string | null; is_active: boolean; metadata?: Record<string, unknown> };
export type AdminCategory = { id: number; parent_id?: number | null; slug: string; name_fa: string; name_en: string; products_count: number; is_active?: boolean };
export type AdminBrand = { id: number; slug: string; logo_path?: string | null; name_fa?: string | null; name_en?: string | null; products_count: number; is_active: boolean; sort_order: number };
export type AdminCollection = { id: number; slug: string; name_fa?: string | null; name_en?: string | null; products_count: number; product_ids: number[]; is_active: boolean; sort_order: number; starts_at?: string | null; ends_at?: string | null };
export type AdminInventoryMovement = { id: number; variant_id: number; sku?: string | null; product?: string | null; movement_type: string; quantity_delta: number; stock_before: number; stock_after: number; reason: string; actor?: string | null; created_at?: string | null };
export type AdminPaymentTransaction = { id: number; order_id: number; provider: string; provider_transaction_id?: string | null; amount_toman?: number | null; amount_usd?: number | null; status: string; paid_at?: string | null; created_at?: string | null; order?: { id: number; number: string; customer_name?: string | null } };
export type AdminShipment = { id: number; order_id: number; shipping_method_id?: number | null; tracking_code?: string | null; status: string; shipped_at?: string | null; delivered_at?: string | null; order?: { id: number; number: string; customer_name?: string | null }; method?: { id: number; name: string } };
export type AdminShippingMethod = { id: number; code: string; name_fa: string; name_en: string; price_toman: number; price_usd: number; estimated_days?: number | null; is_active: boolean; sort_order: number };
export type AdminReturnRequest = { id: number; order_id: number; user_id?: number | null; status: string; reason?: string | null; note?: string | null; created_at?: string | null; order?: { id: number; number: string; customer_name?: string | null } };
export type AdminRefund = { id: number; order_id: number; return_id?: number | null; status: string; provider: string; reference?: string | null; amount_toman: number; amount_usd: number; reason?: string | null; refunded_at?: string | null; created_at?: string | null; order?: { id: number; number: string; customer_name?: string | null } };
export type AdminHomepageSection = { id: number; key: string; section_type: string; payload?: Record<string, unknown> | null; sort_order: number; starts_at?: string | null; ends_at?: string | null; is_active: boolean; published_at?: string | null };
export type AdminCampaign = { id: number; slug: string; name_fa: string; name_en: string; discount_percent: number; starts_at: string; ends_at: string; is_active: boolean; products_count: number; ordered_quantity?: number; revenue_toman?: number; impressions?: number; clicks?: number; ab_variants?: { variant: string; events: number }[] };
export type AdminDiscount = { id: number; code: string; discount_type: string; value_toman: number; value_usd: number; percentage?: number | null; minimum_subtotal_toman: number; maximum_discount_toman?: number | null; maximum_discount_usd?: number | null; usage_limit?: number | null; used_count: number; starts_at?: string | null; ends_at?: string | null; is_active: boolean };
export type AdminReview = { id: number; rating: number; title?: string | null; body?: string | null; status: "pending" | "approved" | "rejected" | "hidden"; author?: string | null; product?: string | null; created_at?: string | null };
export type AdminPageMeta = { current_page: number; last_page: number; total: number };
export type AdminBulkResult = { updated?: number; imported?: number };
export type CampaignPayload = { slug: string; name_fa: string; name_en: string; description_fa?: string; description_en?: string; discount_percent: number; accent_color: string; starts_at: string; ends_at: string; is_active: boolean };
export type CampaignLandingPayload = { slug: string; title_fa: string; title_en: string; description_fa?: string; description_en?: string; blocks: { type: "hero" | "text" | "image" | "products" | "cta"; title?: string; body?: string; image?: string; href?: string; label?: string }[]; seo_title_fa?: string; seo_title_en?: string; is_published: boolean };
export type DiscountPayload = { code: string; discount_type: "percentage" | "fixed_toman"; value_toman: number; value_usd: number; percentage?: number | null; minimum_subtotal_toman: number; maximum_discount_toman?: number | null; maximum_discount_usd?: number | null; usage_limit?: number | null; starts_at?: string | null; ends_at?: string | null; is_active: boolean };
export type BannerPayload = Omit<AdminBanner, "id" | "metadata"> & { metadata?: Record<string, unknown> };
export type ProductPayload = {
  category_id?: number | null;
  brand_id?: number | null;
  slug: string;
  sku?: string;
  variant_sku?: string;
  gender: "men" | "women" | "unisex";
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  is_new: boolean;
  sort_order: number;
  name_fa: string;
  name_en: string;
  description_fa?: string;
  description_en?: string;
  price_toman: number;
  price_usd: number;
  compare_at_toman?: number | null;
  compare_at_usd?: number | null;
  stock: number;
  low_stock_threshold: number;
  variants?: Omit<AdminProductVariant, "id">[];
  images?: Omit<AdminProductImage, "id">[];
  translations?: Record<string, { name: string; description?: string | null }>;
};

export async function getAdminMe() {
  const response = await api.get<{ data: { id: number; name: string; phone: string; role: string; roles?: string[]; permissions?: string[] } }>("/admin/me");
  return response.data.data;
}
export async function getAdminRoles() {
  const response = await api.get<{ data: AdminRole[] }>("/admin/roles");
  return response.data.data;
}
export async function getAdminUsers(search = "") {
  const response = await api.get<{ data: AdminUser[]; meta: AdminPageMeta }>("/admin/users", { params: { search, per_page: 100 } });
  return response.data;
}
export async function changeAdminRole(userId: number, roleId: number) {
  const response = await api.put<{ message: string; data: { user_id: number; roles: string[] } }>(`/admin/users/${userId}/role`, { role_id: roleId });
  return response.data;
}
export async function assignAdminRole(userId: number, roleId: number) {
  const response = await api.put<{ message: string }>(`/admin/users/${userId}/roles/${roleId}`);
  return response.data;
}
export async function revokeAdminRole(userId: number, roleId: number) {
  const response = await api.delete<{ message: string }>(`/admin/users/${userId}/roles/${roleId}`);
  return response.data;
}
export async function getAdminDashboard() {
  const response = await api.get<{ data: AdminDashboard }>("/admin/dashboard");
  return response.data.data;
}
export async function getAdminAuditLogs(action = "", page = 1) {
  const response = await api.get<{ data: AdminAuditLog[]; meta: AdminPageMeta }>("/admin/audit-logs", { params: { action, page, per_page: 40 } });
  return response.data;
}
export async function getAdminProducts(search = "") {
  const response = await api.get<{ data: AdminProduct[]; meta: { total: number } }>("/admin/products", { params: { search, per_page: 50 } });
  return response.data;
}
export async function getAdminAbandonedCarts() {
  const response = await api.get<{ data: AdminAbandonedCart[]; meta: AdminPageMeta }>("/admin/carts/abandoned", { params: { per_page: 50 } });
  return response.data;
}
export async function sendAdminCartRecovery(id: number) {
  const response = await api.post<{ message: string }>(`/admin/carts/${id}/recovery`);
  return response.data;
}
export async function getAdminOrders(status = "", search = "", dateFrom = "", dateTo = "") {
  const response = await api.get<{ data: AdminOrder[]; meta: { total: number } }>("/admin/orders", { params: { status, search, date_from: dateFrom || undefined, date_to: dateTo || undefined, per_page: 50 } });
  return response.data;
}
export async function getAdminCustomers(search = "") {
  const response = await api.get<{ data: AdminCustomer[]; meta: { total: number } }>("/admin/customers", { params: { search, per_page: 50 } });
  return response.data;
}
export async function getAdminCustomerDetail(id: number) {
  const response = await api.get<{ data: AdminCustomerDetail }>(`/admin/customers/${id}`);
  return response.data.data;
}
export async function getAdminReviews(status = "", search = "", page = 1) {
  const response = await api.get<{ data: AdminReview[]; meta: AdminPageMeta }>("/admin/reviews", { params: { status, search, page, per_page: 20 } });
  return response.data;
}
export async function updateAdminReview(id: number, status: AdminReview["status"]) {
  const response = await api.patch<{ data: { id: number; status: AdminReview["status"] }; message: string }>(`/admin/reviews/${id}`, { status });
  return response.data;
}
export async function deleteAdminReview(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/reviews/${id}`);
  return response.data;
}
export async function bulkUpdateAdminReviews(ids: number[], status: AdminReview["status"]) {
  const response = await api.patch<{ message: string; data: AdminBulkResult }>("/admin/reviews/bulk", { ids, status });
  return response.data;
}
export async function uploadAdminProductImage(file: File) {
  const payload = new FormData();
  payload.append('image', file);
  const response = await api.post<{ data: { path: string }; message: string }>("/admin/products/images", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
export async function bulkImportAdminProducts(products: ProductPayload[]) {
  const response = await api.post<{ message: string; data: AdminBulkResult }>("/admin/products/bulk", { products });
  return response.data;
}
export async function getAdminCategories() {
  const response = await api.get<{ data: AdminCategory[] }>("/admin/categories");
  return response.data.data;
}
export async function getAdminAttributes() {
  const response = await api.get<{ data: AdminAttribute[] }>("/admin/attributes");
  return Array.isArray(response.data?.data) ? response.data.data : [];
}
export async function createAdminProduct(payload: ProductPayload) {
  const response = await api.post<{ data: AdminProduct; message: string }>("/admin/products", payload);
  return response.data;
}
export async function updateAdminProduct(id: number, payload: ProductPayload) {
  const response = await api.patch<{ data: AdminProduct; message: string }>(`/admin/products/${id}`, payload);
  return response.data;
}
export async function deleteAdminProduct(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/products/${id}`);
  return response.data;
}
export async function getAdminOrder(id: number) {
  const response = await api.get<{ data: AdminOrder }>(`/admin/orders/${id}`);
  return response.data.data;
}
export async function updateAdminOrder(id: number, status: string) {
  const response = await api.patch<{ data: AdminOrder; message: string }>(`/admin/orders/${id}`, { status });
  return response.data;
}
export async function getAdminBanners(placement = "") {
  const response = await api.get<{ data: AdminBanner[]; meta: AdminPageMeta }>("/admin/banners", { params: { placement, per_page: 50 } });
  return response.data;
}
export async function createAdminBanner(payload: BannerPayload) {
  const response = await api.post<{ data: AdminBanner; message: string }>("/admin/banners", payload);
  return response.data;
}
export async function updateAdminBanner(id: number, payload: BannerPayload) {
  const response = await api.patch<{ data: AdminBanner; message: string }>(`/admin/banners/${id}`, payload);
  return response.data;
}
export async function deleteAdminBanner(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/banners/${id}`);
  return response.data;
}
export async function getAdminCampaigns() {
  const response = await api.get<{ data: AdminCampaign[]; meta: { total: number } }>("/admin/campaigns", { params: { per_page: 50 } });
  return response.data;
}
export async function getAdminDiscounts() {
  const response = await api.get<{ data: AdminDiscount[]; meta: { total: number } }>("/admin/discounts", { params: { per_page: 50 } });
  return response.data;
}
export async function createAdminCampaign(payload: CampaignPayload) {
  const response = await api.post<{ data: AdminCampaign; message: string }>("/admin/campaigns", payload);
  return response.data;
}
export async function updateAdminCampaign(id: number, payload: CampaignPayload) {
  const response = await api.patch<{ data: AdminCampaign; message: string }>(`/admin/campaigns/${id}`, payload);
  return response.data;
}
export async function createAdminDiscount(payload: DiscountPayload) {
  const response = await api.post<{ data: AdminDiscount; message: string }>("/admin/discounts", payload);
  return response.data;
}
export async function updateAdminDiscount(id: number, payload: DiscountPayload) {
  const response = await api.patch<{ data: AdminDiscount; message: string }>(`/admin/discounts/${id}`, payload);
  return response.data;
}
export async function getAdminCampaignLanding(id: number) {
  const response = await api.get<{ data: CampaignLandingPayload }>(`/admin/campaigns/${id}/landing`);
  return response.data.data;
}
export async function updateAdminCampaignLanding(id: number, payload: CampaignLandingPayload) {
  const response = await api.put<{ data: CampaignLandingPayload; message: string }>(`/admin/campaigns/${id}/landing`, payload);
  return response.data;
}
export async function deleteAdminCampaign(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/campaigns/${id}`);
  return response.data;
}
export async function deleteAdminDiscount(id: number) {
  const response = await api.delete<{ message: string }>(`/admin/discounts/${id}`);
  return response.data;
}
