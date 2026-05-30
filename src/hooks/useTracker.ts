import { useState, useEffect, useCallback } from 'react';
import { getConsumptionData, type ConsumptionRecord } from '../db/tracker';

interface UseTrackerReturn {
  records: ConsumptionRecord[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export const useTracker = (): UseTrackerReturn => {
  const [records, setRecords] = useState<ConsumptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getConsumptionData();
      setRecords(data);
    } catch (err) {
      console.error('Tracker error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { records, isLoading, refresh };
};
