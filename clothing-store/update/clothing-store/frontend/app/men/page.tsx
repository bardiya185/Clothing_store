import { Suspense } from "react";
import ShopView from "@/components/catalog/ShopView";

export default function MenPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto min-h-[70vh] max-w-[1440px] px-5 py-20" />
      }
    >
      <ShopView initialGender="men" />
    </Suspense>
  );
}
