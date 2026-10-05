"use client";

import type { ReactNode } from "react";
import DatePicker from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import gregorian from "react-date-object/calendars/gregorian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian_en from "react-date-object/locales/gregorian_en";
import { CalendarClock, Info } from "lucide-react";
import { describeDateTime } from "@/lib/admin-content";
import { getLocaleConfig } from "@/lib/i18n";
import "react-multi-date-picker/styles/colors/purple.css";

export function AdminField({
  label,
  hint,
  required = false,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-bold ${className}`}>
      <span className="flex items-center gap-1.5">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && (
          <span className="group relative inline-flex text-slate-400" title={hint}>
            <Info size={14} />
            <span className="pointer-events-none absolute start-0 top-6 z-10 hidden w-64 rounded-xl bg-slate-900 p-2.5 text-[11px] font-normal leading-5 text-white shadow-xl group-hover:block">
              {hint}
            </span>
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

export function AdminDateTimeField({
  label,
  value,
  onChange,
  locale,
  hint,
  required = false,
  min,
}: {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  locale: string;
  hint?: string;
  required?: boolean;
  min?: string;
}) {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
  const previewLocale = locale === "fa" ? "fa-IR" : "en-US";
  const localeConfig = getLocaleConfig(locale);
  const calendar = localeConfig.calendar === "persian" ? persian : gregorian;
  const calendarLocale = localeConfig.calendar === "persian" ? persian_fa : gregorian_en;
  const displayFormat = localeConfig.calendar === "persian" ? "YYYY/MM/DD HH:mm" : "YYYY-MM-DD HH:mm";
  const selectedDate = value ? new DateObject(new Date(value)) : undefined;
  const minDate = min ? new DateObject(new Date(min)) : undefined;

  const handleChange = (date: DateObject | null) => {
    onChange(date?.toDate().toISOString() ?? null);
  };

  return (
    <AdminField label={label} hint={hint} required={required}>
      <div className="relative admin-date-picker" dir="ltr">
        <CalendarClock className="pointer-events-none absolute start-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={16} />
        <DatePicker
          value={selectedDate}
          onChange={handleChange}
          calendar={calendar}
          locale={calendarLocale}
          format={displayFormat}
          minDate={minDate}
          calendarPosition="bottom-right"
          editable={false}
          portal
          plugins={[<TimePicker key="time-picker" position="bottom" />]}
          containerClassName="w-full"
          inputClass="admin-date-input"
          placeholder={locale === "fa" ? "انتخاب تاریخ و ساعت" : "Choose date and time"}
        />
      </div>
      <span className="text-[11px] font-normal leading-5 text-slate-500">
        {value ? `${describeDateTime(value, previewLocale)} · ${browserTimezone}` : `${browserTimezone} · ${locale === "fa" ? "زمان محلی مرورگر" : "Your browser local time"}`}
      </span>
    </AdminField>
  );
}

export function HelpCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs leading-6 text-slate-600">
      <p className="font-black text-sky-800">{title}</p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}
