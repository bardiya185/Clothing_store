/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Check,
  Heart,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Plus,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { formatAmount } from "@/lib/product";
import { useLogOut } from "@/hooks/useAuth";
import {
  useAccountOrders,
  useAddresses,
  useCreateAddress,
  useCurrentUser,
  useDeleteAddress,
  useRemoveWishlist,
  useUpdateProfile,
  useWishlist,
} from "@/hooks/useAccount";
import ProductCard from "@/components/catalog/ProductCard";
import NeshanMapPicker from "@/components/account/NeshanMapPicker";

const emptyAddress = {
  title: "",
  recipient_name: "",
  phone: "",
  province: "",
  city: "",
  address: "",
  postal_code: "",
  latitude: "",
  longitude: "",
  is_default: false,
};

type AddressDraft = typeof emptyAddress;

export default function AccountPage() {
  const { locale, t } = useLocale();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const logout = useLogOut();
  const [tab, setTab] = useState<"profile" | "orders" | "wishlist">("profile");
  const [orderStatus, setOrderStatus] = useState("all");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressDraft, setAddressDraft] = useState<AddressDraft>(emptyAddress);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const wishlist = useWishlist(Boolean(user));
  const orders = useAccountOrders(Boolean(user));
  const addresses = useAddresses(Boolean(user));
  const profile = useUpdateProfile();
  const createAddress = useCreateAddress();
  const deleteAddress = useDeleteAddress();
  const remove = useRemoveWishlist();

  if (userLoading)
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-accent" />
      </div>
    );
  if (!user)
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-5 text-center">
        <UserRound size={36} className="text-accent" />
        <h1 className="mt-5 text-3xl font-black">{t.account.signInTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.account.signInHint}</p>
        <Link
          href="/login"
          className="mt-7 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background"
        >
          {t.common.signIn}
        </Link>
      </div>
    );

    useEffect(() => {
    
    set
      
    
    }, []);

  const statusLabel = (status: string) =>
    ({
      pending: t.account.pending,
      paid: t.account.paid,
      processing: t.account.processing,
      shipped: t.account.shipped,
      completed: t.account.completed,
      cancelled: t.account.cancelled,
      returned: t.account.returned,
      refunded: t.account.refunded,
    })[status] ?? status;
  const filteredOrders = orders.data?.filter(
    (order) => orderStatus === "all" || order.status === orderStatus,
  ) ?? [];

  const updateAddressField = (
    field: keyof AddressDraft,
    value: string | boolean,
  ) => {
    setAddressDraft((current) => ({ ...current, [field]: value }));
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateAddressField("latitude", position.coords.latitude.toFixed(7));
        updateAddressField("longitude", position.coords.longitude.toFixed(7));
        setLocationMessage(t.account.locationReady);
      },
      () =>
        setLocationMessage(
          locale === "fa"
            ? "دسترسی به موقعیت ممکن نبود."
            : "Location access was unavailable.",
        ),
    );
  };

  const handleMapSelect = (location: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    province?: string;
  }) => {
    setAddressDraft((current) => ({
      ...current,
      latitude: location.latitude.toFixed(7),
      longitude: location.longitude.toFixed(7),
      address: location.address || current.address,
      city: location.city || current.city,
      province: location.province || current.province,
    }));
    setLocationMessage(t.account.locationReady);
  };

  const submitAddress = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createAddress.mutate(
      {
        ...addressDraft,
        latitude: addressDraft.latitude ? Number(addressDraft.latitude) : null,
        longitude: addressDraft.longitude
          ? Number(addressDraft.longitude)
          : null,
      },
      {
        onSuccess: () => {
          setAddressDraft(emptyAddress);
          setAddressFormOpen(false);
          setLocationMessage("");
        },
      },
    );
  };



  return (
    <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-5 md:px-10 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col justify-between gap-5 border-b border-border pb-8 md:flex-row md:items-end"
      >
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">
            BARAN / ACCOUNT
          </p>
          <h1 className="display-heading text-5xl font-black sm:text-6xl md:text-8xl">
            {t.account.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {user.name || (locale === "fa" ? "کاربر باران" : "Baran member")} ·{" "}
            {user.phone}
          </p>
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-border px-5 py-3 text-sm font-bold transition hover:border-red-400 hover:text-red-500 disabled:opacity-50 md:self-auto"
        >
          {logout.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <LogOut size={16} />
          )}
          {t.common.signOut}
        </button>
      </motion.div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="flex gap-2 overflow-x-auto no-scrollbar lg:flex-col">
          {[
            { id: "profile", label: t.account.profile, icon: UserRound },
            { id: "orders", label: t.account.orders, icon: Package },
            { id: "wishlist", label: t.account.wishlist, icon: Heart },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full ${tab === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-card hover:text-foreground"}`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </aside>
        <section className="min-w-0">
          {tab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-2xl font-black">
                      {t.account.personal}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.account.personalHint}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <UserRound size={22} />
                  </span>
                </div>
                <form
                  onSubmit={(eventf) => {
                    eventf.preventDefault();
                    profile.mutate({
                      name: name || user.name || "",
                      email: email || user.email || "",
                      phone: phone || user.phone,
                    });
                  }}
                  className="mt-8 grid gap-5 sm:grid-cols-2"
                >
                  <label className="grid gap-2 text-sm font-bold">
                    {t.account.fullName}
                    <input
                      required
                      value={name ? name :  ""}
                      onChange={  (event) => setName(event.target.value)  }
                      className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none transition focus:border-accent"
                      placeholder={t.account.namePlaceholder}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold">
                    {t.account.phone}
                    <input
                      required
                      value={phone || user.phone || ""}
                      onChange={(event) => setPhone(event.target.value)}
                      className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none transition focus:border-accent"
                      inputMode="tel"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold sm:col-span-2">
                    {t.account.email}
                    <input
                      type="email"
                      value={email || user.email || ""}
                      onChange={(event) => setEmail(event.target.value)}
                      className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none transition focus:border-accent"
                      placeholder="you@example.com"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <button
                      disabled={profile.isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background transition hover:bg-accent hover:text-white disabled:opacity-50"
                    >
                      {profile.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {t.account.save}
                    </button>
                  </div>
                </form>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-2xl font-black">
                      {t.account.addresses}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t.account.addresses}
                    </p>
                  </div>
                  <button
                    onClick={() => setAddressFormOpen((open) => !open)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:bg-accent hover:text-white"
                  >
                    <Plus size={17} />
                    {t.account.addAddress}
                  </button>
                </div>
                {addressFormOpen && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    onSubmit={submitAddress}
                    className="mt-7 grid gap-4 overflow-hidden border-t border-border pt-7 sm:grid-cols-2"
                  >
                    <label className="grid gap-2 text-sm font-bold">
                      {t.account.addressTitle}
                      <input
                        value={addressDraft.title}
                        onChange={(event) =>
                          updateAddressField("title", event.target.value)
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                        placeholder={
                          locale === "fa"
                            ? "خانه، محل کار..."
                            : "Home, office..."
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-bold">
                      {t.account.recipientName}
                      <input
                        required
                        value={addressDraft.recipient_name}
                        onChange={(event) =>
                          updateAddressField(
                            "recipient_name",
                            event.target.value,
                          )
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-bold">
                      {t.account.phone}
                      <input
                        required
                        value={addressDraft.phone}
                        onChange={(event) =>
                          updateAddressField("phone", event.target.value)
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                        inputMode="tel"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-bold">
                      {t.account.province}
                      <input
                        required
                        value={addressDraft.province}
                        onChange={(event) =>
                          updateAddressField("province", event.target.value)
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-bold">
                      {t.account.city}
                      <input
                        required
                        value={addressDraft.city}
                        onChange={(event) =>
                          updateAddressField("city", event.target.value)
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-bold">
                      {t.account.postalCode}
                      <input
                        required
                        value={addressDraft.postal_code}
                        onChange={(event) =>
                          updateAddressField("postal_code", event.target.value)
                        }
                        className="rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                        inputMode="numeric"
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-bold sm:col-span-2">
                      {t.account.address}
                      <textarea
                        required
                        rows={3}
                        value={addressDraft.address}
                        onChange={(event) =>
                          updateAddressField("address", event.target.value)
                        }
                        className="resize-none rounded-xl border border-border bg-background px-4 py-3 font-normal outline-none focus:border-accent"
                      />
                    </label>
                    <div className="space-y-3 sm:col-span-2">
                      <NeshanMapPicker
                        latitude={addressDraft.latitude ? Number(addressDraft.latitude) : null}
                        longitude={addressDraft.longitude ? Number(addressDraft.longitude) : null}
                        locale={locale}
                        onSelect={handleMapSelect}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent/5 px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                          {addressDraft.latitude && addressDraft.longitude
                            ? `${addressDraft.latitude}, ${addressDraft.longitude}`
                            : locale === "fa"
                              ? "یک نقطه روی نقشه انتخاب کنید."
                              : "Select a point on the map."}
                        </p>
                        <button
                          type="button"
                          onClick={detectLocation}
                          className="rounded-full border border-accent px-4 py-2 text-xs font-bold text-accent transition hover:bg-accent hover:text-white"
                        >
                          {t.account.useLocation}
                        </button>
                      </div>
                      {locationMessage && (
                        <p className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <Check size={14} />
                          {locationMessage}
                        </p>
                      )}
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={addressDraft.is_default}
                        onChange={(event) =>
                          updateAddressField("is_default", event.target.checked)
                        }
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                      {t.account.defaultAddress}
                    </label>
                    <div className="flex flex-wrap gap-3 sm:col-span-2">
                      <button
                        disabled={createAddress.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background disabled:opacity-50"
                      >
                        {createAddress.isPending && (
                          <Loader2 size={16} className="animate-spin" />
                        )}
                        {t.account.saveAddress}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressFormOpen(false)}
                        className="rounded-full border border-border px-6 py-3 text-sm font-bold"
                      >
                        {t.account.cancel}
                      </button>
                    </div>
                  </motion.form>
                )}
                <div className="mt-6 grid gap-3">
                  {addresses.isLoading ? (
                    <Loader2 className="animate-spin text-accent" />
                  ) : addresses.data?.length ? (
                    addresses.data.map((address) => (
                      <div
                        key={address.id}
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-border p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                            <MapPin size={18} />
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold">
                                {address.title || address.city}
                              </p>
                              {address.is_default && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">
                                  {t.account.defaultAddress}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {address.recipient_name} · {address.phone}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {address.province}، {address.city}،{" "}
                              {address.address}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteAddress.mutate(address.id)}
                          disabled={deleteAddress.isPending}
                          className="self-end rounded-full p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500 sm:self-auto"
                          aria-label={t.common.remove}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      {t.account.noAddresses}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          {tab === "orders" && (
            <div>
              <h2 className="mb-5 text-2xl font-black">{t.account.orders}</h2>
              <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {["all", "pending", "paid", "processing", "shipped", "completed", "returned", "cancelled", "refunded"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatus(status)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${orderStatus === status ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-accent hover:text-accent"}`}
                  >
                    {status === "all" ? t.account.allOrders : statusLabel(status)}
                  </button>
                ))}
              </div>
              {orders.isLoading ? (
                <Loader2 className="animate-spin text-accent" />
              ) : orders.data?.length ? (
                filteredOrders.length ? (
                  <div className="grid gap-3">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col justify-between gap-5 rounded-[1.3rem] border border-border bg-card p-5 md:flex-row md:items-center"
                      >
                        <div>
                          <p className="font-black">#{order.number}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {order.items_count}{" "}
                            {locale === "fa" ? "آیتم" : "items"} ·{" "}
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString(
                                  locale === "fa" ? "fa-IR" : "en-US",
                                )
                              : "—"}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {order.postal_tracking_code
                              ? `${t.account.postalTracking}: ${order.postal_tracking_code}`
                              : order.postal_status === "not_configured"
                                ? t.account.postalPending
                                : order.postal_status
                                  ? `${t.account.postalTracking}: ${order.postal_status}`
                                  : null}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent">
                            {statusLabel(order.status)}
                          </span>
                          <strong className="ltr-number">
                            {formatAmount(order.total_toman, order.total_usd, locale)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.3rem] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                    {locale === "fa" ? "سفارشی با این وضعیت ندارید." : "No orders match this status."}
                  </div>
                )
              ) : (
                <div className="rounded-[1.3rem] border border-dashed border-border p-12 text-center">
                  <Package className="mx-auto text-muted-foreground" />
                  <p className="mt-4 font-bold">{t.account.noOrders}</p>
                  <Link
                    href="/shop"
                    className="mt-5 inline-block text-sm font-bold text-accent"
                  >
                    {t.actions.shopNow}
                  </Link>
                </div>
              )}
            </div>
          )}
          {tab === "wishlist" && (
            <div>
              <h2 className="mb-6 text-2xl font-black">{t.account.wishlist}</h2>
              {wishlist.isLoading ? (
                <Loader2 className="animate-spin text-accent" />
              ) : wishlist.data?.length ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {wishlist.data.map((product) => (
                    <div key={product.id} className="relative">
                      <ProductCard product={product} compact hideWishlist />
                      <button
                        onClick={() => remove.mutate(product.id)}
                        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-red-500 shadow"
                      >
                        {t.common.remove}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.3rem] border border-dashed border-border p-12 text-center">
                  <Heart className="mx-auto text-muted-foreground" />
                  <p className="mt-4 font-bold">{t.account.noWishlist}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
