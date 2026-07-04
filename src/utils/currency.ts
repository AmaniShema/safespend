export const CURRENCIES = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
];

export const formatCurrency = (
  amount: number,
  currencyCode: string = 'RWF'
): string => {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  if (!currency) return `${amount.toLocaleString()}`;

  if (currencyCode === 'RWF') {
    return `RWF ${Math.round(amount).toLocaleString('en-US')}`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
};
