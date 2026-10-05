"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import ProductDetail from "@/components/catalog/ProductDetail";

function ProductPageContent() {
  const params = useParams<{ slug: string }>();
  return <ProductDetail slug={params.slug} />;
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh]" />}>
      <ProductPageContent />
    </Suspense>
  );
}
