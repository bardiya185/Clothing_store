"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  BadgePercent,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  Users,
  X,
  Wand2,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { useLogOut } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { adminNavigationPermissions, canLoadAdminResource } from "@/lib/admin-permissions";
import { currencyRegistry, getLocaleConfig, getSupportedLocales, type CurrencyCode } from "@/lib/i18n";
import { localDateTimeFromNow, randomSlug, slugify, toIsoDateTime } from "@/lib/admin-content";
import { AdminDateTimeField, AdminField, HelpCard } from "@/components/admin/AdminField";
import {
  createAdminCampaign,
  createAdminDiscount,
  createAdminProduct,
  deleteAdminCampaign,
  deleteAdminDiscount,
  deleteAdminProduct,
  getAdminCampaigns,
  getAdminCategories,
  getAdminAttributes,
  getAdminCustomers,
  getAdminDashboard,
  getAdminAuditLogs,
  getAdminAbandonedCarts,
  sendAdminCartRecovery,
  getAdminDiscounts,
  getAdminMe,
  getAdminRoles,
  assignAdminRole,
  revokeAdminRole,
  getAdminCampaignLanding,
  updateAdminCampaignLanding,
  getAdminOrder,
  getAdminOrders,
  getAdminProducts,
  getAdminReviews,
  updateAdminReview,
  deleteAdminReview,
  bulkUpdateAdminReviews,
  bulkImportAdminProducts,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  updateAdminOrder,
  updateAdminProduct,
  uploadAdminProductImage,
  type AdminCampaign,
  type AdminCategory,
  type AdminCustomer,
  type AdminDashboard,
  type AdminAuditLog,
  type AdminAbandonedCart,
  type AdminDiscount,
  type AdminOrder,
  type AdminProduct,
  type AdminReview,
  type AdminRole,
  type AdminBanner,
  type AdminAttribute,
  type BannerPayload,
  type CampaignLandingPayload,
  type CampaignPayload,
  type DiscountPayload,
  type ProductPayload,
} from "@/services/admin.service";

const emptyProduct: ProductPayload = {
  category_id: null,
  slug: "",
  sku: "",
  variant_sku: "",
  gender: "unisex",
  status: "draft",
  is_featured: false,
  is_new: false,
  sort_order: 0,
  name_fa: "",
  name_en: "",
  description_fa: "",
  description_en: "",
  price_toman: 0,
  price_usd: 0,
  compare_at_toman: null,
  compare_at_usd: null,
  stock: 0,
  low_stock_threshold: 3,
};

type Tab = "dashboard" | "products" | "orders" | "customers" | "reviews" | "marketing" | "roles" | "activity" | "recovery";

function parseNumericInput(value: string) {
  const normalized = value.replace(/[^0-9.]/g, "");
  if (!normalized || normalized === ".") return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeSkuInput(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 120);
}

function generateSkuFromName(value: string) {
  const base = slugify(value).toUpperCase().replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "PRODUCT";
  const suffix = randomSlug("sku").replace(/^sku-/, "").slice(0, 6).toUpperCase();
  return normalizeSkuInput(`PRD-${base}-${suffix}`);
}

function formatToman(value: number, locale: string) {
  const numberLocale = getLocaleConfig(locale).numberLocale;
  return locale === "fa"
    ? `${value.toLocaleString(numberLocale)} تومان`
    : `${value.toLocaleString(numberLocale)} Toman`;
}

function formatAdminPrice(toman: number, usd: number, locale: string) {
  const config = getLocaleConfig(locale);
  if (config.currency === "USD") {
    return new Intl.NumberFormat(config.numberLocale, { style: "currency", currency: "USD" }).format(usd);
  }
  return `${toman.toLocaleString(config.numberLocale)} ${currencyRegistry[config.currency as CurrencyCode]?.symbol ?? config.currency}`;
}

function statusLabel(status: string, locale: string) {
  const fa: Record<string, string> = {
    draft: "پیش‌نویس", published: "منتشرشده", archived: "آرشیو",
    pending: "در انتظار", paid: "پرداخت‌شده", processing: "در حال پردازش",
    shipped: "ارسال‌شده", completed: "تکمیل‌شده", cancelled: "لغوشده",
    returned: "مرجوعی", refunded: "مستردشده",
  };
  const en: Record<string, string> = {
    draft: "Draft", published: "Published", archived: "Archived",
    pending: "Pending", paid: "Paid", processing: "Processing",
    shipped: "Shipped", completed: "Completed", cancelled: "Cancelled",
    returned: "Returned", refunded: "Refunded",
  };
  return (locale === "fa" ? fa : en)[status] ?? status;
}

