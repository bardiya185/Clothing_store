import { useQuery } from "@tanstack/react-query";
import { getActiveCampaigns } from "@/services/campaign.service";
import type { Locale } from "@/lib/product";

export function useActiveCampaigns(locale: Locale) {
  return useQuery({
    queryKey: ["active-campaigns", locale],
    queryFn: () => getActiveCampaigns(locale),
    staleTime: 60_000,
    retry: 1,
  });
}
