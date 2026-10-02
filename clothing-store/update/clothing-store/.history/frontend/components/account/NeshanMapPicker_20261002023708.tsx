"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader2, MapPin, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER: [number, number] = [51.389, 35.6892];
const NESHAN_CDN_BASE = "https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.3";

declare global {
  interface Window {
    nmp_mapboxgl?: any;
  }
}

function loadNeshanFromCdn(): Promise<any> {
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
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = `${NESHAN_CDN_BASE}/index.css`;
      document.head.appendChild(stylesheet);
      script.async = true;
      script.dataset.neshanMapSdk = "true";
      script.src = `${NESHAN_CDN_BASE}/index.js`;
      document.head.appendChild(script);
    }
  });
}

async function loadNeshanSdk(): Promise<any> {
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

export default function NeshanMapPicker({ latitude, longitude, onSelect, locale }: Props) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseError, setReverseError] = useState("");
  const mapKey = process.env.NEXT_PUBLIC_NESHAN_MAP_KEY;
  const selectedCenter: [number, number] = [
    longitude ?? DEFAULT_CENTER[0],
    latitude ?? DEFAULT_CENTER[1],
  ];

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!mapKey || !mapElement.current) return;
    let cancelled = false;
    let map: any;

    (async () => {
      try {
        const nmpMapboxgl = await loadNeshanSdk();
        if (cancelled || !mapElement.current) return;
        map = new nmpMapboxgl.Map({
          mapType: nmpMapboxgl.Map.mapTypes.neshanVector,
          container: mapElement.current,
          mapKey,
          center: selectedCenter,
          zoom: latitude && longitude ? 15 : 11,
        });
        mapRef.current = map;
        const marker = new nmpMapboxgl.Marker({ draggable: true })
          .setLngLat(selectedCenter)
          .addTo(map);
        markerRef.current = marker;
        const select = (event: any) => {
          const coordinates = event.lngLat ?? marker.getLngLat();
          marker.setLngLat([coordinates.lng, coordinates.lat]);
          onSelectRef.current({ latitude: coordinates.lat, longitude: coordinates.lng });
        };
        map.on("click", select);
        marker.on("dragend", () => select({ lngLat: marker.getLngLat() }));
        setMapReady(true);
      } catch (error) {
        console.error("Neshan map failed to initialize", error);
        setMapError(locale === "fa" ? "نقشه بارگذاری نشد." : "The map could not be loaded.");
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // The map should initialize once for each configured key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapKey]);

  useEffect(() => {
    if (mapReady && markerRef.current && latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current?.flyTo({ center: [longitude, latitude] });
    }
  }, [latitude, longitude, mapReady]);

  const reverseGeocode = async () => {
    const marker = markerRef.current;
    if (!marker || !mapKey) return;
    const point = marker.getLngLat();
    setReverseLoading(true);
    setReverseError("");
    try {
      const response = await fetch(
        `https://api.neshan.org/v5/reverse?lat=${point.lat}&lng=${point.lng}`,
        { headers: { "Api-Key": mapKey } },
      );
      if (!response.ok) throw new Error("Reverse geocoding failed");
      const result = await response.json();
      onSelect({
        latitude: point.lat,
        longitude: point.lng,
        address: result.formatted_address ?? result.address,
        city: result.city,
        province: result.state,
      });
    } catch {
      setReverseError(locale === "fa" ? "آدرس از روی نقطه پیدا نشد." : "The address could not be resolved.");
      onSelect({ latitude: point.lat, longitude: point.lng });
    } finally {
      setReverseLoading(false);
    }
  };

  if (!mapKey) {
    return (
      <div className="rounded-2xl border border-dashed border-amber-400/70 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold"><TriangleAlert size={17} />{locale === "fa" ? "کلید نقشه تنظیم نشده است" : "Neshan map key is not configured"}</div>
        <p className="mt-2 text-xs leading-6">{locale === "fa" ? "برای فعال‌سازی نقشه، NEXT_PUBLIC_NESHAN_MAP_KEY را در محیط فرانت‌اند تنظیم کنید." : "Set NEXT_PUBLIC_NESHAN_MAP_KEY in the frontend environment to enable the map."}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden h-100 rounded-2xl border border-border bg-background">
      <div ref={mapElement} className="h-64 w-full sm:h-80" />
      {!mapReady && !mapError && <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground"><Loader2 size={15} className="animate-spin" />{locale === "fa" ? "در حال بارگذاری نقشه..." : "Loading map..."}</div>}
      {mapError && <p className="px-4 py-3 text-xs font-bold text-rose-600">{mapError}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={15} className="text-accent" />{locale === "fa" ? "نشانگر را جابه‌جا کنید یا روی نقشه بزنید." : "Move the marker or click the map."}</p>
        <button type="button" onClick={reverseGeocode} disabled={!mapReady || reverseLoading} className="rounded-full bg-foreground px-4 py-2 text-xs font-bold text-background disabled:opacity-50">
          {reverseLoading ? <Loader2 size={14} className="animate-spin" /> : locale === "fa" ? "ثبت آدرس این نقطه" : "Use this address"}
        </button>
      </div>
      {reverseError && <p className="px-4 pb-3 text-xs font-bold text-rose-600">{reverseError}</p>}
    </div>
  );
}