export default function AdminPage() {
  const { locale, setLocale } = useLocale();
  const logout = useLogOut();
  const isFa = locale === "fa";
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [discounts, setDiscounts] = useState<AdminDiscount[]>([]);
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [attributes, setAttributes] = useState<AdminAttribute[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AdminAbandonedCart[]>([]);
  const [counts, setCounts] = useState({ products: 0, orders: 0, customers: 0, reviews: 0, campaigns: 0, discounts: 0 });
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewMeta, setReviewMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [productModal, setProductModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productForm, setProductForm] = useState<ProductPayload>(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setPermissionsLoaded(false);
    try {
      // Resolve identity and permissions first. The client only uses this to
      // avoid noisy/forbidden requests; backend middleware remains the real
      // authorization boundary.
      const me = await getAdminMe();
      const nextPermissions = me.permissions ?? [];
      setAdminName(me.name || me.phone);
      setPermissions(nextPermissions);
      setPermissionsLoaded(true);

      const canLoad = (permission: string) => canLoadAdminResource(nextPermissions, permission);
      const [dashboardResult, productsResult, ordersResult, abandonedCartsResult, customersResult, reviewsResult, campaignsResult, discountsResult, bannersResult, categoriesResult, attributesResult, rolesResult, auditResult] = await Promise.allSettled([
        canLoad(adminNavigationPermissions.dashboard) ? getAdminDashboard() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.products) ? getAdminProducts(search) : Promise.resolve(null),
        canLoad(adminNavigationPermissions.orders) ? getAdminOrders(orderStatus, search, orderDateFrom, orderDateTo) : Promise.resolve(null),
        canLoad(adminNavigationPermissions.recovery) ? getAdminAbandonedCarts() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.customers) ? getAdminCustomers(search) : Promise.resolve(null),
        canLoad(adminNavigationPermissions.reviews) ? getAdminReviews("", search, reviewPage) : Promise.resolve(null),
        canLoad(adminNavigationPermissions.marketing) ? getAdminCampaigns() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.marketing) ? getAdminDiscounts() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.marketing) ? getAdminBanners() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.products) ? getAdminCategories() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.products) ? getAdminAttributes() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.roles) ? getAdminRoles() : Promise.resolve(null),
        canLoad(adminNavigationPermissions.activity) ? getAdminAuditLogs(search) : Promise.resolve(null),
      ]);

      const fulfilled = <T,>(result: PromiseSettledResult<T | null>, fallback: T): T => result.status === "fulfilled" && result.value !== null ? result.value : fallback;
      const dashboardData = fulfilled(dashboardResult, null);
      const productsData = fulfilled(productsResult, { data: [], meta: { total: 0 } });
      const ordersData = fulfilled(ordersResult, { data: [], meta: { total: 0 } });
      const abandonedCartsData = fulfilled(abandonedCartsResult, { data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
      const customersData = fulfilled(customersResult, { data: [], meta: { total: 0 } });
      const reviewsData = fulfilled(reviewsResult, { data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
      const campaignsData = fulfilled(campaignsResult, { data: [], meta: { total: 0 } });
      const discountsData = fulfilled(discountsResult, { data: [], meta: { total: 0 } });
      const bannersData = fulfilled(bannersResult, { data: [], meta: { current_page: 1, last_page: 1, total: 0 } });
      const categoriesData = fulfilled(categoriesResult, []);
      const attributesData = fulfilled(attributesResult, []);
      const rolesData = fulfilled(rolesResult, []);
      const auditData = fulfilled(auditResult, { data: [], meta: { current_page: 1, last_page: 1, total: 0 } });

      setDashboard(dashboardData);
      setProducts(productsData.data);
      setOrders(ordersData.data);
      setAbandonedCarts(abandonedCartsData.data);
      setCustomers(customersData.data);
      setReviews(reviewsData.data);
      setReviewMeta(reviewsData.meta);
      setCampaigns(campaignsData.data);
      setDiscounts(discountsData.data);
      setBanners(bannersData.data);
      setCategories(categoriesData);
      setAttributes(attributesData);
      setRoles(rolesData);
      setAuditLogs(auditData.data);
      setCounts({ products: productsData.meta.total, orders: ordersData.meta.total, customers: customersData.meta.total, reviews: reviewsData.meta.total, campaigns: campaignsData.meta.total, discounts: discountsData.meta.total });
    } catch (requestError) {
      setPermissionsLoaded(false);
      setError(
        getApiErrorMessage(requestError, isFa ? "دریافت اطلاعات پنل مدیریت ناموفق بود." : "Could not load the admin workspace."),
      );
    } finally {
      setLoading(false);
    }
  }, [isFa, reviewPage, search, orderStatus, orderDateFrom, orderDateTo]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "/" && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        setCommandOpen(true);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({ ...emptyProduct, slug: randomSlug("product") });
    setProductModal(true);
  };

  const openEditProduct = (product: AdminProduct) => {
    setEditingProduct(product);
    setProductForm({
      ...emptyProduct,
      slug: product.slug,
      sku: product.sku,
      gender: product.gender as ProductPayload["gender"],
      status: product.status,
      is_featured: product.is_featured,
      is_new: product.is_new,
      name_fa: product.name_fa,
      name_en: product.name_en,
      description_fa: product.description_fa ?? "",
      description_en: product.description_en ?? "",
      price_toman: product.price_toman,
      price_usd: product.price_usd,
      compare_at_toman: product.compare_at_toman ?? null,
      compare_at_usd: product.compare_at_usd ?? null,
      stock: product.stock,
      low_stock_threshold: product.low_stock_threshold ?? 3,
      sort_order: product.sort_order ?? 0,
      category_id: product.category_id ?? null,
      variants: product.variants?.map((variant) => ({
        sku: variant.sku,
        price_toman: variant.price_toman,
        price_usd: variant.price_usd,
        compare_at_toman: variant.compare_at_toman ?? null,
        compare_at_usd: variant.compare_at_usd ?? null,
        stock: variant.stock,
        low_stock_threshold: variant.low_stock_threshold,
        is_default: variant.is_default,
        is_active: variant.is_active,
        attribute_value_ids: variant.attribute_value_ids ?? [],
      })),
      images: product.images?.map((image) => ({
        path: image.path,
        alt_text: image.alt_text ?? null,
        is_primary: image.is_primary,
        sort_order: image.sort_order,
      })),
      translations: product.translations ?? {},
    });
    setProductModal(true);
  };

  const uploadProductImage = async (file: File) => {
    try {
      const result = await uploadAdminProductImage(file);
      toast.success(result.message);
      return result.data.path;
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "بارگذاری تصویر ناموفق بود." : "Could not upload the image."));
      throw requestError;
    }
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const supportedLocales = getSupportedLocales();
      const firstLocalizedName = supportedLocales
        .map((option) => option.code === "fa" ? productForm.name_fa : option.code === "en" ? productForm.name_en : productForm.translations?.[option.code]?.name)
        .find((value) => Boolean(value?.trim()))?.trim() ?? "Product";
      const normalizedProduct: ProductPayload = {
        ...productForm,
        name_fa: productForm.name_fa.trim() || firstLocalizedName,
        name_en: productForm.name_en.trim() || firstLocalizedName,
        slug: slugify(productForm.slug),
        sku: normalizeSkuInput(productForm.sku || generateSkuFromName(productForm.name_en || firstLocalizedName)),
        variants: productForm.variants?.map((variant) => ({ ...variant, sku: normalizeSkuInput(variant.sku || generateSkuFromName(productForm.name_en || firstLocalizedName)) })),
      };
      const result = editingProduct
        ? await updateAdminProduct(editingProduct.id, normalizedProduct)
        : await createAdminProduct(normalizedProduct);
      toast.success(result.message);
      setProductModal(false);
      await load();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "ذخیره محصول ناموفق بود." : "Could not save the product."));
    } finally {
      setSaving(false);
    }
  };

  const importProducts = async (rows: ProductPayload[]) => {
    setSaving(true);
    try {
      const result = await bulkImportAdminProducts(rows);
      toast.success(result.message);
      setImportModal(false);
      await load();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "ورود گروهی محصولات ناموفق بود." : "Could not import products."));
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product: AdminProduct) => {
    if (!window.confirm(isFa ? `محصول «${product.name_fa}» حذف شود؟` : `Delete ${product.name_en}?`)) return;
    try {
      const result = await deleteAdminProduct(product.id);
      toast.success(result.message);
      await load();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "حذف محصول ناموفق بود." : "Delete failed."));
    }
  };

  const remindAbandonedCart = async (cart: AdminAbandonedCart) => {
    try {
      const result = await sendAdminCartRecovery(cart.id);
      toast.success(result.message);
      await load();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "ارسال ایمیل بازیابی ناموفق بود." : "Could not queue the recovery email."));
    }
  };

  const viewOrder = async (order: AdminOrder) => {
    try {
      setSelectedOrder(await getAdminOrder(order.id));
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "جزئیات سفارش دریافت نشد." : "Could not load order details."));
    }
  };

  const changeOrderStatus = async (order: AdminOrder, status: string) => {
    try {
      const result = await updateAdminOrder(order.id, status);
      toast.success(result.message);
      setOrders((current) => current.map((item) => item.id === order.id ? result.data : item));
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, isFa ? "به‌روزرسانی سفارش ناموفق بود." : "Could not update the order."));
    }
  };

  const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard; permission: string }[] = [
    { id: "dashboard", label: isFa ? "نمای کلی" : "Overview", icon: LayoutDashboard, permission: adminNavigationPermissions.dashboard },
    { id: "products", label: isFa ? "محصولات" : "Products", icon: Package, permission: adminNavigationPermissions.products },
    { id: "orders", label: isFa ? "سفارش‌ها" : "Orders", icon: ShoppingBag, permission: adminNavigationPermissions.orders },
    { id: "customers", label: isFa ? "مشتری‌ها" : "Customers", icon: Users, permission: adminNavigationPermissions.customers },
    { id: "reviews", label: isFa ? "نظرات" : "Reviews", icon: Star, permission: adminNavigationPermissions.reviews },
    { id: "marketing", label: isFa ? "کمپین و تخفیف" : "Marketing", icon: BadgePercent, permission: adminNavigationPermissions.marketing },
    { id: "roles", label: isFa ? "نقش‌ها و دسترسی" : "Roles & access", icon: ShieldCheck, permission: adminNavigationPermissions.roles },
    { id: "activity", label: isFa ? "گزارش فعالیت" : "Activity log", icon: Activity, permission: adminNavigationPermissions.activity },
    { id: "recovery", label: isFa ? "سبدهای رهاشده" : "Abandoned carts", icon: ShoppingBag, permission: adminNavigationPermissions.recovery },
  ];
  const visibleNavItems = permissionsLoaded
    ? navItems.filter((item) => canLoadAdminResource(permissions, item.permission))
    : [];

  const activeTab: Tab = permissionsLoaded && visibleNavItems.length > 0 && !visibleNavItems.some((item) => item.id === tab)
    ? visibleNavItems[0].id
    : tab;
  const normalizedCommandQuery = commandQuery.trim().toLocaleLowerCase();
  const commandResults = [
    ...visibleNavItems.map((item) => ({
      key: `nav-${item.id}`,
      label: item.label,
      detail: isFa ? "رفتن به بخش پنل" : "Go to workspace section",
      icon: item.icon,
      action: () => { setTab(item.id); setCommandOpen(false); setCommandQuery(""); },
    })),
    ...products.slice(0, 8).map((product) => ({
      key: `product-${product.id}`,
      label: isFa ? product.name_fa : product.name_en,
      detail: `${isFa ? "محصول" : "Product"} · ${product.sku}`,
      icon: Package,
      action: () => { setTab("products"); setCommandOpen(false); setCommandQuery(product.sku); },
    })),
    ...orders.slice(0, 8).map((order) => ({
      key: `order-${order.id}`,
      label: order.number,
      detail: `${isFa ? "سفارش" : "Order"} · ${order.customer_name}`,
      icon: ShoppingBag,
      action: () => { setTab("orders"); setCommandOpen(false); void viewOrder(order); },
    })),
  ].filter((item) => !normalizedCommandQuery || `${item.label} ${item.detail}`.toLocaleLowerCase().includes(normalizedCommandQuery)).slice(0, 12);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f3e9df] via-[#edf6f6] to-[#eaf0fb]"><RefreshCw className="animate-spin text-sky-600" size={28} /></div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f3e9df] via-[#edf6f6] to-[#eaf0fb] p-6" dir={getLocaleConfig(locale).direction}>
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white/60 backdrop-blur-xl p-8 text-center shadow-xl">
          <ShieldCheck className="mx-auto text-rose-500" size={42} />
          <h1 className="mt-4 text-xl font-black">{isFa ? "دسترسی به پنل مدیریت ممکن نیست" : "Admin access required"}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">{error}</p>
          <a href="/login?next=/admin" className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">{isFa ? "ورود" : "Sign in"}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell min-h-screen overflow-x-hidden bg-[#f7f7fc] text-slate-900" dir={getLocaleConfig(locale).direction}>
      <div className="flex min-h-screen">
        {sidebarOpen && <button aria-label="Close menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" />}
        <aside className={`fixed inset-y-0 z-50 flex w-72 max-w-[88vw] flex-col overflow-hidden border-e border-[#e8e5f4] bg-[#fbfaff] px-5 py-6 pb-24 text-slate-700 shadow-[8px_0_30px_rgba(93,81,160,.04)] transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : isFa ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7c5ce6] text-lg font-black text-white shadow-lg shadow-[#7c5ce6]/25">B</span><div><p className="text-[11px] font-bold uppercase tracking-[.22em] text-[#8b7ac8]">BARAN / ADMIN</p><h1 className="mt-1 text-xl font-black text-slate-900">Control room</h1></div></div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
          <div className="mt-10 rounded-2xl border border-[#e8e5f4] bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ece8ff] font-black text-[#6f52d9]">{adminName.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-800">{adminName}</p><p className="text-xs text-slate-400">{isFa ? "مدیر سیستم" : "Administrator"}</p></div></div></div>
          <nav className="mt-8 grid gap-2">
            {visibleNavItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setSidebarOpen(false); setSearch(""); }} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${activeTab === id ? "bg-[#7c5ce6] text-white shadow-lg shadow-[#7c5ce6]/20" : "text-slate-500 hover:bg-[#f0edff] hover:text-[#6548cb]"}`}><Icon size={18} />{label}</button>)}
          </nav>
          <div className="absolute bottom-6 inset-x-5"><button onClick={() => logout.mutate()} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut size={18} />{isFa ? "خروج" : "Sign out"}</button></div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <header className="sticky top-0 z-30 border-b border-[#e8e5f4] bg-white/90 px-3 py-3 backdrop-blur-xl sm:px-8 sm:py-4"><div className="mx-auto flex w-full max-w-[1600px] items-center gap-3"><button aria-label={isFa ? "باز کردن منو" : "Open menu"} className="shrink-0 rounded-xl border border-[#e9e6f4] bg-white p-2 backdrop-blur-xl lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><div className="min-w-0 flex-1 sm:hidden"><p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-sky-600">{isFa ? "مدیریت فروشگاه" : "Store operations"}</p><h2 className="mt-0.5 truncate text-lg font-black">{visibleNavItems.find((item) => item.id === activeTab)?.label}</h2></div><div className="hidden min-w-0 sm:block"><p className="text-xs font-bold uppercase tracking-[.22em] text-sky-600">{isFa ? "مدیریت فروشگاه" : "Store operations"}</p><h2 className="mt-1 text-xl font-black">{visibleNavItems.find((item) => item.id === activeTab)?.label}</h2></div><div className="ms-auto flex shrink-0 items-center gap-2"><div className="relative hidden sm:block"><Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isFa ? "جست‌وجو..." : "Search..."} className="w-64 rounded-xl border border-[#e9e6f4] bg-white py-2.5 ps-10 pe-4 text-sm outline-none backdrop-blur-xl focus:border-sky-400" /></div><button aria-label={isFa ? "جست‌وجوی سریع" : "Quick search"} onClick={() => setCommandOpen(true)} className="hidden items-center gap-2 rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-xs font-bold text-slate-500 backdrop-blur-xl hover:text-sky-600 sm:flex"><Search size={16} /><span>{isFa ? "جست‌وجوی سریع" : "Quick search"}</span><kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd></button><div className="hidden items-center gap-1 rounded-xl border border-[#e9e6f4] bg-white px-2 py-1.5 sm:flex">{getSupportedLocales().map((option) => <button key={option.code} type="button" onClick={() => setLocale(option.code)} className={`rounded-lg px-2 py-1 text-xs font-black transition ${locale === option.code ? "bg-violet-100 text-violet-700" : "text-slate-400 hover:text-violet-600"}`}>{option.label}</button>)}</div><button aria-label={isFa ? "بازخوانی" : "Refresh"} onClick={() => void load()} className="rounded-xl border border-[#e9e6f4] bg-white p-2.5 text-slate-500 backdrop-blur-xl hover:text-sky-600" title="Refresh"><RefreshCw size={18} /></button></div></div><div className="relative mt-3 sm:hidden"><Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isFa ? "جست‌وجوی محصولات، سفارش‌ها..." : "Search products, orders..."} className="w-full rounded-xl border border-[#e9e6f4] bg-white py-2.5 ps-9 pe-3 text-sm outline-none backdrop-blur-xl focus:border-sky-400" /></div></header>

          <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-8">
            {activeTab === "dashboard" && dashboard && <DashboardView dashboard={dashboard} locale={locale} />}
            {activeTab === "products" && <ProductsView products={products} total={counts.products} locale={locale} onNew={openNewProduct} onImport={() => setImportModal(true)} onEdit={openEditProduct} onDelete={removeProduct} />}
            {activeTab === "orders" && <OrdersView orders={orders} total={counts.orders} locale={locale} status={orderStatus} dateFrom={orderDateFrom} dateTo={orderDateTo} onFilter={(next) => { setOrderStatus(next.status); setOrderDateFrom(next.dateFrom); setOrderDateTo(next.dateTo); }} onStatus={changeOrderStatus} onDetails={viewOrder} />}
            {activeTab === "customers" && <CustomersView customers={customers} total={counts.customers} locale={locale} />}
            {activeTab === "reviews" && <ReviewsView reviews={reviews} total={counts.reviews} locale={locale} page={reviewMeta.current_page} lastPage={reviewMeta.last_page} onPage={setReviewPage} onReload={load} />}
            {activeTab === "marketing" && <MarketingView campaigns={campaigns} discounts={discounts} banners={banners} locale={locale} onReload={load} />}
            {activeTab === "roles" && <RolesView roles={roles} customers={customers} locale={locale} onReload={load} />}
            {activeTab === "activity" && <ActivityView logs={auditLogs} locale={locale} />}
            {activeTab === "recovery" && <AbandonedCartsView carts={abandonedCarts} locale={locale} onRemind={remindAbandonedCart} />}
          </div>
        </main>
      </div>
      {commandOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/35 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setCommandOpen(false)}><div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-[#e7e2ff] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} dir={getLocaleConfig(locale).direction}><div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4"><Search size={20} className="text-violet-500" /><input autoFocus value={commandQuery} onChange={(event) => setCommandQuery(event.target.value)} placeholder={isFa ? "محصول، سفارش یا بخش موردنظر را جست‌وجو کنید..." : "Search a product, order or section..."} className="min-w-0 flex-1 bg-transparent text-sm font-bold outline-none" /><kbd className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-400">ESC</kbd></div><div className="max-h-[55vh] overflow-y-auto p-2">{commandResults.length ? commandResults.map((item) => { const Icon = item.icon; return <button key={item.key} type="button" onClick={item.action} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition hover:bg-violet-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Icon size={18} /></span><span className="min-w-0"><span className="block truncate text-sm font-black text-slate-800">{item.label}</span><span className="mt-0.5 block truncate text-xs text-slate-400">{item.detail}</span></span><ArrowUpRight size={15} className="ms-auto shrink-0 text-slate-300" /></button>; }) : <p className="px-4 py-10 text-center text-sm text-slate-400">{isFa ? "نتیجه‌ای پیدا نشد." : "No matching result."}</p>}</div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400"><span>{isFa ? "میانبرهای پنل" : "Workspace shortcuts"}</span><span className="font-mono">/ · ⌘K · ESC</span></div></div></div>}
      {selectedOrder && <OrderDetailModal order={selectedOrder} locale={locale} onClose={() => setSelectedOrder(null)} />}
      {productModal && <ProductModal locale={locale} categories={categories} attributes={attributes} form={productForm} setForm={setProductForm} editing={Boolean(editingProduct)} saving={saving} onUploadImage={uploadProductImage} onClose={() => setProductModal(false)} onSubmit={saveProduct} />}
      {importModal && <BulkProductImportModal locale={locale} saving={saving} onClose={() => setImportModal(false)} onImport={importProducts} />}
    </div>
  );
}

