import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../db/settings';

export const useCurrency = () => {
  const [currency, setCurrencyState] = useState<string>('RWF');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSetting('currency').then((saved) => {
      if (saved) setCurrencyState(saved);
      setIsLoading(false);
    });
  }, []);

  const setCurrency = async (code: string): Promise<void> => {
    await setSetting('currency', code);
    setCurrencyState(code);
  };

  return { currency, setCurrency, isLoading };
};
