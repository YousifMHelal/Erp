import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/inventory/product-detail-view";
import { getCategoryOptions, getProductDetail } from "@/actions/inventory.actions";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, categoriesResult] = await Promise.all([getProductDetail(id), getCategoryOptions()]);
  if (!result.success) notFound();

  return (
    <ProductDetailView
      product={result.data.product}
      movements={result.data.movements}
      priceHistory={result.data.priceHistory}
      categoryOptions={categoriesResult.success ? categoriesResult.data : []}
    />
  );
}