function RolesView({ roles, customers, locale, onReload }: { roles: AdminRole[]; customers: AdminCustomer[]; locale: string; onReload: () => Promise<void> }) {
  const isFa = locale === "fa";
  const [userId, setUserId] = useState<number | null>(customers[0]?.id ?? null);
  const [roleId, setRoleId] = useState<number | null>(roles[0]?.id ?? null);
  const [working, setWorking] = useState(false);
  const selectedUser = customers.find((customer) => customer.id === userId);

  const changeRole = async (action: "assign" | "revoke") => {
    if (!userId || !roleId) return;
    setWorking(true);
    try {
      const result = action === "assign" ? await assignAdminRole(userId, roleId) : await revokeAdminRole(userId, roleId);
      toast.success(result.message);
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "تغییر نقش ناموفق بود." : "Could not change role."));
    } finally {
      setWorking(false);
    }
  };

  return <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]"><section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between"><div><h3 className="font-black">{isFa ? "نقش‌ها و دسترسی‌ها" : "Roles & permissions"}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{isFa ? "دسترسی را بدون تغییر کد به کاربران اختصاص دهید." : "Assign operational access without changing code."}</p></div><ShieldCheck className="text-violet-600" size={21} /></div><div className="mt-6 grid gap-3">{roles.map((role) => <div key={role.id} className="rounded-2xl border border-slate-200/80 bg-white/30 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-bold">{role.label}</p><p className="mt-1 font-mono text-xs text-slate-400" dir="ltr">{role.name}</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{role.users_count} {isFa ? "کاربر" : "users"}</span></div><div className="mt-3 flex flex-wrap gap-1.5">{role.permissions.map((permission) => <span key={permission} className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600" dir="ltr">{permission}</span>)}</div></div>)}</div></section><section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><h3 className="font-black">{isFa ? "اختصاص سریع نقش" : "Quick role assignment"}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{isFa ? "کاربر و نقش را انتخاب کنید؛ عملیات قابل بازگشت است." : "Choose a user and role; assignments are reversible."}</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={userId ?? ""} onChange={(event) => setUserId(event.target.value ? parseNumericInput(event.target.value) : null)} className="rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-3 py-3 text-sm"><option value="">{isFa ? "انتخاب کاربر" : "Choose user"}</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select><select value={roleId ?? ""} onChange={(event) => setRoleId(event.target.value ? parseNumericInput(event.target.value) : null)} className="rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-3 py-3 text-sm"><option value="">{isFa ? "انتخاب نقش" : "Choose role"}</option>{roles.filter((role) => role.is_active).map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></div><div className="mt-4 flex flex-wrap gap-2"><button disabled={working || !userId || !roleId} onClick={() => void changeRole("assign")} className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{isFa ? "اختصاص نقش" : "Assign role"}</button><button disabled={working || !userId || !roleId} onClick={() => void changeRole("revoke")} className="rounded-xl border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 disabled:opacity-50">{isFa ? "لغو نقش" : "Revoke role"}</button></div>{selectedUser && <div className="mt-6 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{isFa ? "نقش‌های فعلی" : "Current roles"}</p><div className="mt-3 flex flex-wrap gap-2">{selectedUser.roles?.length ? selectedUser.roles.map((role) => <span key={role.id} className="rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">{role.label || role.name}</span>) : <span className="text-sm text-slate-400">{isFa ? "نقشی ندارد" : "No assigned role"}</span>}</div></div>}</section></div>;
}

function AbandonedCartsView({ carts, locale, onRemind }: { carts: AdminAbandonedCart[]; locale: string; onRemind: (cart: AdminAbandonedCart) => Promise<void> }) {
  const isFa = locale === "fa";
  return <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{isFa ? "سبدهای خرید رهاشده" : "Abandoned carts"}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{isFa ? "سبدهای بدون فعالیت بیشتر از دو ساعت را پیگیری و ایمیل بازیابی ارسال کنید." : "Follow up on carts inactive for more than two hours and queue a recovery email."}</p></div><AlertTriangle className="text-orange-500" size={21} /></div><div className="mt-6 grid gap-3">{carts.length ? carts.map((cart) => <div key={cart.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50/50 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><ShoppingBag size={18} /></span><div className="min-w-0 flex-1"><p className="font-bold">{cart.customer_name || cart.customer_phone || (isFa ? "مشتری مهمان" : "Guest customer")}</p><p className="mt-1 text-xs text-slate-500">{cart.customer_email || (isFa ? "بدون ایمیل" : "No email")} · {cart.items_count} {isFa ? "عدد" : "items"} · {formatToman(cart.total_toman, locale)}</p><p className="mt-1 text-[11px] text-slate-400">{cart.last_activity_at ? new Date(cart.last_activity_at).toLocaleString(getLocaleConfig(locale).numberLocale) : "—"}</p></div><button type="button" disabled={!cart.can_recover} onClick={() => void onRemind(cart)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{cart.recovery_reminded_at ? (isFa ? "ارسال مجدد" : "Send again") : (isFa ? "ارسال بازیابی" : "Queue recovery")}</button></div>) : <p className="py-14 text-center text-sm text-slate-500">{isFa ? "سبد رهاشده‌ای پیدا نشد." : "No abandoned carts found."}</p>}</div></section>;
}

function ActivityView({ logs, locale }: { logs: AdminAuditLog[]; locale: string }) {
  const isFa = locale === "fa";
  return <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{isFa ? "گزارش فعالیت مدیران" : "Admin activity log"}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{isFa ? "تغییرات حساس و عملیات مدیریتی برای پیگیری ثبت می‌شوند." : "Sensitive changes and administrative actions are recorded for traceability."}</p></div><Activity className="text-violet-600" size={21} /></div><div className="mt-6 grid gap-3">{logs.length ? logs.map((log) => <div key={log.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Activity size={16} /></span><div className="min-w-0 flex-1"><p className="font-bold text-slate-800">{log.action}</p><p className="mt-1 text-xs text-slate-500">{log.auditable_type || "—"}{log.auditable_id ? ` #${log.auditable_id}` : ""} · {log.actor?.name || log.actor?.phone || (isFa ? "مدیر سیستم" : "Administrator")}</p></div><time className="text-xs text-slate-400">{log.created_at ? new Date(log.created_at).toLocaleString(getLocaleConfig(locale).numberLocale) : "—"}</time></div>) : <p className="py-14 text-center text-sm text-slate-500">{isFa ? "هنوز فعالیتی ثبت نشده است." : "No activity recorded yet."}</p>}</div></section>;
}

function DashboardCharts({ dashboard, locale }: { dashboard: AdminDashboard; locale: string }) {
  const isFa = locale === "fa";
  const maxRevenue = Math.max(...dashboard.sales.map((item) => item.revenue_toman), 1);
  const maxSold = Math.max(...dashboard.top_selling.map((item) => item.sold_quantity), 1);
  const statusCounts = dashboard.recent_orders.reduce<Record<string, number>>((accumulator, order) => ({ ...accumulator, [order.status]: (accumulator[order.status] ?? 0) + 1 }), {});
  const statusEntries = Object.entries(statusCounts);
  const statusTotal = Math.max(statusEntries.reduce((sum, [, count]) => sum + count, 0), 1);
  let cursor = 0;
  const donut = statusEntries.map(([, count], index) => { const start = cursor; cursor += (count / statusTotal) * 360; return `${["#7c5ce6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e"][index % 5]} ${start}deg ${cursor}deg`; }).join(", ");
  return <div className="grid gap-6 xl:grid-cols-[1.35fr_.8fr_.95fr]">
    <section className="rounded-3xl border border-[#e9e6f4] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "روند درآمد" : "Revenue curve"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "مقایسه عملکرد روزانه" : "Daily performance comparison"}</p></div><ArrowUpRight className="text-emerald-500" size={19} /></div><div className="mt-6 h-48"><svg viewBox="0 0 700 190" className="h-full w-full" preserveAspectRatio="none" role="img" aria-label={isFa ? "نمودار درآمد" : "Revenue chart"}><defs><linearGradient id="revenue-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity=".35" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient></defs><path d={dashboard.sales.map((day, index) => `${index === 0 ? "M" : "L"} ${index * 115 + 10} ${165 - (day.revenue_toman / maxRevenue) * 135}`).join(" ") + ` L ${(dashboard.sales.length - 1) * 115 + 10} 175 L 10 175 Z`} fill="url(#revenue-area)" /><path d={dashboard.sales.map((day, index) => `${index === 0 ? "M" : "L"} ${index * 115 + 10} ${165 - (day.revenue_toman / maxRevenue) * 135}`).join(" ")} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></div><div className="mt-2 grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400">{dashboard.sales.map((item) => <span key={item.date}>{item.label}</span>)}</div></section>
    <section className="rounded-3xl border border-[#e9e6f4] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "ترکیب وضعیت سفارش" : "Order status mix"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "آخرین سفارش‌های ثبت‌شده" : "Recent recorded orders"}</p></div><ShoppingBag className="text-sky-500" size={19} /></div><div className="mt-6 flex items-center justify-center"><div className="relative flex h-36 w-36 items-center justify-center rounded-full" style={{ background: donut ? `conic-gradient(${donut})` : "#e2e8f0" }}><div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center text-xs font-black text-slate-700">{dashboard.recent_orders.length}<br />{isFa ? "سفارش" : "orders"}</div></div></div><div className="mt-5 grid gap-2">{statusEntries.slice(0, 5).map(([status, count], index) => <div key={status} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-bold text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ["#7c5ce6", "#0ea5e9", "#10b981", "#f59e0b", "#f43f5e"][index % 5] }} />{statusLabel(status, locale)}</span><span className="font-black">{count}</span></div>)}</div></section>
    <section className="rounded-3xl border border-[#e9e6f4] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "نوار پرفروش‌ها" : "Top products"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "مقایسه تعداد فروش" : "Units sold comparison"}</p></div><Package className="text-violet-500" size={19} /></div><div className="mt-6 grid gap-4">{dashboard.top_selling.slice(0, 5).map((item) => <div key={item.id}><div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="max-w-[75%] truncate font-bold">{isFa ? item.name_fa : item.name_en}</span><span className="font-black text-violet-600">{item.sold_quantity}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${Math.max(5, (item.sold_quantity / maxSold) * 100)}%` }} /></div></div>)}</div></section>
  </div>;
}

function DashboardView({ dashboard, locale }: { dashboard: AdminDashboard; locale: string }) {
  const isFa = locale === "fa";
  const stats = [
    { label: isFa ? "درآمد کل" : "Revenue", value: formatToman(dashboard.metrics.revenue_toman, locale), icon: ArrowUpRight, tone: "bg-emerald-50 text-emerald-600" },
    { label: isFa ? "سفارش‌ها" : "Orders", value: dashboard.metrics.orders.toLocaleString(getLocaleConfig(locale).numberLocale), icon: ShoppingBag, tone: "bg-sky-50 text-sky-600" },
    { label: isFa ? "مشتری‌ها" : "Customers", value: dashboard.metrics.customers.toLocaleString(getLocaleConfig(locale).numberLocale), icon: Users, tone: "bg-violet-50 text-violet-600" },
    { label: isFa ? "محصولات فعال" : "Published products", value: dashboard.metrics.published_products.toLocaleString(getLocaleConfig(locale).numberLocale), icon: Package, tone: "bg-amber-50 text-amber-600" },
    { label: isFa ? "نظرات در انتظار" : "Pending reviews", value: dashboard.metrics.pending_reviews.toLocaleString(getLocaleConfig(locale).numberLocale), icon: Star, tone: "bg-rose-50 text-rose-600" },
    { label: isFa ? "سبدهای رهاشده" : "Abandoned carts", value: dashboard.metrics.abandoned_carts.toLocaleString(getLocaleConfig(locale).numberLocale), icon: ShoppingBag, tone: "bg-orange-50 text-orange-600" },
  ];
  return <>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm"><div className="flex items-start justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon size={20} /></span><span className="text-xs font-bold text-emerald-600">{isFa ? "زنده" : "Live"}</span></div><p className="mt-6 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p></div>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "فروش هفت روز اخیر" : "Last 7 days"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "بر اساس سفارش‌های ثبت‌شده" : "Based on recorded orders"}</p></div><span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{isFa ? "تومان" : "Toman"}</span></div><div className="mt-8 grid h-52 grid-cols-7 items-end gap-2">{dashboard.sales.map((day) => { const max = Math.max(...dashboard.sales.map((item) => item.revenue_toman), 1); const height = Math.max(8, Math.round((day.revenue_toman / max) * 100)); return <div key={day.date} className="flex h-full flex-col items-center justify-end gap-2"><div title={formatToman(day.revenue_toman, locale)} className="w-full rounded-t-xl bg-gradient-to-t from-sky-600 to-cyan-300 transition hover:from-sky-500" style={{ height: `${height}%` }} /><span className="text-[10px] text-slate-400">{day.label}</span></div>; })}</div></section>
      <div className="grid gap-6"><section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><h3 className="font-black">{isFa ? "موجودی کم" : "Low stock"}</h3><AlertTriangle className="text-amber-500" size={19} /></div><div className="mt-5 grid gap-3">{dashboard.low_stock.length ? dashboard.low_stock.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-amber-50/70 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold">{item.product}</p><p className="mt-1 text-xs text-slate-500">{item.sku}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700">{item.stock}</span></div>) : <p className="py-8 text-center text-sm text-slate-500">{isFa ? "همه‌چیز مرتب است." : "Inventory looks healthy."}</p>}</div></section><section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><h3 className="font-black">{isFa ? "پرفروش‌ترین‌ها" : "Top selling"}</h3><div className="mt-5 grid gap-3">{dashboard.top_selling.length ? dashboard.top_selling.map((item, index) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-xs font-black text-sky-700">{index + 1}</span><p className="truncate text-sm font-bold">{isFa ? item.name_fa : item.name_en}</p></div><span className="text-xs font-black text-slate-500">{item.sold_quantity} {isFa ? "فروش" : "sold"}</span></div>) : <p className="py-8 text-center text-sm text-slate-500">{isFa ? "هنوز فروشی ثبت نشده." : "No sales yet."}</p>}</div></section></div>
    </div>
    <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "روند تعداد سفارش‌ها" : "Order volume trend"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "مقایسه روزانه برای تصمیم سریع‌تر" : "Daily comparison for faster decisions"}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{isFa ? "۷ روز" : "7 days"}</span></div><div className="mt-6 h-44 w-full"><svg viewBox="0 0 700 180" className="h-full w-full" role="img" aria-label={isFa ? "روند سفارش‌ها" : "Order volume trend"} preserveAspectRatio="none"><defs><linearGradient id="orders-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity=".35" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs><path d={(() => { const max = Math.max(...dashboard.sales.map((item) => item.orders), 1); return dashboard.sales.map((item, index) => `${index === 0 ? "M" : "L"} ${index * 116 + 10} ${160 - (item.orders / max) * 135}`).join(" ") + ` L ${dashboard.sales.length * 116 - 106} 160 L 10 160 Z`; })()} fill="url(#orders-fill)" /><path d={(() => { const max = Math.max(...dashboard.sales.map((item) => item.orders), 1); return dashboard.sales.map((item, index) => `${index === 0 ? "M" : "L"} ${index * 116 + 10} ${160 - (item.orders / max) * 135}`).join(" "); })()} fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg></div><div className="mt-2 grid grid-cols-7 gap-2 text-center text-[10px] text-slate-400">{dashboard.sales.map((item) => <span key={item.date}>{item.label}</span>)}</div></section>
    <DashboardCharts dashboard={dashboard} locale={locale} />
    <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><h3 className="font-black">{isFa ? "آخرین سفارش‌ها" : "Recent orders"}</h3><OrdersTable orders={dashboard.recent_orders} locale={locale} compact /></section>
  </>;
}

function ProductsView({ products, total, locale, onNew, onImport, onEdit, onDelete }: { products: AdminProduct[]; total: number; locale: string; onNew: () => void; onImport: () => void; onEdit: (product: AdminProduct) => void; onDelete: (product: AdminProduct) => void }) {
  const isFa = locale === "fa";
  return <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><h3 className="font-black">{isFa ? "کاتالوگ محصولات" : "Product catalog"}</h3><p className="mt-1 text-xs text-slate-500">{total.toLocaleString(getLocaleConfig(locale).numberLocale)} {isFa ? "محصول در API" : "products in API"}</p></div><div className="flex flex-wrap gap-2"><button onClick={onImport} className="inline-flex items-center gap-2 rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-4 py-2.5 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700"><Upload size={16} />{isFa ? "ورود سریع CSV" : "Quick CSV import"}</button><button onClick={onNew} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700"><Plus size={17} />{isFa ? "محصول جدید" : "New product"}</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-start text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-4 text-start">{isFa ? "محصول" : "Product"}</th><th className="px-6 py-4 text-start">SKU</th><th className="px-6 py-4 text-start">{isFa ? "قیمت" : "Price"}</th><th className="px-6 py-4 text-start">{isFa ? "موجودی" : "Stock"}</th><th className="px-6 py-4 text-start">{isFa ? "وضعیت" : "Status"}</th><th className="px-6 py-4 text-end">{isFa ? "عملیات" : "Actions"}</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.id} className="hover:bg-slate-50/70"><td className="px-6 py-4"><p className="font-bold">{isFa ? product.name_fa : product.name_en}</p><p className="mt-1 text-xs text-slate-400">{product.category || "—"}</p></td><td className="px-6 py-4 font-mono text-xs text-slate-500">{product.sku}</td><td className="px-6 py-4 font-bold">{formatAdminPrice(product.price_toman, product.price_usd, locale)}</td><td className="px-6 py-4"><span className={product.low_stock ? "font-bold text-amber-600" : "font-bold text-slate-700"}>{product.stock}</span></td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(product.status, locale)}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-1"><button onClick={() => onEdit(product)} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Pencil size={16} /></button><button onClick={() => onDelete(product)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div></section>;
}

function OrdersView({ orders, total, locale, status, dateFrom, dateTo, onFilter, onStatus, onDetails }: { orders: AdminOrder[]; total: number; locale: string; status: string; dateFrom: string; dateTo: string; onFilter: (filter: { status: string; dateFrom: string; dateTo: string }) => void; onStatus: (order: AdminOrder, status: string) => void; onDetails: (order: AdminOrder) => void }) {
  const isFa = locale === "fa";
  return <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{isFa ? "مدیریت سفارش‌ها" : "Order management"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "با وضعیت و بازه زمانی دقیق‌تر تصمیم بگیرید." : "Narrow the queue by status and date range."}</p></div><span className="text-xs text-slate-500">{total.toLocaleString(getLocaleConfig(locale).numberLocale)} {isFa ? "رکورد" : "records"}</span></div><div className="mb-5 grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-3"><select value={status} onChange={(event) => onFilter({ status: event.target.value, dateFrom, dateTo })} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm font-bold outline-none focus:border-violet-400"><option value="">{isFa ? "همه وضعیت‌ها" : "All statuses"}</option>{["pending", "paid", "processing", "shipped", "completed", "cancelled", "returned", "refunded"].map((item) => <option key={item} value={item}>{statusLabel(item, locale)}</option>)}</select><label className="flex items-center gap-2 rounded-xl border border-[#e9e6f4] bg-white px-3 py-1.5 text-xs text-slate-500"><span>{isFa ? "از" : "From"}</span><input type="date" value={dateFrom} onChange={(event) => onFilter({ status, dateFrom: event.target.value, dateTo })} className="min-w-0 flex-1 bg-transparent py-1 text-sm font-bold text-slate-700 outline-none" /></label><label className="flex items-center gap-2 rounded-xl border border-[#e9e6f4] bg-white px-3 py-1.5 text-xs text-slate-500"><span>{isFa ? "تا" : "To"}</span><input type="date" value={dateTo} onChange={(event) => onFilter({ status, dateFrom, dateTo: event.target.value })} className="min-w-0 flex-1 bg-transparent py-1 text-sm font-bold text-slate-700 outline-none" /></label></div><OrdersTable orders={orders} locale={locale} onStatus={onStatus} onDetails={onDetails} /></section>;
}
function OrdersTable({ orders, locale, compact = false, onStatus, onDetails }: { orders: AdminOrder[]; locale: string; compact?: boolean; onStatus?: (order: AdminOrder, status: string) => void; onDetails?: (order: AdminOrder) => void }) {
  const isFa = locale === "fa";
  return <div className="overflow-x-auto"><table className={`w-full ${compact ? "min-w-[680px]" : "min-w-[760px]"} text-start text-sm`}><thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="px-3 py-3 text-start">{isFa ? "شماره" : "Order"}</th><th className="px-3 py-3 text-start">{isFa ? "مشتری" : "Customer"}</th><th className="px-3 py-3 text-start">{isFa ? "مبلغ" : "Total"}</th><th className="px-3 py-3 text-start">{isFa ? "وضعیت" : "Status"}</th><th className="px-3 py-3 text-start">{isFa ? "تاریخ" : "Date"}</th><th className="px-3 py-3 text-end">{isFa ? "جزئیات" : "Details"}</th></tr></thead><tbody className="divide-y divide-slate-100">{orders.map((order) => <tr key={order.id}><td className="px-3 py-4 font-mono text-xs font-bold">{order.number}</td><td className="px-3 py-4"><p className="font-bold">{order.customer_name || "—"}</p><p className="text-xs text-slate-400">{order.customer_phone}</p></td><td className="px-3 py-4 font-bold">{formatToman(order.total_toman, locale)}</td><td className="px-3 py-4">{onStatus ? <select value={order.status} onChange={(event) => onStatus(order, event.target.value)} className="rounded-lg border border-[#e9e6f4] bg-white shadow-sm px-2 py-1.5 text-xs font-bold outline-none focus:border-sky-400">{["pending", "paid", "processing", "shipped", "completed", "cancelled", "returned", "refunded"].map((status) => <option key={status} value={status}>{statusLabel(status, locale)}</option>)}</select> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{statusLabel(order.status, locale)}</span>}</td><td className="px-3 py-4 text-xs text-slate-400">{order.created_at ? new Date(order.created_at).toLocaleDateString(getLocaleConfig(locale).numberLocale) : "—"}</td><td className="px-3 py-4 text-end">{onDetails && <button onClick={() => onDetails(order)} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600" title={isFa ? "مشاهده جزئیات" : "View details"}><Eye size={16} /></button>}</td></tr>)}</tbody></table>{!orders.length && <p className="py-12 text-center text-sm text-slate-500">{isFa ? "داده‌ای وجود ندارد." : "No records found."}</p>}</div>;
}

function ReviewsView({ reviews, total, locale, page, lastPage, onPage, onReload }: {
  reviews: AdminReview[];
  total: number;
  locale: string;
  page: number;
  lastPage: number;
  onPage: (page: number) => void;
  onReload: () => Promise<void>;
}) {
  const isFa = locale === "fa";
  const [statusFilter, setStatusFilter] = useState<"all" | AdminReview["status"]>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [working, setWorking] = useState(false);
  const filteredReviews = statusFilter === "all" ? reviews : reviews.filter((review) => review.status === statusFilter);
  const allVisibleSelected = filteredReviews.length > 0 && filteredReviews.every((review) => selectedIds.includes(review.id));

  const toggleAll = () => {
    setSelectedIds(allVisibleSelected ? [] : filteredReviews.map((review) => review.id));
  };

  const updateBulk = async (status: AdminReview["status"]) => {
    if (!selectedIds.length) return;
    setWorking(true);
    try {
      const result = await bulkUpdateAdminReviews(selectedIds, status);
      toast.success(result.message);
      setSelectedIds([]);
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "به‌روزرسانی گروهی نظرات ناموفق بود." : "Bulk review update failed."));
    } finally {
      setWorking(false);
    }
  };

  const setReviewStatus = async (review: AdminReview, status: AdminReview["status"]) => {
    try {
      const result = await updateAdminReview(review.id, status);
      toast.success(result.message);
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "تغییر وضعیت نظر ناموفق بود." : "Could not update review."));
    }
  };

  const removeReview = async (review: AdminReview) => {
    if (!window.confirm(isFa ? "این نظر حذف شود؟" : "Delete this review?")) return;
    try {
      const result = await deleteAdminReview(review.id);
      toast.success(result.message);
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "حذف نظر ناموفق بود." : "Could not delete review."));
    }
  };

  return <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h3 className="font-black">{isFa ? "مرکز کنترل نظرات" : "Review command center"}</h3><p className="mt-1 text-xs text-slate-500">{total.toLocaleString(getLocaleConfig(locale).numberLocale)} {isFa ? "نظر؛ تایید گروهی بدون ورود به تک‌تک رکوردها" : "reviews; bulk moderation without opening each record"}</p></div>
      <div className="flex items-center gap-2"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-3 py-2 text-xs font-bold"><option value="all">{isFa ? "همه وضعیت‌ها" : "All statuses"}</option><option value="pending">{isFa ? "در انتظار" : "Pending"}</option><option value="approved">{isFa ? "تاییدشده" : "Approved"}</option><option value="rejected">{isFa ? "ردشده" : "Rejected"}</option><option value="hidden">{isFa ? "مخفی" : "Hidden"}</option></select><Star className="text-amber-500" size={20} /></div>
    </div>
    {selectedIds.length > 0 && <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-3"><span className="me-2 text-xs font-black">{selectedIds.length} {isFa ? "انتخاب‌شده" : "selected"}</span><button disabled={working} onClick={() => void updateBulk("approved")} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isFa ? "تایید همه" : "Approve all"}</button><button disabled={working} onClick={() => void updateBulk("rejected")} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isFa ? "رد همه" : "Reject all"}</button><button disabled={working} onClick={() => void updateBulk("hidden")} className="rounded-xl bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{isFa ? "مخفی‌سازی" : "Hide"}</button><button onClick={() => setSelectedIds([])} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500">{isFa ? "لغو انتخاب" : "Clear"}</button></div>}
    <div className="mt-5 grid gap-3">
      <button onClick={toggleAll} className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-start text-xs font-bold text-slate-600 hover:border-sky-300 hover:text-sky-700"><CheckSquare size={16} />{allVisibleSelected ? (isFa ? "لغو انتخاب این صفحه" : "Clear page selection") : (isFa ? "انتخاب همه این صفحه" : "Select all on page")}</button>
      {filteredReviews.length ? filteredReviews.map((review) => <article key={review.id} className={`rounded-2xl border p-4 transition ${selectedIds.includes(review.id) ? "border-sky-300 bg-sky-50/40" : "border-slate-200/70 bg-white/60 backdrop-blur-xl"}`}><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div className="flex min-w-0 gap-3"><input aria-label={isFa ? "انتخاب نظر" : "Select review"} type="checkbox" checked={selectedIds.includes(review.id)} onChange={() => setSelectedIds((current) => current.includes(review.id) ? current.filter((id) => id !== review.id) : [...current, review.id])} className="mt-1 h-4 w-4 accent-sky-600" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{review.title || (isFa ? "بدون عنوان" : "Untitled")}</p><span className="text-amber-500">{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{review.status}</span></div><p className="mt-2 text-sm leading-7 text-slate-600">{review.body || "—"}</p><p className="mt-2 text-xs text-slate-400">{review.author || "—"} · {review.product || "—"}</p></div></div><div className="flex shrink-0 flex-wrap items-center gap-2"><select value={review.status} onChange={(event) => void setReviewStatus(review, event.target.value as AdminReview["status"])} className="rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-3 py-2 text-xs font-bold"><option value="pending">{isFa ? "در انتظار" : "Pending"}</option><option value="approved">{isFa ? "تاییدشده" : "Approved"}</option><option value="rejected">{isFa ? "ردشده" : "Rejected"}</option><option value="hidden">{isFa ? "مخفی" : "Hidden"}</option></select><button onClick={() => void removeReview(review)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></div></div></article>) : <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">{isFa ? "نظری برای بررسی وجود ندارد." : "No reviews found."}</p>}
    </div>
    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{isFa ? `صفحه ${page} از ${lastPage}` : `Page ${page} of ${lastPage}`}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16} /></button><button disabled={page >= lastPage} onClick={() => onPage(page + 1)} className="rounded-xl border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16} /></button></div></div>
  </section>;
}

function OrderDetailModal({ order, locale, onClose }: { order: AdminOrder; locale: string; onClose: () => void }) {
  const isFa = locale === "fa";
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white/60 backdrop-blur-xl p-5 shadow-2xl sm:p-7" dir={getLocaleConfig(locale).direction}><div className="flex items-center justify-between"><div><p className="font-mono text-xs text-sky-600">{order.number}</p><h2 className="mt-2 text-2xl font-black">{isFa ? "جزئیات سفارش" : "Order details"}</h2><p className="mt-1 text-sm text-slate-500">{order.customer_name} · {order.customer_phone}</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><div className="mt-6 grid gap-3">{order.items?.length ? order.items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="font-bold">{isFa ? item.name_fa : item.name_en}</p><p className="mt-1 font-mono text-xs text-slate-400">{item.sku} · {isFa ? "تعداد" : "Qty"}: {item.quantity}</p></div><p className="font-bold">{formatToman(item.total_toman, locale)}</p></div>) : <p className="py-8 text-center text-sm text-slate-500">{isFa ? "آیتمی ثبت نشده." : "No items recorded."}</p>}</div><div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><span className="font-bold">{isFa ? "جمع کل" : "Total"}</span><span className="text-xl font-black">{formatToman(order.total_toman, locale)}</span></div></div></div>;
}

function CustomersView({ customers, total, locale }: { customers: AdminCustomer[]; total: number; locale: string }) {
  const isFa = locale === "fa";
  return <section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-center justify-between"><h3 className="font-black">{isFa ? "مشتری‌ها" : "Customers"}</h3><span className="text-xs text-slate-500">{total.toLocaleString(getLocaleConfig(locale).numberLocale)} {isFa ? "رکورد" : "records"}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="border-b border-slate-100 text-xs text-slate-500"><tr><th className="px-3 py-3 text-start">{isFa ? "مشتری" : "Customer"}</th><th className="px-3 py-3 text-start">{isFa ? "تماس" : "Contact"}</th><th className="px-3 py-3 text-start">{isFa ? "سفارش‌ها" : "Orders"}</th><th className="px-3 py-3 text-start">{isFa ? "عضویت" : "Joined"}</th></tr></thead><tbody className="divide-y divide-slate-100">{customers.map((customer) => <tr key={customer.id}><td className="px-3 py-4 font-bold">{customer.name}</td><td className="px-3 py-4"><p>{customer.phone}</p><p className="text-xs text-slate-400">{customer.email || "—"}</p></td><td className="px-3 py-4 font-bold">{customer.orders_count}</td><td className="px-3 py-4 text-xs text-slate-400">{customer.created_at ? new Date(customer.created_at).toLocaleDateString(getLocaleConfig(locale).numberLocale) : "—"}</td></tr>)}</tbody></table>{!customers.length && <p className="py-12 text-center text-sm text-slate-500">{isFa ? "مشتری‌ای پیدا نشد." : "No customers found."}</p>}</div></section>;
}

function MarketingView({ campaigns, discounts, banners, locale, onReload }: { campaigns: AdminCampaign[]; discounts: AdminDiscount[]; banners: AdminBanner[]; locale: string; onReload: () => Promise<void> }) {
  const isFa = locale === "fa";
  const [campaignForm, setCampaignForm] = useState<CampaignPayload>({ slug: randomSlug("campaign"), name_fa: "", name_en: "", discount_percent: 10, accent_color: "#0ea5e9", starts_at: localDateTimeFromNow(0), ends_at: localDateTimeFromNow(7), is_active: true });
  const [discountForm, setDiscountForm] = useState<DiscountPayload>({ code: "", discount_type: "percentage", value_toman: 0, value_usd: 0, percentage: 10, minimum_subtotal_toman: 0, maximum_discount_toman: null, maximum_discount_usd: null, usage_limit: null, starts_at: null, ends_at: null, is_active: true });
  const [saving, setSaving] = useState(false);
  const [campaignAttempted, setCampaignAttempted] = useState(false);
  const [discountAttempted, setDiscountAttempted] = useState(false);
  const campaignError = !campaignForm.name_fa.trim() || !campaignForm.name_en.trim()
    ? (isFa ? "نام فارسی و انگلیسی کمپین الزامی است." : "Persian and English campaign names are required.")
    : !campaignForm.slug.trim()
      ? (isFa ? "اسلاگ کمپین را وارد کنید." : "Campaign slug is required.")
      : campaignForm.discount_percent < 0 || campaignForm.discount_percent > 100
        ? (isFa ? "درصد تخفیف باید بین صفر و صد باشد." : "Discount must be between 0 and 100.")
        : campaignForm.ends_at <= campaignForm.starts_at
          ? (isFa ? "پایان کمپین باید بعد از شروع آن باشد." : "Campaign end must be after its start.")
          : "";
  const discountValue = (discountForm.discount_type === "percentage" ? discountForm.percentage : discountForm.discount_type === "fixed_toman" ? discountForm.value_toman : discountForm.value_usd) ?? 0;
  const discountError = !/^[A-Z0-9_-]{3,40}$/.test(discountForm.code)
    ? (isFa ? "کد تخفیف باید ۳ تا ۴۰ کاراکتر انگلیسی، عدد، خط تیره یا زیرخط باشد." : "Code must be 3–40 letters, numbers, hyphens or underscores.")
    : discountValue <= 0
      ? (isFa ? "مقدار تخفیف باید بیشتر از صفر باشد." : "Discount value must be greater than zero.")
      : discountForm.discount_type === "percentage" && discountValue > 100
        ? (isFa ? "درصد تخفیف نمی‌تواند بیشتر از صد باشد." : "Percentage cannot exceed 100.")
        : discountForm.usage_limit != null && discountForm.usage_limit < 1
          ? (isFa ? "سقف مصرف باید حداقل یک باشد." : "Usage limit must be at least one.")
          : "";
  const submitCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    setCampaignAttempted(true);
    if (campaignError) { toast.error(campaignError); return; }
    setSaving(true);
    try {
      const payload = { ...campaignForm, starts_at: toIsoDateTime(campaignForm.starts_at), ends_at: toIsoDateTime(campaignForm.ends_at) };
      const result = await createAdminCampaign(payload);
      toast.success(result.message);
      setCampaignForm((form) => ({ ...form, slug: randomSlug("campaign"), name_fa: "", name_en: "", starts_at: localDateTimeFromNow(0), ends_at: localDateTimeFromNow(7) }));
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "ذخیره کمپین ناموفق بود." : "Could not save campaign."));
    } finally {
      setSaving(false);
    }
  };
  const submitDiscount = async (event: React.FormEvent) => {
    event.preventDefault();
    setDiscountAttempted(true);
    if (discountError) { toast.error(discountError); return; }
    setSaving(true);
    try {
      const payload = { ...discountForm, starts_at: discountForm.starts_at ? toIsoDateTime(discountForm.starts_at) : null, ends_at: discountForm.ends_at ? toIsoDateTime(discountForm.ends_at) : null };
      const result = await createAdminDiscount(payload);
      toast.success(result.message);
      setDiscountForm((form) => ({ ...form, code: "", starts_at: null, ends_at: null }));
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "ذخیره کد تخفیف ناموفق بود." : "Could not save discount."));
    } finally {
      setSaving(false);
    }
  };
  const removeCampaign = async (campaign: AdminCampaign) => { if (!window.confirm(isFa ? `کمپین «${campaign.name_fa}» حذف شود؟` : `Delete ${campaign.name_en}?`)) return; try { const result = await deleteAdminCampaign(campaign.id); toast.success(result.message); await onReload(); } catch (error) { toast.error(getApiErrorMessage(error, "Delete failed.")); } };
  const removeDiscount = async (discount: AdminDiscount) => { if (!window.confirm(isFa ? `کد «${discount.code}» حذف شود؟` : `Delete ${discount.code}?`)) return; try { const result = await deleteAdminDiscount(discount.id); toast.success(result.message); await onReload(); } catch (error) { toast.error(getApiErrorMessage(error, "Delete failed.")); } };
  return <div className="grid gap-6 xl:grid-cols-2"><section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "کمپین‌ها" : "Campaigns"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "بازه و درصد تخفیف را کنترل کنید." : "Control date windows and discounts."}</p></div><BadgePercent className="text-sky-500" size={20} /></div><HelpCard title={isFa ? "این فرم چه کار می‌کند؟" : "What this form does"}>{isFa ? "کمپین یک بازه زمانی و درصد تخفیف دارد؛ محصولات کمپین بعداً از بخش مربوط به خودشان به آن متصل می‌شوند." : "A campaign defines a time window and discount; products can be attached to it separately."}</HelpCard>{campaignAttempted && campaignError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800" role="alert">{campaignError}</p>}<form onSubmit={submitCampaign} className="mt-5 grid gap-3 sm:grid-cols-2"><input required placeholder={isFa ? "نام فارسی" : "Persian name"} value={campaignForm.name_fa} onChange={(e) => setCampaignForm({ ...campaignForm, name_fa: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required placeholder="English name" value={campaignForm.name_en} onChange={(e) => setCampaignForm({ ...campaignForm, name_en: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><input required placeholder="slug" value={campaignForm.slug} onChange={(e) => setCampaignForm({ ...campaignForm, slug: slugify(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><input required type="text" inputMode="decimal" min="0" max="100" placeholder="%" value={campaignForm.discount_percent} onChange={(e) => setCampaignForm({ ...campaignForm, discount_percent: parseNumericInput(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><AdminDateTimeField label={isFa ? "شروع کمپین" : "Campaign starts"} value={campaignForm.starts_at} onChange={(value) => setCampaignForm({ ...campaignForm, starts_at: value || "" })} locale={locale} required hint={isFa ? "زمان با timezone مرورگر ثبت و هنگام ارسال به UTC تبدیل می‌شود." : "Browser-local time is converted to UTC before the API request."} /><AdminDateTimeField label={isFa ? "پایان کمپین" : "Campaign ends"} value={campaignForm.ends_at} min={campaignForm.starts_at} onChange={(value) => setCampaignForm({ ...campaignForm, ends_at: value || "" })} locale={locale} required hint={isFa ? "باید بعد از زمان شروع باشد؛ backend نیز این قانون را بررسی می‌کند." : "Must be after the start; backend validates this too."} /><button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white sm:col-span-2">{isFa ? "افزودن کمپین" : "Add campaign"}</button></form><div className="mt-6 grid gap-2">{campaigns.map((campaign) => <div key={campaign.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><p className="text-sm font-bold">{isFa ? campaign.name_fa : campaign.name_en}</p><p className="mt-1 text-xs text-slate-500">{campaign.discount_percent}% · {campaign.products_count} {isFa ? "محصول" : "products"} · {campaign.ordered_quantity ?? 0} {isFa ? "فروش" : "sold"} · {formatToman(campaign.revenue_toman ?? 0, locale)}</p><p className="mt-1 text-[11px] font-bold text-violet-600">{campaign.impressions ?? 0} {isFa ? "بازدید" : "views"} · {campaign.clicks ?? 0} {isFa ? "کلیک" : "clicks"}{(campaign.impressions ?? 0) > 0 ? ` · ${(((campaign.clicks ?? 0) / (campaign.impressions ?? 1)) * 100).toFixed(1)}% CTR` : ""}</p></div><button onClick={() => void removeCampaign(campaign)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></div>)}</div></section><section className="rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-black">{isFa ? "کدهای تخفیف" : "Discount codes"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "اعتبارسنجی و محدودیت مصرف سمت سرور است." : "Validation and usage limits are server-enforced."}</p></div><BadgePercent className="text-violet-500" size={20} /></div><HelpCard title={isFa ? "این فرم چه کار می‌کند؟" : "What this form does"}>{isFa ? "کد تخفیف سمت backend بررسی می‌شود؛ این فرم فقط محدودیت‌ها، بازه اعتبار و مقدار اولیه را ثبت می‌کند." : "The backend enforces the discount; this form records its limits, validity window and value."}</HelpCard>{discountAttempted && discountError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800" role="alert">{discountError}</p>}<form onSubmit={submitDiscount} className="mt-5 grid gap-3 sm:grid-cols-2"><input required placeholder="CODE" value={discountForm.code} onChange={(e) => setDiscountForm({ ...discountForm, code: normalizeSkuInput(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><select value={discountForm.discount_type} onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value as DiscountPayload["discount_type"] })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="percentage">{isFa ? "درصدی" : "Percentage"}</option><option value="fixed_toman">{isFa ? "مبلغ ثابت تومان" : "Fixed Toman"}</option><option value="fixed_usd">{isFa ? "مبلغ ثابت دلار" : "Fixed USD"}</option></select><input required type="text" inputMode="decimal" min="0" max={discountForm.discount_type === "percentage" ? 100 : undefined} placeholder={discountForm.discount_type === "percentage" ? "%" : isFa ? "مبلغ تخفیف" : "Discount value"} value={discountForm.discount_type === "percentage" ? (discountForm.percentage ?? 10) : (discountForm.discount_type === "fixed_toman" ? discountForm.value_toman : discountForm.value_usd)} onChange={(e) => setDiscountForm({ ...discountForm, percentage: discountForm.discount_type === "percentage" ? parseNumericInput(e.target.value) : discountForm.percentage, value_toman: discountForm.discount_type === "fixed_toman" ? parseNumericInput(e.target.value) : discountForm.value_toman, value_usd: discountForm.discount_type === "fixed_usd" ? parseNumericInput(e.target.value) : discountForm.value_usd })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><input type="text" inputMode="decimal" min="1" placeholder={isFa ? "حداقل خرید تومان" : "Minimum Toman subtotal"} value={discountForm.minimum_subtotal_toman} onChange={(e) => setDiscountForm({ ...discountForm, minimum_subtotal_toman: parseNumericInput(e.target.value) })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><input type="text" inputMode="decimal" min="1" placeholder={isFa ? "سقف مصرف" : "Usage limit"} value={discountForm.usage_limit ?? ""} onChange={(e) => setDiscountForm({ ...discountForm, usage_limit: e.target.value ? parseNumericInput(e.target.value) : null })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><input type="text" inputMode="decimal" min="0" placeholder={isFa ? "سقف تخفیف تومان" : "Max discount Toman"} value={discountForm.maximum_discount_toman ?? ""} onChange={(e) => setDiscountForm({ ...discountForm, maximum_discount_toman: e.target.value ? parseNumericInput(e.target.value) : null })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" dir="ltr" /><AdminDateTimeField label={isFa ? "شروع اعتبار" : "Valid from"} value={discountForm.starts_at} onChange={(value) => setDiscountForm({ ...discountForm, starts_at: value })} locale={locale} hint={isFa ? "اگر خالی باشد، کد از همین حالا معتبر است." : "Leave empty to make the code valid immediately."} /><AdminDateTimeField label={isFa ? "پایان اعتبار" : "Valid until"} value={discountForm.ends_at} min={discountForm.starts_at ?? undefined} onChange={(value) => setDiscountForm({ ...discountForm, ends_at: value })} locale={locale} hint={isFa ? "اگر خالی باشد، کد تاریخ انقضا ندارد." : "Leave empty for no expiry."} /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={discountForm.is_active} onChange={(e) => setDiscountForm({ ...discountForm, is_active: e.target.checked })} />{isFa ? "فعال" : "Active"}</label><button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white sm:col-span-2">{isFa ? "افزودن کد تخفیف" : "Add discount code"}</button></form><div className="mt-6 grid gap-2">{discounts.map((discount) => <div key={discount.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><p className="font-mono text-sm font-bold">{discount.code}</p><p className="mt-1 text-xs text-slate-500">{discount.percentage ?? discount.value_toman}% · {discount.used_count}{discount.usage_limit ? ` / ${discount.usage_limit}` : ""}</p></div><button onClick={() => void removeDiscount(discount)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button></div>)}</div></section><BannerManager banners={banners} locale={locale} onReload={onReload} /><LandingBuilder campaigns={campaigns} locale={locale} /></div>;
}

function BannerManager({ banners, locale, onReload }: { banners: AdminBanner[]; locale: string; onReload: () => Promise<void> }) {
  const isFa = locale === "fa";
  const emptyBanner: BannerPayload = { placement: "home.after-hero", title_fa: "", title_en: "", subtitle_fa: "", subtitle_en: "", image: "", mobile_image: "", href: "/shop", cta_fa: "مشاهده مجموعه", cta_en: "Explore collection", accent_color: "#e65d2f", text_color: "#ffffff", sort_order: 0, starts_at: null, ends_at: null, is_active: true, metadata: {} };
  const [form, setForm] = useState<BannerPayload>(emptyBanner);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [bannerAttempted, setBannerAttempted] = useState(false);
  const bannerError = !String(form.placement ?? "").trim()
    ? (isFa ? "placement بنر الزامی است." : "Banner placement is required.")
    : form.sort_order < 0
      ? (isFa ? "ترتیب نمایش نمی‌تواند منفی باشد." : "Sort order cannot be negative.")
      : form.ends_at && form.starts_at && form.ends_at <= form.starts_at
        ? (isFa ? "پایان نمایش باید بعد از شروع آن باشد." : "Visible until must be after visible from.")
        : "";
  const setField = (key: keyof BannerPayload, value: string | number | boolean | null) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBannerAttempted(true);
    if (bannerError) { toast.error(bannerError); return; }
    setSaving(true);
    try {
      const payload = { ...form, starts_at: form.starts_at ? toIsoDateTime(form.starts_at) : null, ends_at: form.ends_at ? toIsoDateTime(form.ends_at) : null };
      const result = editingId ? await updateAdminBanner(editingId, payload) : await createAdminBanner(payload);
      toast.success(result.message);
      setEditingId(null);
      setForm({ ...emptyBanner });
      await onReload();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "ذخیره بنر ناموفق بود." : "Could not save banner."));
    } finally {
      setSaving(false);
    }
  };
  const edit = (banner: AdminBanner) => { setEditingId(banner.id); setForm({ ...emptyBanner, ...banner }); };
  const remove = async (banner: AdminBanner) => {
    if (!window.confirm(isFa ? `بنر «${banner.title_fa || banner.placement}» حذف شود؟` : `Delete ${banner.title_en || banner.placement}?`)) return;
    try { const result = await deleteAdminBanner(banner.id); toast.success(result.message); await onReload(); } catch (error) { toast.error(getApiErrorMessage(error, isFa ? "حذف بنر ناموفق بود." : "Could not delete banner.")); }
  };
  return <section className="rounded-3xl border border-[#e9e6f4] bg-white p-5 shadow-sm backdrop-blur-xl sm:p-6 xl:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black">{isFa ? "مدیریت بنرهای سایت" : "Store banner manager"}</h3><p className="mt-1 text-xs leading-6 text-slate-500">{isFa ? "بنر را با placement در هر نقطه از سایت قرار دهید؛ مثل home.after-hero یا product.top." : "Place banners anywhere with a placement key such as home.after-hero or product.top."}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{banners.length} {isFa ? "بنر" : "banners"}</span></div>{bannerAttempted && bannerError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800" role="alert">{bannerError}</p>}<form onSubmit={submit} className="mt-5 grid gap-3 rounded-2xl border border-dashed border-slate-300 p-4 sm:grid-cols-2 lg:grid-cols-4"><input required value={form.placement || ""} onChange={(event) => setField("placement", event.target.value)} placeholder="placement: home.after-hero" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm sm:col-span-2 lg:col-span-2" dir="ltr" /><input value={form.href || ""} onChange={(event) => setField("href", event.target.value)} placeholder="/campaign/sale" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" dir="ltr" /><input type="text" inputMode="decimal" min="0" value={form.sort_order ?? 0} onChange={(event) => setField("sort_order", parseNumericInput(event.target.value))} placeholder="Order" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" dir="ltr" /><input value={form.title_fa || ""} onChange={(event) => setField("title_fa", event.target.value)} placeholder={isFa ? "عنوان فارسی" : "Persian title"} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><input value={form.title_en || ""} onChange={(event) => setField("title_en", event.target.value)} placeholder="English title" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><textarea value={form.subtitle_fa || ""} onChange={(event) => setField("subtitle_fa", event.target.value)} placeholder={isFa ? "زیرعنوان فارسی" : "Persian subtitle"} className="min-h-20 rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><textarea value={form.subtitle_en || ""} onChange={(event) => setField("subtitle_en", event.target.value)} placeholder="English subtitle" className="min-h-20 rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><input value={form.image || ""} onChange={(event) => setField("image", event.target.value)} placeholder="Desktop image URL" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm sm:col-span-2" dir="ltr" /><input value={form.mobile_image || ""} onChange={(event) => setField("mobile_image", event.target.value)} placeholder="Mobile image URL" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm sm:col-span-2" dir="ltr" /><input value={form.cta_fa || ""} onChange={(event) => setField("cta_fa", event.target.value)} placeholder={isFa ? "دکمه فارسی" : "Persian CTA"} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><input value={form.cta_en || ""} onChange={(event) => setField("cta_en", event.target.value)} placeholder="English CTA" className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><input type="color" value={form.accent_color || "#e65d2f"} onChange={(event) => setField("accent_color", event.target.value)} className="h-11 w-full rounded-xl border border-[#e9e6f4] bg-white p-1" title="Accent color" /><input type="color" value={form.text_color || "#ffffff"} onChange={(event) => setField("text_color", event.target.value)} className="h-11 w-full rounded-xl border border-[#e9e6f4] bg-white p-1" title="Text color" /><AdminDateTimeField label={isFa ? "شروع نمایش" : "Visible from"} value={form.starts_at} onChange={(value) => setField("starts_at", value)} locale={locale} hint={isFa ? "بنر قبل از این زمان نمایش داده نمی‌شود." : "The banner stays hidden before this time."} /><AdminDateTimeField label={isFa ? "پایان نمایش" : "Visible until"} value={form.ends_at} min={form.starts_at ?? undefined} onChange={(value) => setField("ends_at", value)} locale={locale} hint={isFa ? "بعد از این زمان بنر از placement خارج می‌شود." : "The banner leaves its placement after this time."} /><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => setField("is_active", event.target.checked)} />{isFa ? "فعال" : "Active"}</label><div className="flex gap-2 sm:col-span-2 lg:col-span-3"><button disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{editingId ? (isFa ? "به‌روزرسانی بنر" : "Update banner") : (isFa ? "ساخت بنر" : "Create banner")}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ ...emptyBanner }); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">{isFa ? "انصراف" : "Cancel"}</button>}</div></form><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{banners.map((banner) => <article key={banner.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/40"><div className="relative h-28" style={{ backgroundColor: banner.accent_color }}>{banner.image && <img src={banner.image} alt="" className="h-full w-full object-cover opacity-80" />}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-bold">{banner.title_fa || banner.title_en || "Untitled banner"}</p><p className="mt-1 font-mono text-[11px] text-slate-400" dir="ltr">{banner.placement}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${banner.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{banner.is_active ? "Live" : "Draft"}</span></div><div className="mt-3 flex justify-end gap-1"><button onClick={() => edit(banner)} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 hover:text-sky-600"><Pencil size={15} /></button><button onClick={() => void remove(banner)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button></div></div></article>)}</div></section>;
}

