import { useQuery } from '@tanstack/react-query';
import { getTodaySummary } from '../api/summary';

export function useSummary() {
  const tzOffset = new Date().getTimezoneOffset();
  return useQuery({
    queryKey: ['summary', tzOffset],
    queryFn: async () => await getTodaySummary(tzOffset),
  });
}
