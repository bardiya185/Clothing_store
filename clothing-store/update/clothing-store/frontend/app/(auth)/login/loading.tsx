// app/loading.tsx

export default function Loading() {
  return (
    <div className=" z-9999 justify-center bg-[#f8f7f4] text-slate-900 animate-page-entry">
      {/* لوگوی متحرک برند */}
      <div className="flex flex-col items-center gap-4">
        {/* اسم لوگو با انیمیشن نبض نرم */}
        <h1 className="text-4xl md:text-5xl font-black tracking-[0.3em] uppercase animate-pulse">
          URBAN
        </h1>

        <p className="text-xs text-gray-500 font-medium tracking-widest">
          درحال بارگذاری ...
        </p>

        {/* نوار پیشرفت (Progress Bar) خطی و خیلی شیک */}
        <div className="w-36 h-[2px] bg-gray-200 rounded-full overflow-hidden mt-2 relative">
          <div className="absolute top-0 bottom-0 bg-black w-full -translate-x-full animate-[loadingLine_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