function LandingBuilder({ campaigns, locale }: { campaigns: AdminCampaign[]; locale: string }) {
  const isFa = locale === "fa";
  const [campaignId, setCampaignId] = useState<number | null>(campaigns[0]?.id ?? null);
  const [form, setForm] = useState<CampaignLandingPayload>({ slug: "", title_fa: "", title_en: "", description_fa: "", description_en: "", blocks: [{ type: "hero", title: "", body: "" }], is_published: false });
  const [saving, setSaving] = useState(false);
  const [landingAttempted, setLandingAttempted] = useState(false);
  const landingError = !campaignId
    ? (isFa ? "ابتدا یک کمپین را انتخاب کنید." : "Choose a campaign first.")
    : !form.slug.trim() || !slugify(form.slug)
      ? (isFa ? "اسلاگ صفحه معتبر نیست." : "Landing slug is required and must use safe characters.")
      : !form.title_fa.trim() || !form.title_en.trim()
        ? (isFa ? "عنوان فارسی و انگلیسی صفحه الزامی است." : "Persian and English page titles are required.")
        : "";

  const loadLanding = async (id: number) => {
    setCampaignId(id);
    try {
      const data = await getAdminCampaignLanding(id);
      setForm({ ...data, blocks: data.blocks ?? [] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "صفحه کمپین پیدا نشد." : "Landing page not found."));
    }
  };

  const updateBlock = (index: number, patch: Partial<CampaignLandingPayload["blocks"][number]>) => {
    setForm((current) => ({ ...current, blocks: current.blocks.map((block, blockIndex) => blockIndex === index ? { ...block, ...patch } : block) }));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.blocks.length) return current;
      const blocks = [...current.blocks];
      [blocks[index], blocks[nextIndex]] = [blocks[nextIndex], blocks[index]];
      return { ...current, blocks };
    });
  };

  const addBlock = (type: CampaignLandingPayload["blocks"][number]["type"]) => {
    setForm((current) => ({ ...current, blocks: [...current.blocks, { type, title: "", body: "", image: "", href: "", label: "" }] }));
  };

  const saveLanding = async (event: React.FormEvent) => {
    event.preventDefault();
    setLandingAttempted(true);
    if (landingError || !campaignId) { if (landingError) toast.error(landingError); return; }
    setSaving(true);
    try {
      const result = await updateAdminCampaignLanding(campaignId, form);
      toast.success(result.message);
    } catch (error) {
      toast.error(getApiErrorMessage(error, isFa ? "ذخیره صفحه کمپین ناموفق بود." : "Could not save campaign landing."));
    } finally {
      setSaving(false);
    }
  };

  return <section className="mt-6 rounded-3xl border border-[#e9e6f4] bg-white shadow-sm p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{isFa ? "سازنده بصری صفحه کمپین" : "Visual campaign landing builder"}</h3><p className="mt-1 text-xs text-slate-500">{isFa ? "بلوک‌ها را اضافه، حذف و با یک کلیک جابه‌جا کنید." : "Add, remove and reorder blocks with one click."}</p></div><select value={campaignId ?? ""} onChange={(event) => { const value = event.target.value; if (value) void loadLanding(parseNumericInput(value)); else setCampaignId(null); }} className="rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-3 py-2 text-sm"><option value="">{isFa ? "انتخاب کمپین" : "Choose campaign"}</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name_en}</option>)}</select></div>{landingAttempted && landingError && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold text-amber-800" role="alert">{landingError}</p>}<form onSubmit={saveLanding} className="mt-5 grid gap-3 sm:grid-cols-2"><input required placeholder={isFa ? "slug صفحه" : "Landing slug"} value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} className="rounded-xl border border-slate-200 bg-white/50 px-3 py-2.5 text-sm" dir="ltr" /><input required placeholder={isFa ? "عنوان فارسی" : "Persian title"} value={form.title_fa} onChange={(e) => setForm({ ...form, title_fa: e.target.value })} className="rounded-xl border border-slate-200 bg-white/50 px-3 py-2.5 text-sm" /><input required placeholder="English title" value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="rounded-xl border border-slate-200 bg-white/50 px-3 py-2.5 text-sm" /><div className="flex flex-wrap gap-2 sm:col-span-2"><span className="self-center text-xs font-bold text-slate-500">{isFa ? "افزودن بلوک:" : "Add block:"}</span>{(["hero", "text", "image", "products", "cta"] as const).map((type) => <button type="button" key={type} onClick={() => addBlock(type)} className="rounded-xl border border-[#e9e6f4] bg-white shadow-sm px-3 py-2 text-xs font-bold hover:border-sky-300 hover:text-sky-700">+ {type}</button>)}</div><div className="grid gap-3 sm:col-span-2">{form.blocks.map((block, index) => <div key={`${block.type}-${index}`} className="rounded-2xl border border-slate-200 bg-white/40 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-xs font-black text-sky-700">{index + 1}</span><select value={block.type} onChange={(event) => updateBlock(index, { type: event.target.value as CampaignLandingPayload["blocks"][number]["type"] })} className="rounded-lg border border-[#e9e6f4] bg-white px-2 py-1.5 text-xs font-bold"><option value="hero">hero</option><option value="text">text</option><option value="image">image</option><option value="products">products</option><option value="cta">cta</option></select></div><div className="flex gap-1"><button type="button" onClick={() => moveBlock(index, -1)} disabled={index === 0} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 disabled:opacity-30"><ArrowUp size={15} /></button><button type="button" onClick={() => moveBlock(index, 1)} disabled={index === form.blocks.length - 1} className="rounded-lg p-2 text-slate-400 hover:bg-sky-50 disabled:opacity-30"><ArrowDown size={15} /></button><button type="button" onClick={() => setForm((current) => ({ ...current, blocks: current.blocks.filter((_, blockIndex) => blockIndex !== index) }))} className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50">{isFa ? "حذف" : "Remove"}</button></div></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><input value={block.title ?? ""} onChange={(event) => updateBlock(index, { title: event.target.value })} placeholder={isFa ? "عنوان بلوک" : "Block title"} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><input value={block.label ?? ""} onChange={(event) => updateBlock(index, { label: event.target.value })} placeholder={isFa ? "متن دکمه" : "Button label"} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" /><textarea value={block.body ?? ""} onChange={(event) => updateBlock(index, { body: event.target.value })} placeholder={isFa ? "متن بلوک" : "Block body"} className="min-h-20 rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm sm:col-span-2" /><input value={block.image ?? ""} onChange={(event) => updateBlock(index, { image: event.target.value })} placeholder={isFa ? "آدرس تصویر" : "Image URL"} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" dir="ltr" /><input value={block.href ?? ""} onChange={(event) => updateBlock(index, { href: event.target.value })} placeholder={isFa ? "لینک مقصد" : "Target URL"} className="rounded-xl border border-[#e9e6f4] bg-white px-3 py-2.5 text-sm" dir="ltr" /></div></div>)}</div><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />{isFa ? "انتشار صفحه" : "Publish landing page"}</label><button disabled={saving || !campaignId} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{isFa ? "ذخیره صفحه کمپین" : "Save landing page"}</button></form></section>;
}

function parseDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      cells.push(cell.trim()); cell = "";
    } else cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

function BulkProductImportModal({ locale, saving, onClose, onImport }: { locale: string; saving: boolean; onClose: () => void; onImport: (rows: ProductPayload[]) => Promise<void> }) {
  const isFa = locale === "fa";
  const [text, setText] = useState("slug,sku,name_fa,name_en,gender,status,price_toman,price_usd,stock,low_stock_threshold\\nhoodie-black,HD-001,هودی مشکی,Black hoodie,unisex,published,2980000,98,12,3");
  const delimiter = text.split("\\n")[0]?.includes("\\t") ? "\\t" : ",";
  const lines = text.split(/\\r?\\n/).filter(Boolean);
  const headers = lines[0] ? parseDelimitedLine(lines[0], delimiter) : [];
  const rows = lines.slice(1).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    const raw = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return {
      ...emptyProduct,
      slug: slugify(raw.slug ?? ""),
      sku: normalizeSkuInput(raw.sku ?? "") || generateSkuFromName(raw.name_en ?? "Product"),
      variant_sku: raw.variant_sku || undefined,
      name_fa: raw.name_fa ?? "",
      name_en: raw.name_en ?? "",
      gender: (raw.gender === "men" || raw.gender === "women" ? raw.gender : "unisex") as ProductPayload["gender"],
      status: (raw.status === "published" || raw.status === "archived" ? raw.status : "draft") as ProductPayload["status"],
      price_toman: Number(raw.price_toman || 0),
      price_usd: Number(raw.price_usd || 0),
      stock: Number(raw.stock || 0),
      low_stock_threshold: Number(raw.low_stock_threshold || 3),
      category_id: raw.category_id ? Number(raw.category_id) : null,
      is_featured: raw.is_featured === "1" || raw.is_featured === "true",
      is_new: raw.is_new === "1" || raw.is_new === "true",
    };
  }).filter((row) => row.slug || row.sku || row.name_en);

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"><div className="w-full max-w-4xl rounded-3xl bg-white/60 backdrop-blur-xl p-5 shadow-2xl sm:p-7" dir={getLocaleConfig(locale).direction}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-sky-600">BARAN / BULK ENTRY</p><h2 className="mt-2 text-2xl font-black">{isFa ? "ورود سریع محصولات" : "Bulk product entry"}</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{isFa ? "یک CSV یا TSV از اکسل paste کنید. ردیف‌ها در یک تراکنش اعتبارسنجی و ثبت می‌شوند." : "Paste CSV or TSV from Excel. Rows are validated and saved in one transaction."}</p></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button></div><textarea value={text} onChange={(event) => setText(event.target.value)} className="mt-6 min-h-64 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 font-mono text-xs leading-6 outline-none focus:border-sky-400" dir="ltr" spellCheck={false} /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span>{rows.length} {isFa ? "ردیف آماده ثبت" : "rows ready"}</span><span dir="ltr">slug, sku, name_fa, name_en, gender, status, price_toman, price_usd, stock, low_stock_threshold</span></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold">{isFa ? "انصراف" : "Cancel"}</button><button type="button" disabled={saving || rows.length === 0} onClick={() => void onImport(rows)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving && <RefreshCw size={16} className="animate-spin" />}{isFa ? `ثبت ${rows.length} محصول` : `Import ${rows.length} products`}</button></div></div></div>;
}

