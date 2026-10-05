import type { Locale } from "@/lib/i18n";

export type AdminCopy = {
  brand: string;
  workspace: string;
  overview: string;
  catalog: string;
  products: string;
  inventory: string;
  sales: string;
  orders: string;
  customers: string;
  fulfillment: string;
  marketing: string;
  discounts: string;
  campaigns: string;
  banners: string;
  content: string;
  reviews: string;
  analytics: string;
  administration: string;
  roles: string;
  activity: string;
  recovery: string;
  lightMode: string;
  darkMode: string;
  search: string;
  commandHint: string;
  refresh: string;
  signOut: string;
  welcome: string;
  revenue: string;
  ordersCount: string;
  customersCount: string;
  productsCount: string;
  pendingOrders: string;
  pendingReviews: string;
  abandonedCarts: string;
  publishedProducts: string;
  recentOrders: string;
  topSelling: string;
  lowStock: string;
  noData: string;
  retry: string;
  open: string;
  viewAll: string;
  orderNumber: string;
  customer: string;
  total: string;
  status: string;
  date: string;
  stock: string;
  sku: string;
  noPermission: string;
  notAvailable: string;
  comingFromBackend: string;
  productsHint: string;
  ordersHint: string;
  customersHint: string;
  marketingHint: string;
  reviewsHint: string;
  inventoryHint: string;
  newProduct: string;
  searchProducts: string;
  searchOrders: string;
  searchCustomers: string;
  noProducts: string;
  noOrders: string;
  noCustomers: string;
  noReviews: string;
  noCampaigns: string;
  noDiscounts: string;
  noBanners: string;
  all: string;
  create: string;
  filter: string;
  export: string;
  active: string;
  draft: string;
  published: string;
  pending: string;
  paid: string;
  processing: string;
  shipped: string;
  completed: string;
  cancelled: string;
  approved: string;
  rejected: string;
};

export const adminMessages: Record<"fa", AdminCopy> = {
  fa: {
    brand: "باران / مدیریت",
    workspace: "مرکز عملیات فروشگاه",
    overview: "نمای کلی",
    catalog: "کاتالوگ",
    products: "محصولات",
    inventory: "موجودی",
    sales: "فروش",
    orders: "سفارش‌ها",
    customers: "مشتری‌ها",
    fulfillment: "پرداخت و ارسال",
    marketing: "بازاریابی",
    discounts: "تخفیف‌ها",
    campaigns: "کمپین‌ها",
    banners: "بنرها",
    content: "محتوا",
    reviews: "نظرات",
    analytics: "تحلیل‌ها",
    administration: "مدیریت دسترسی",
    roles: "نقش‌ها و دسترسی",
    activity: "گزارش فعالیت",
    recovery: "سبدهای رهاشده",
    lightMode: "حالت روشن",
    darkMode: "حالت تاریک",
    search: "جست‌وجو",
    commandHint: "برای جست‌وجو و اجرای فرمان",
    refresh: "بازخوانی",
    signOut: "خروج",
    welcome: "خلاصه عملکرد امروز",
    revenue: "درآمد",
    ordersCount: "سفارش‌ها",
    customersCount: "مشتری‌ها",
    productsCount: "محصولات",
    pendingOrders: "سفارش‌های در انتظار",
    pendingReviews: "نظرات در انتظار",
    abandonedCarts: "سبدهای رهاشده",
    publishedProducts: "محصولات منتشرشده",
    recentOrders: "آخرین سفارش‌ها",
    topSelling: "پرفروش‌ترین‌ها",
    lowStock: "هشدار موجودی",
    noData: "داده‌ای برای نمایش وجود ندارد.",
    retry: "تلاش دوباره",
    open: "مشاهده",
    viewAll: "مشاهده همه",
    orderNumber: "شماره سفارش",
    customer: "مشتری",
    total: "مبلغ",
    status: "وضعیت",
    date: "تاریخ",
    stock: "موجودی",
    sku: "SKU",
    noPermission: "دسترسی شما به این بخش فعال نیست.",
    notAvailable: "این دامنه هنوز در بک‌اند فعال نشده است.",
    comingFromBackend: "این بخش پس از تکمیل قرارداد بک‌اند به منبع واقعی متصل می‌شود.",
    productsHint: "کاتالوگ، تنوع‌ها و محتوای محصول",
    ordersHint: "عملیات سفارش و پیگیری وضعیت",
    customersHint: "مشتری‌ها و سابقه خرید",
    marketingHint: "کمپین، تخفیف و محتوای تبلیغاتی",
    reviewsHint: "مدیریت و بررسی دیدگاه‌ها",
    inventoryHint: "کنترل موجودی بر پایه تنوع محصول",
    newProduct: "محصول جدید",
    searchProducts: "جست‌وجوی محصول، شناسه کالا یا نامک",
    searchOrders: "جست‌وجوی شماره سفارش یا مشتری",
    searchCustomers: "جست‌وجوی نام، تلفن یا ایمیل",
    noProducts: "محصولی پیدا نشد.",
    noOrders: "سفارشی پیدا نشد.",
    noCustomers: "مشتری‌ای پیدا نشد.",
    noReviews: "نظری برای نمایش وجود ندارد.",
    noCampaigns: "کمپینی ثبت نشده است.",
    noDiscounts: "کد تخفیفی ثبت نشده است.",
    noBanners: "بنری ثبت نشده است.",
    all: "همه",
    create: "ایجاد",
    filter: "فیلتر",
    export: "خروجی",
    active: "فعال",
    draft: "پیش‌نویس",
    published: "منتشرشده",
    pending: "در انتظار",
    paid: "پرداخت‌شده",
    processing: "در حال پردازش",
    shipped: "ارسال‌شده",
    completed: "تکمیل‌شده",
    cancelled: "لغوشده",
    approved: "تأییدشده",
    rejected: "ردشده",
  },
};

export function getAdminMessages(locale: Locale): AdminCopy {
  void locale;
  return adminMessages.fa;
}
