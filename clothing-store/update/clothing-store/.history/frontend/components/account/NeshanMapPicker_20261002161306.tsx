"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader2, MapPin, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "@neshan-maps-platform/mapbox-gl/dist/NeshanMapboxGl.css";
import { MapOpen } from "@/app/account/page";

const DEFAULT_CENTER: [number, number] = [51.389, 35.6892];
const NESHAN_CDN_BASE =
  "https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3";

// ✅ سرویس دقیق‌تر (Reverse Geocoding Plus)
const NESHAN_REVERSE_URL = "https://api.neshan.org/v6/reverse";

async function fetchNeshan(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 8000,
) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

declare global {
  interface Window {
    nmp_mapboxgl?: any;
  }
}

function ensureNeshanStylesheet() {
  if (document.querySelector("link[data-neshan-map-style]")) return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `${NESHAN_CDN_BASE}/index.css`;
  stylesheet.dataset.neshanMapStyle = "true";
  document.head.appendChild(stylesheet);
}

function loadNeshanFromCdn(): Promise<any> {
  ensureNeshanStylesheet();
  if (window.nmp_mapboxgl) return Promise.resolve(window.nmp_mapboxgl);

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-neshan-map-sdk]",
    );
    const script = existingScript ?? document.createElement("script");
    const finish = () =>
      window.nmp_mapboxgl
        ? resolve(window.nmp_mapboxgl)
        : reject(new Error("Neshan SDK did not expose nmp_mapboxgl"));

    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Neshan CDN could not be loaded")),
      { once: true },
    );
    if (!existingScript) {
      script.async = true;
      script.dataset.neshanMapSdk = "true";
      script.src = `${NESHAN_CDN_BASE}/index.js`;
      document.head.appendChild(script);
    }
  });
}

async function loadNeshanSdk(): Promise<any> {
  ensureNeshanStylesheet();
  try {
    const neshanModule = await import("@neshan-maps-platform/mapbox-gl");
    return neshanModule.default ?? neshanModule;
  } catch {
    return loadNeshanFromCdn();
  }
}

type SelectedLocation = {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  province?: string;
};

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onSelect: (location: SelectedLocation) => void;
  locale: "fa" | "en";
};