function ProductModal({
  locale,
  categories,
  attributes,
  form,
  setForm,
  editing,
  saving,
  onUploadImage,
  onClose,
  onSubmit,
}: {
  locale: string;
  categories: AdminCategory[];
  attributes: AdminAttribute[];
  form: ProductPayload;
  setForm: React.Dispatch<React.SetStateAction<ProductPayload>>;
  editing: boolean;
  saving: boolean;
  onUploadImage: (file: File) => Promise<string>;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const isFa = locale === "fa";
  const supportedLocales = getSupportedLocales();
  const activeCurrencyCodes = Array.from(new Set(supportedLocales.map((option) => option.currency).filter((code): code is CurrencyCode => code in currencyRegistry)));
  const currencyOptions = activeCurrencyCodes.length ? activeCurrencyCodes.map((code) => currencyRegistry[code]) : Object.values(currencyRegistry);
  const localeCurrency = getLocaleConfig(locale).currency as CurrencyCode;
  const defaultPriceCurrency = currencyRegistry[localeCurrency] && currencyOptions.some((currency) => currency.code === localeCurrency) ? localeCurrency : currencyOptions[0]?.code ?? "IRT";
  const [step, setStep] = useState(0);
  const [manualSlug, setManualSlug] = useState(Boolean(editing));
  const [skuTouched, setSkuTouched] = useState(Boolean(editing));
  const [priceCurrency, setPriceCurrency] = useState<CurrencyCode>(defaultPriceCurrency);
  const [imageDraft, setImageDraft] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const field = (key: keyof ProductPayload, value: string | number | boolean | null) =>
    setForm((current) => ({ ...current, [key]: value }));
  const localizedValue = (code: string, kind: "name" | "description") => {
    if (code === "fa") return kind === "name" ? form.name_fa : form.description_fa ?? "";
    if (code === "en") return kind === "name" ? form.name_en : form.description_en ?? "";
    return kind === "name" ? form.translations?.[code]?.name ?? "" : form.translations?.[code]?.description ?? "";
  };
  const setLocalizedValue = (code: string, kind: "name" | "description", value: string) => {
    if (code === "fa") { field(kind === "name" ? "name_fa" : "description_fa", value); return; }
    if (code === "en") { field(kind === "name" ? "name_en" : "description_en", value); return; }
    setForm((current) => ({
      ...current,
      translations: {
        ...(current.translations ?? {}),
        [code]: { ...(current.translations?.[code] ?? {}), [kind]: value, name: kind === "name" ? value : current.translations?.[code]?.name ?? "" },
      },
    }));
  };
  const productPriceField = priceCurrency === "IRT" ? "price_toman" : "price_usd";
  const comparePriceField = priceCurrency === "IRT" ? "compare_at_toman" : "compare_at_usd";
  const currencyLabel = (code: CurrencyCode) => isFa ? currencyRegistry[code].labelFa : currencyRegistry[code].labelEn;
  const updateVariant = (index: number, key: string, value: string | number | boolean | null | number[]) => {
    setForm((current) => ({
      ...current,
      variants: (current.variants ?? []).map((variant, variantIndex) => variantIndex === index ? { ...variant, [key]: value } : variant),
    }));
  };
  const addVariant = () => {
    setForm((current) => {
      const variants = current.variants ?? [];
      return {
        ...current,
        variants: [...variants, {
          sku: `${current.sku || generateSkuFromName(current.name_en || "Product")}-${String(variants.length + 1).padStart(2, "0")}`,
          price_toman: current.price_toman,
          price_usd: current.price_usd,
          compare_at_toman: current.compare_at_toman ?? null,
          compare_at_usd: current.compare_at_usd ?? null,
          stock: current.stock,
          low_stock_threshold: current.low_stock_threshold,
          is_default: variants.length === 0,
          is_active: true,
          attribute_value_ids: [],
        }],
      };
    });
  };
  const removeVariant = (index: number) => setForm((current) => ({ ...current, variants: (current.variants ?? []).filter((_, variantIndex) => variantIndex !== index) }));
  const makeDefaultVariant = (index: number) => setForm((current) => ({ ...current, variants: (current.variants ?? []).map((variant, variantIndex) => ({ ...variant, is_default: variantIndex === index })) }));
  const addImage = () => {
    const path = imageDraft.trim();
    if (!path) return;
    setForm((current) => ({ ...current, images: [...(current.images ?? []), { path, alt_text: current.name_en, is_primary: !(current.images?.length), sort_order: current.images?.length ?? 0 }] }));
    setImageDraft("");
  };
  const removeImage = (index: number) => setForm((current) => ({ ...current, images: (current.images ?? []).filter((_, imageIndex) => imageIndex !== index).map((image, imageIndex) => ({ ...image, is_primary: imageIndex === 0, sort_order: imageIndex })) }));
  const handleImageFile = async (file?: File) => {
    if (!file || imageUploading || (form.images?.length ?? 0) >= 12) return;
    setImageUploading(true);
    try {
      const path = await onUploadImage(file);
      setForm((current) => ({ ...current, images: [...(current.images ?? []), { path, alt_text: current.name_en, is_primary: !(current.images?.length), sort_order: current.images?.length ?? 0 }] }));
    } finally {
      setImageUploading(false);
    }
  };

  const tabs = [
    { title: isFa ? "هویت" : "Identity", description: isFa ? "نام، URL و شناسه داخلی" : "Name, URL and identifiers" },
    { title: isFa ? "قیمت و موجودی" : "Price & stock", description: isFa ? "قیمت، تخفیف و موجودی" : "Pricing, sale and inventory" },
    { title: isFa ? "محتوا" : "Content", description: isFa ? "توضیح و وضعیت نمایش" : "Description and visibility" },
  ];
  const slug = slugify(form.slug);
  const slugError = form.slug !== "" && slug !== form.slug;
  const missingLocales = supportedLocales.filter((option) => !localizedValue(option.code, "name").trim());
  const effectiveSku = form.sku.trim() || (form.name_en.trim() ? generateSkuFromName(form.name_en) : "");
  const canContinue = step === 0
    ? Boolean(!missingLocales.length && effectiveSku && slug && !slugError)
    : step === 1
      ? Number.isFinite(form.price_toman) && Number.isFinite(form.price_usd) && Number.isFinite(form.stock) && form.price_toman >= 0 && form.price_usd >= 0 && form.stock >= 0
      : true;
  const validationHint = step === 0
    ? (missingLocales.length ? (isFa ? `نام این زبان‌ها را وارد کنید: ${missingLocales.map((option) => option.nativeLabel).join("، ")}.` : `Add a name for: ${missingLocales.map((option) => option.label).join(", ")}.`) : (!slug || slugError) ? (isFa ? "اسلاگ معتبر نیست؛ از گزینه ساخت خودکار استفاده کنید." : "The slug is not valid; use automatic generation.") : "")
    : step === 1 && !canContinue ? (isFa ? "قیمت و موجودی باید عدد معتبر صفر یا بیشتر باشند." : "Price and stock must be valid numbers greater than or equal to zero.")
    : "";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <form
        onSubmit={onSubmit}
        className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white/95 p-5 shadow-2xl sm:p-7"
        dir={getLocaleConfig(locale).direction}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-sky-600">BARAN / PRODUCT WORKFLOW</p>
            <h2 className="mt-2 text-2xl font-black">{editing ? (isFa ? "ویرایش محصول" : "Edit product") : (isFa ? "ساخت محصول با راهنما" : "Guided product creation")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isFa ? "هر مرحله برای یک تصمیم مشخص است؛ داده‌های مهم قبل از ذخیره اعتبارسنجی می‌شوند." : "Each step has one job; important data is validated before saving."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={19} /></button>
        </div>

        <div className="mt-7 grid gap-2 sm:grid-cols-3">
          {tabs.map((tab, index) => (
            <button
              type="button"
              key={tab.title}
              onClick={() => setStep(index)}
              className={`rounded-2xl border p-3 text-start transition ${step === index ? "border-sky-300 bg-sky-50 text-sky-900" : "border-slate-200 bg-slate-50/70 text-slate-500 hover:border-sky-200"}`}
            >
              <span className="flex items-center gap-2 text-sm font-black"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs shadow-sm">{index + 1}</span>{tab.title}</span>
              <span className="mt-1 block text-[11px] font-normal">{tab.description}</span>
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="mt-7 grid gap-5">
            <HelpCard title={isFa ? "این مرحله چه کار می‌کند؟" : "What this step does"}>
              {isFa ? "نام محصول برای مشتری است؛ SKU برای انبار و اسلاگ فقط مسیر قابل خواندن صفحه است. تغییر اسلاگ قبلی، redirect امن ایجاد می‌کند." : "The name is customer-facing; SKU is for inventory; the slug is only the readable page path. Changing an old slug creates a safe redirect."}
            </HelpCard>
            <div className="grid gap-4 sm:grid-cols-2">
              {supportedLocales.map((option) => <AdminField key={option.code} label={`${option.nativeLabel} / ${option.label}`} required hint={isFa ? "عنوان هر زبان جداگانه ذخیره می‌شود و با فعال‌شدن زبان جدید، این فیلد خودکار اضافه می‌شود." : "Each active language gets its own title; new active locales appear here automatically."}>
                <input required value={localizedValue(option.code, "name")} onChange={(event) => {
                  setLocalizedValue(option.code, "name", event.target.value);
                  if (option.code === "en" && !manualSlug) field("slug", slugify(event.target.value) || randomSlug("product"));
                }} className="admin-input" dir={option.direction === "rtl" ? "rtl" : "ltr"} />
              </AdminField>)}
              <AdminField label="SKU" hint={isFa ? "اگر خالی بماند، هنگام ذخیره یک SKU استاندارد مثل PRD-BLACK-HOODIE-7F2A1C ساخته می‌شود." : "Leave empty and a standard SKU such as PRD-BLACK-HOODIE-7F2A1C will be generated on save."}>
                <div className="flex gap-2">
                  <input value={form.sku} onChange={(event) => { setSkuTouched(true); field("sku", normalizeSkuInput(event.target.value)); }} onBlur={() => { if (!skuTouched && !form.sku.trim() && form.name_en.trim()) field("sku", generateSkuFromName(form.name_en)); }} placeholder={isFa ? "ساخت خودکار هنگام ذخیره" : "Generated automatically on save"} className="admin-input font-mono" dir="ltr" />
                  <button type="button" onClick={() => { setSkuTouched(false); field("sku", generateSkuFromName(form.name_en || form.name_fa)); }} className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 hover:bg-violet-100">{isFa ? "ساخت SKU" : "Generate SKU"}</button>
                </div>
              </AdminField>
              <AdminField label={isFa ? "دسته‌بندی" : "Category"} hint={isFa ? "دسته‌بندی مسیر فیلتر و navigation را تعیین می‌کند." : "Controls catalog navigation and filters."}>
                <select value={form.category_id ?? ""} onChange={(event) => field("category_id", event.target.value ? parseNumericInput(event.target.value) : null)} className="admin-input">
                  <option value="">{isFa ? "بدون دسته‌بندی" : "No category"}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{isFa ? category.name_fa : category.name_en}</option>)}
                </select>
              </AdminField>
            </div>
            <AdminField label={isFa ? "آدرس صفحه / اسلاگ" : "Page URL / slug"} required hint={isFa ? "سیستم به‌صورت پیش‌فرض یک شناسه تصادفی امن می‌سازد؛ اگر لازم بود با دکمه ویرایش دستی آن را تغییر دهید." : "The system creates a safe random identifier by default; unlock it only when you need a custom slug."}>
              <div className="flex gap-2">
                <input required readOnly={!manualSlug} value={form.slug} onChange={(event) => { setManualSlug(true); field("slug", slugify(event.target.value)); }} className={`admin-input font-mono ${manualSlug ? "" : "bg-slate-50 text-slate-500"} ${slugError ? "border-rose-400" : ""}`} dir="ltr" />
                <button type="button" onClick={() => { setManualSlug(false); field("slug", slugify(form.name_en || form.name_fa) || randomSlug("product")); }} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 hover:bg-violet-100"><Wand2 size={15} />{isFa ? "ساخت از نام" : "From name"}</button><button type="button" onClick={() => { setManualSlug(false); field("slug", randomSlug("product")); }} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-700 hover:bg-sky-100">
                  <Wand2 size={15} />{isFa ? "تولید شناسه جدید" : "Generate new"}
                </button>
                <button type="button" onClick={() => setManualSlug((current) => !current)} className="shrink-0 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  {manualSlug ? (isFa ? "قفل کردن" : "Lock") : (isFa ? "ویرایش دستی" : "Edit")}
                </button>
              </div>
              <span className="font-mono text-[11px] font-normal text-slate-500" dir="ltr">/product/{slug || "your-product-slug"}</span>
              {slugError && <span className="text-xs font-normal text-rose-600">{isFa ? "اسلاگ به فرمت استاندارد تبدیل شد؛ ذخیره با همین مقدار انجام می‌شود." : "The slug was normalized to the standard URL format."}</span>}
            </AdminField>
          </div>
        )}

        {step === 1 && (
          <div className="mt-7 grid gap-5">
            <HelpCard title={isFa ? "این مرحله چه کار می‌کند؟" : "What this step does"}>
              {isFa ? "قیمت فروش، قیمت مقایسه‌ای و موجودی variant پیش‌فرض را ثبت می‌کند. قیمت مقایسه‌ای فقط برای نمایش تخفیف است و تخفیف واقعی باید در backend اعتبارسنجی شود." : "This controls the default variant price, compare-at price and inventory. Compare-at values are visual only; real discounts remain backend-validated."}
            </HelpCard>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={isFa ? "واحد قیمت" : "Price currency"} required hint={isFa ? "واحد بر اساس زبان فعال پیشنهاد می‌شود؛ برای ثبت بازار دیگر، واحد را تغییر دهید." : "The currency follows the active locale by default; switch it to edit another market price."}>
                <div className="grid gap-2 sm:grid-cols-[minmax(150px,.8fr)_1.2fr]">
                  <select value={priceCurrency} onChange={(event) => setPriceCurrency(event.target.value as CurrencyCode)} className="admin-input font-bold">
                    {currencyOptions.map((currency) => <option key={currency.code} value={currency.code}>{currencyLabel(currency.code)} ({currency.code})</option>)}
                  </select>
                  <input required type="text" inputMode={priceCurrency === "USD" ? "decimal" : "numeric"} min="0" step={priceCurrency === "USD" ? "0.01" : undefined} value={form[productPriceField]} onChange={(event) => field(productPriceField, parseNumericInput(event.target.value))} className="admin-input" dir="ltr" placeholder={currencyLabel(priceCurrency)} />
                </div>
              </AdminField>
              <AdminField label={isFa ? "قیمت قبل از تخفیف" : "Compare-at price"} hint={isFa ? "اختیاری است؛ برای همین واحد ارزی ثبت می‌شود." : "Optional crossed-out reference price in the selected currency."}>
                <input type="text" inputMode={priceCurrency === "USD" ? "decimal" : "numeric"} min="0" step={priceCurrency === "USD" ? "0.01" : undefined} value={form[comparePriceField] ?? ""} onChange={(event) => field(comparePriceField, event.target.value ? parseNumericInput(event.target.value) : null)} className="admin-input" dir="ltr" placeholder={currencyLabel(priceCurrency)} />
              </AdminField>
              <AdminField label={isFa ? "موجودی" : "Stock"} required hint={isFa ? "منبع حقیقت موجودی backend است و cart از همین مقدار استفاده می‌کند." : "Backend-owned inventory; cart and checkout use this value."}>
                <input required type="text" inputMode="decimal" min="0" value={form.stock} onChange={(event) => field("stock", parseNumericInput(event.target.value))} className="admin-input" dir="ltr" />
              </AdminField>
              <AdminField label={isFa ? "آستانه هشدار موجودی" : "Low-stock threshold"} required hint={isFa ? "وقتی موجودی به این عدد برسد، کارت هشدار در داشبورد دیده می‌شود." : "Dashboard warning appears when stock reaches this number."}>
                <input required type="text" inputMode="decimal" min="0" value={form.low_stock_threshold} onChange={(event) => field("low_stock_threshold", parseNumericInput(event.target.value))} className="admin-input" dir="ltr" />
              </AdminField>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h4 className="font-black text-violet-950">{isFa ? "تنوع‌ها و موجودی سایز/رنگ" : "Variants & inventory matrix"}</h4><p className="mt-1 text-xs leading-6 text-violet-800/70">{isFa ? "برای هر SKU قیمت و موجودی مستقل تعریف کنید. اگر هیچ تنوعی نسازید، variant پیش‌فرض استفاده می‌شود." : "Give each SKU its own price and stock. If you add none, the default variant above is used."}</p></div><button type="button" onClick={addVariant} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700"><Plus size={15} />{isFa ? "افزودن تنوع" : "Add variant"}</button>
              </div>
              {form.variants?.length ? <div className="mt-4 grid gap-3">{form.variants.map((variant, index) => <div key={`${variant.sku}-${index}`} className="rounded-2xl border border-violet-100 bg-white p-3 shadow-sm"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-bold text-slate-500">SKU<input value={variant.sku} onChange={(event) => updateVariant(index, "sku", normalizeSkuInput(event.target.value))} className="admin-input mt-1 font-mono" dir="ltr" /></label><label className="text-xs font-bold text-slate-500">{currencyLabel(priceCurrency)}<input type="text" inputMode={priceCurrency === "USD" ? "decimal" : "numeric"} min="0" step={priceCurrency === "USD" ? "0.01" : undefined} value={variant[productPriceField]} onChange={(event) => updateVariant(index, productPriceField, parseNumericInput(event.target.value))} className="admin-input mt-1" dir="ltr" /></label><label className="text-xs font-bold text-slate-500">{isFa ? "قیمت قبل از تخفیف" : "Compare-at"}<input type="text" inputMode={priceCurrency === "USD" ? "decimal" : "numeric"} min="0" step={priceCurrency === "USD" ? "0.01" : undefined} value={variant[comparePriceField] ?? ""} onChange={(event) => updateVariant(index, comparePriceField, event.target.value ? parseNumericInput(event.target.value) : null)} className="admin-input mt-1" dir="ltr" /></label><label className="text-xs font-bold text-slate-500">{isFa ? "موجودی" : "Stock"}<input type="text" inputMode="decimal" min="0" value={variant.stock} onChange={(event) => updateVariant(index, "stock", parseNumericInput(event.target.value))} className="admin-input mt-1" dir="ltr" /></label></div>{attributes.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-2">{attributes.map((attribute) => { const selectedValue = (variant.attribute_value_ids ?? []).find((valueId) => attribute.values.some((value) => value.id === valueId)); return <label key={attribute.id} className="text-xs font-bold text-slate-500">{isFa ? attribute.name_fa : attribute.name_en}<select value={selectedValue ?? ""} onChange={(event) => { const next = (variant.attribute_value_ids ?? []).filter((valueId) => !attribute.values.some((value) => value.id === valueId)); if (event.target.value) next.push(parseNumericInput(event.target.value)); updateVariant(index, "attribute_value_ids", next); }} className="admin-input mt-1"><option value="">{isFa ? "بدون انتخاب" : "Not selected"}</option>{attribute.values.map((value) => <option key={value.id} value={value.id}>{isFa ? value.name_fa : value.name_en}</option>)}</select></label>; })}</div>}<div className="mt-3 flex flex-wrap items-center justify-between gap-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={variant.is_active} onChange={(event) => updateVariant(index, "is_active", event.target.checked)} />{isFa ? "فعال" : "Active"}</label><div className="flex items-center gap-2"><button type="button" onClick={() => makeDefaultVariant(index)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${variant.is_default ? "bg-emerald-100 text-emerald-700" : "border border-slate-200 text-slate-500 hover:border-emerald-300"}`}>{variant.is_default ? (isFa ? "تنوع پیش‌فرض" : "Default") : (isFa ? "پیش‌فرض شود" : "Make default")}</button><button type="button" onClick={() => removeVariant(index)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50">{isFa ? "حذف" : "Remove"}</button></div></div></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-violet-200 px-3 py-4 text-center text-xs text-violet-700/70">{isFa ? "هنوز تنوعی اضافه نشده است." : "No custom variants yet."}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-7 grid gap-5">
            <HelpCard title={isFa ? "این مرحله چه کار می‌کند؟" : "What this step does"}>
              {isFa ? "توضیحات را برای SEO و تجربه مشتری وارد کنید و بعد تصمیم بگیرید محصول draft بماند یا روی storefront منتشر شود." : "Add content for SEO and customer context, then decide whether the product stays a draft or appears on the storefront."}
            </HelpCard>
            <div className="grid gap-4 sm:grid-cols-2">
              {supportedLocales.map((option) => <AdminField key={option.code} label={`${isFa ? "توضیح" : "Description"} · ${option.nativeLabel}`} hint={isFa ? "توضیحات این زبان در ترجمه همان زبان ذخیره می‌شود." : "This description is stored with the selected locale."} className="sm:col-span-2">
                <textarea value={localizedValue(option.code, "description")} onChange={(event) => setLocalizedValue(option.code, "description", event.target.value)} className="admin-input min-h-28" dir={option.direction === "rtl" ? "rtl" : "ltr"} />
              </AdminField>)}
              <AdminField label={isFa ? "جنسیت" : "Gender"} hint="Controls gender navigation and catalog filters.">
                <select value={form.gender} onChange={(event) => field("gender", event.target.value)} className="admin-input"><option value="unisex">Unisex</option><option value="men">Men</option><option value="women">Women</option></select>
              </AdminField>
              <AdminField label={isFa ? "وضعیت انتشار" : "Publishing status"} hint={isFa ? "Draft در storefront دیده نمی‌شود؛ Published بلافاصله قابل نمایش است." : "Draft stays hidden; Published is immediately eligible for the storefront."}>
                <select value={form.status} onChange={(event) => field("status", event.target.value)} className="admin-input"><option value="draft">{isFa ? "پیش‌نویس" : "Draft"}</option><option value="published">{isFa ? "منتشرشده" : "Published"}</option><option value="archived">{isFa ? "آرشیو" : "Archived"}</option></select>
              </AdminField>
            </div>
            <div className="flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm font-bold">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(event) => field("is_featured", event.target.checked)} />{isFa ? "نمایش در منتخب‌ها" : "Featured product"}</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_new} onChange={(event) => field("is_new", event.target.checked)} />{isFa ? "علامت محصول جدید" : "Mark as new"}</label>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-black">{isFa ? "گالری تصاویر محصول" : "Product media gallery"}</h4><p className="mt-1 text-xs leading-6 text-slate-500">{isFa ? "آدرس تصویر را اضافه کنید؛ برای فایل‌های جدید می‌توانیم در مرحله بعد uploader ذخیره‌سازی اضافه کنیم." : "Add image URLs now; a storage uploader can be connected next without changing the catalog model."}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{form.images?.length ?? 0}/12</span></div>
              <div className="mt-4 flex gap-2"><input value={imageDraft} onChange={(event) => setImageDraft(event.target.value)} placeholder="https://... or /Images/..." className="admin-input font-mono" dir="ltr" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addImage(); } }} /><button type="button" onClick={addImage} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-sky-700"><Plus size={15} />{isFa ? "افزودن" : "Add"}</button></div>
              <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void handleImageFile(event.dataTransfer.files?.[0]); }} className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-sky-300 bg-sky-50/70 px-4 py-3 text-xs font-bold text-sky-700 transition hover:bg-sky-100"><Upload size={16} />{imageUploading ? (isFa ? "در حال بارگذاری..." : "Uploading...") : (isFa ? "تصویر را بکشید یا انتخاب کنید" : "Drop an image or choose a file")}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={imageUploading} onChange={(event) => { void handleImageFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
              {form.images?.length ? <div className="mt-4 grid gap-2">{form.images.map((image, index) => <div key={`${image.path}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-[10px] text-slate-400">{image.path.startsWith("http") ? <img src={image.path} alt={image.alt_text ?? ""} className="h-full w-full object-cover" /> : <span>{isFa ? "تصویر" : "Image"}</span>}</div><span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600" dir="ltr">{image.path}</span>{index === 0 && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">{isFa ? "اصلی" : "Primary"}</span>}<button type="button" onClick={() => removeImage(index)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></button></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">{isFa ? "هنوز تصویری اضافه نشده است." : "No images added yet."}</p>}
            </div>
          </div>
        )}

        {validationHint && <div className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800"><AlertTriangle size={16} />{validationHint}</div>}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <span className="text-xs text-slate-500">{isFa ? `مرحله ${step + 1} از ${tabs.length}` : `Step ${step + 1} of ${tabs.length}`}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">{isFa ? "انصراف" : "Cancel"}</button>
            {step > 0 && <button type="button" onClick={() => setStep((current) => current - 1)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold">{isFa ? "قبلی" : "Back"}</button>}
            {step < tabs.length - 1 ? (
              <button type="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)} className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{isFa ? "مرحله بعد" : "Continue"}</button>
            ) : (
              <button disabled={saving || !canContinue} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{saving && <RefreshCw size={16} className="animate-spin" />}{editing ? (isFa ? "ذخیره تغییرات" : "Save changes") : (isFa ? "ساخت محصول" : "Create product")}</button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
