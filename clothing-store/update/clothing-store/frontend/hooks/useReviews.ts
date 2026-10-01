import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createProductReview,
  getProductReviews,
} from "@/services/review.service";

export function useProductReviews(slug: string) {
  return useQuery({
    queryKey: ["product-reviews", slug],
    queryFn: () => getProductReviews(slug),
    retry: 1,
  });
}

export function useCreateProductReview(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { rating: number; title?: string; body: string }) =>
      createProductReview(slug, payload),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["product-reviews", slug] });
      queryClient.invalidateQueries({ queryKey: ["catalog-product", slug] });
    },
  });
}
