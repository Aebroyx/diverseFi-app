import { useQuery } from '@tanstack/react-query';
import { searchService, GlobalSearchResult } from '@/services/searchService';

export function useGlobalSearch(query: string) {
  return useQuery<GlobalSearchResult, Error>({
    queryKey: ['globalSearch', query],
    queryFn: () => searchService.globalSearch(query),
    enabled: query.length >= 3, // Only search when query has at least 3 characters
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
}