export default function NeshanMapPicker({
  latitude,
  longitude,
  onSelect,
  locale,
  
}: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseError, setReverseError] = useState("");
  MapOpen
  const mapKey = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY?.trim();
  const serviceKey = process.env.NEXT_PUBLIC_NESHAN_SERVICE_KEY?.trim();

  const selectedCenter: [number, number] = [
    longitude ?? DEFAULT_CENTER[0],
    latitude ?? DEFAULT_CENTER[1],
  ];

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!mapOpen || !mapKey || !mapElement.current) return;
    let cancelled = false;
    let map: any;
    let resizeObserver: ResizeObserver | null = null;
    let rafId: number | null = null;

    const friendlyMapError =
      locale === "fa"
        ? "کلید نقشه معتبر نیست یا دامنه فعلی در پنل نشان مجاز نشده است."
        : "The Neshan key is invalid or this domain is not allowed.";

    (async () => {
      try {
        if (cancelled || !mapElement.current) return;

        const nmpMapboxgl = await loadNeshanSdk();
        if (cancelled || !mapElement.current) return;

        // ✅ ساخت نقشه — لایه قفل
        map = new nmpMapboxgl.Map({
          mapType: nmpMapboxgl.Map.mapTypes.neshanVector,
          container: mapElement.current,
          mapKey,
          center: selectedCenter,
          zoom: latitude != null && longitude != null ? 16 : 12,
          minZoom: 10,
          maxZoom: 20,
          trackResize: true,
          poi: false,
          traffic: false,
          // ✅ قفل کردن چرخش و کج شدن
          dragRotate: false,
          pitchWithRotate: false,
          touchZoomRotate: true,
          touchPitch: false,
          attributionControl: false,
        });
        mapRef.current = map;

        // ✅ غیرفعال کردن چرخش با keyboard و touch
        try {
          map.dragRotate?.disable?.();
          map.touchPitch?.disable?.();
          map.touchZoomRotate?.disableRotation?.();
          if (map.keyboard) map.keyboard.disableRotation?.();
        } catch (e) {
          console.warn("Disable rotation failed:", e);
        }

        // ✅ حذف تمام کنترل‌ها
        try {
          if (map.getContainer) {
            const container = map.getContainer() as HTMLElement;
            container
              .querySelectorAll(
                ".mapboxgl-ctrl-top-left, .mapboxgl-ctrl-top-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-attrib",
              )
              .forEach((el) => el.remove());
          }
        } catch (ctrlErr) {
          console.warn("Could not remove map controls:", ctrlErr);
        }

        // ✅ resize در اولین فریم
        rafId = requestAnimationFrame(() => {
          try {
            map?.resize();
          } catch (e) {
            console.warn("Resize failed:", e);
          }
        });

        // ✅ resize بعد از لود
        map.on("load", () => {
          try {
            map?.resize();
            setMapReady(true);
          } catch (e) {
            console.warn("Load resize failed:", e);
          }
        });

        // ✅ ResizeObserver
        if (mapElement.current) {
          try {
            resizeObserver = new ResizeObserver(() => {
              try {
                map?.resize();
              } catch (e) {
                console.warn("Observer resize failed:", e);
              }
            });
            resizeObserver.observe(mapElement.current);
          } catch (obsErr) {
            console.warn("ResizeObserver not available:", obsErr);
          }
        }

        // ✅ مدیریت خطا
        const handleMapError = (err: any) => {
          console.error("Map error:", err);
          setMapReady(false);
          setMapError(friendlyMapError);
          try {
            map?.remove();
          } catch (removeErr) {
            console.warn("Map remove failed:", removeErr);
          }
          mapRef.current = null;
        };
        map.on("error", handleMapError);

        // ✅ جلوگیری از تغییر لایه
        map.on("styledata", () => {
          try {
            const currentType = map.getMapType?.();
            if (
              currentType &&
              currentType !== nmpMapboxgl.Map.mapTypes.neshanVector
            ) {
              map.setMapType?.(nmpMapboxgl.Map.mapTypes.neshanVector);
            }
          } catch (e) {
            console.warn("Styledata check failed:", e);
          }
        });

        // ✅ کلیک روی نقشه
        map.on("click", (event: any) => {
          try {
            const coordinates = event.lngLat;
            map.flyTo({
              center: [coordinates.lng, coordinates.lat],
              zoom: Math.max(map.getZoom?.() ?? 16, 16),
            });
            onSelectRef.current({
              latitude: coordinates.lat,
              longitude: coordinates.lng,
            });
          } catch (e) {
            console.warn("Click handler failed:", e);
          }
        });

        // ✅ پایان حرکت
        map.on("moveend", () => {
          try {
            const center = map.getCenter();
            onSelectRef.current({
              latitude: center.lat,
              longitude: center.lng,
            });
          } catch (e) {
            console.warn("Moveend handler failed:", e);
          }
        });
      } catch (err: any) {
        console.error("Map init error:", err);
        if (!cancelled) {
          setMapError(
            err?.message?.includes("CDN")
              ? locale === "fa"
                ? "اتصال به سرور نقشه برقرار نشد."
                : "Could not connect to the map server."
              : friendlyMapError,
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (rafId !== null) cancelAnimationFrame(rafId);
      } catch (e) {
        console.warn("cancelAnimationFrame failed:", e);
      }
      try {
        if (resizeObserver) resizeObserver.disconnect();
      } catch (e) {
        console.warn("Observer disconnect failed:", e);
      }
      try {
        if (map) map.remove();
      } catch (e) {
        console.warn("Map remove failed:", e);
      }
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOpen, mapKey]);

  useEffect(() => {
    if (
      mapReady &&
      mapRef.current &&
      latitude !== null &&
      latitude !== undefined &&
      longitude !== null &&
      longitude !== undefined
    ) {
      try {
        const center = mapRef.current.getCenter();
        const isAlreadyCentered =
          Math.abs(center.lng - longitude) < 0.000001 &&
          Math.abs(center.lat - latitude) < 0.000001;
        if (!isAlreadyCentered) {
          mapRef.current.flyTo({
            center: [longitude, latitude],
            zoom: Math.max(mapRef.current.getZoom?.() ?? 16, 16),
          });
        }
      } catch (e) {
        console.warn("flyTo failed:", e);
      }
    }
  }, [latitude, longitude, mapReady]);

  // ✅ Reverse Geocoding — با جزئیات کامل
  const reverseGeocode = async () => {
    const map = mapRef.current;
    if (!map) return;

    if (!serviceKey) {
      setReverseError(
        locale === "fa"
          ? "کلید سرویس مکانیابی تنظیم نشده است."
          : "Location service key is not configured.",
      );
      return;
    }

    let point;
    try {
      point = map.getCenter();
    } catch (e) {
      console.warn("getCenter failed:", e);
      setReverseError(
        locale === "fa"
          ? "موقعیت نقشه در دسترس نیست."
          : "Map position is unavailable.",
      );
      return;
    }

    setReverseLoading(true);
    setReverseError("");

    try {
      const response = await fetchNeshan(
        `${NESHAN_REVERSE_URL}?lat=${point.lat}&lng=${point.lng}`,
        { headers: { "Api-Key": serviceKey } },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.message || `Geocoding failed (${response.status})`,
        );
      }

      const result = await response.json();

      // ✅ ساخت آدرس کامل از جزئیات پاسخ
      const parts: string[] = [];

      // اگه response جدید v6 بود
      if (result.formatted_address) {
        parts.push(result.formatted_address);
      } else {
        // ساخت دستی از اجزا
        if (result.route_name) parts.push(result.route_name);
        if (result.route_type) parts.push(result.route_type);
        if (result.neighbourhood) parts.push(result.neighbourhood);
        if (result.district) parts.push(result.district);
        if (result.city) parts.push(result.city);
      }

      const fullAddress =
        parts.filter(Boolean).join("، ") || result.address || "";

      onSelect({
        latitude: point.lat,
        longitude: point.lng,
        address: fullAddress,
        city: result.city || result.district || "",
        province: result.state || result.province || "",
      });
    } catch (err: any) {
      // ✅ مدیریت دقیق خطا
      const isAbort = err?.name === "AbortError";
      const isNetwork = err?.message?.includes("fetch");

      let errorMsg = "";
      if (isAbort) {
        errorMsg =
          locale === "fa"
            ? "زمان پاسخ سرور به پایان رسید. دوباره تلاش کنید."
            : "Server response timed out. Please try again.";
      } else if (isNetwork) {
        errorMsg =
          locale === "fa"
            ? "اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید."
            : "Could not connect. Check your internet connection.";
      } else {
        errorMsg =
          err?.message ||
          (locale === "fa"
            ? "آدرس از روی نقطه پیدا نشد. اطلاعات را دستی وارد کنید."
            : "The address could not be resolved. Enter it manually.");
      }

      setReverseError(errorMsg);
      onSelect({ latitude: point.lat, longitude: point.lng });
    } finally {
      setReverseLoading(false);
    }
  };

  return (
    
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold">
            <MapPin size={16} className="shrink-0 text-accent" />
            {locale === "fa"
              ? "موقعیت روی نقشه (اختیاری)"
              : "Map location (optional)"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {locale === "fa"
              ? "برای ساده‌تر شدن فرم، می‌توانید آدرس را دستی وارد کنید."
              : "You can enter the address manually without using the map."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMapOpen((open) => !open);
            setMapError("");
            setReverseError("");
          }}
          className="shrink-0 rounded-full border border-accent px-4 py-2 text-xs font-bold text-accent transition hover:bg-accent hover:text-white"
        >
          {mapOpen
            ? locale === "fa"
              ? "بستن نقشه"
              : "Hide map"
            : locale === "fa"
              ? "انتخاب روی نقشه"
              : "Pick on map"}
        </button>
      </div>

      {mapOpen && !mapKey && (
        <div className="mx-4 mb-4 rounded-xl border border-dashed border-amber-400/70 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold">
            <TriangleAlert size={17} />
            {locale === "fa"
              ? "کلید نقشه تنظیم نشده است"
              : "Neshan map key is not configured"}
          </div>
          <p className="mt-2 text-xs leading-6">
            {locale === "fa"
              ? "آدرس را دستی وارد کنید یا NEXT_PUBLIC_NESHAN_MAP_KEY را با کلید معتبر نشان تنظیم کنید."
              : "Enter the address manually or configure a valid NEXT_PUBLIC_NESHAN_MAP_KEY."}
          </p>
        </div>
      )}

      {mapOpen && mapKey && (
        <>
          <div className="relative aspect-16/10 w-full overflow-hidden sm:aspect-video">
            {/* ✅ مخفی کردن دائمی کنترل‌های mapbox */}
            <style jsx>{`
              :global(.mapboxgl-ctrl-top-left),
              :global(.mapboxgl-ctrl-top-right),
              :global(.mapboxgl-ctrl-bottom-left),
              :global(.mapboxgl-ctrl-bottom-right),
              :global(.mapboxgl-ctrl-attrib),
              :global(.mapboxgl-ctrl-logo) {
                display: none !important;
              }
            `}</style>
            <div ref={mapElement} className="absolute inset-0 w-full h-full" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-full">
              <MapPin
                size={36}
                strokeWidth={2.5}
                className="fill-accent text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
                aria-hidden="true"
              />
            </div>
          </div>

          {!mapReady && !mapError && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 size={15} className="animate-spin" />
              {locale === "fa"
                ? "در حال بارگذاری نقشه..."
                : "Loading map..."}
            </div>
          )}

          {mapError && (
            <div className="flex items-start gap-2 px-4 py-3 text-xs font-bold text-rose-600">
              <TriangleAlert size={15} className="mt-0.5 shrink-0" />
              <span>{mapError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={15} className="shrink-0 text-accent" />
              {locale === "fa"
                ? "نقشه را جابه‌جا کنید؛ نشانگر وسط نقشه نقطه انتخابی است."
                : "Move the map; the center pin is the selected point."}
            </p>
            <button
              type="button"
              onClick={reverseGeocode}
              disabled={!mapReady || reverseLoading || !serviceKey}
              className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background disabled:opacity-50"
            >
              {reverseLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : locale === "fa" ? (
                "ثبت آدرس این نقطه"
              ) : (
                "Use this address"
              )}
            </button>
          </div>

          {reverseError && (
            <p className="px-4 pb-3 text-xs font-bold text-rose-600">
              {reverseError}
            </p>
          )}
        </>
      )}
    </div>
  );
}