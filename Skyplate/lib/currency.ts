export const CURRENCY_SYMBOL = '£';
export const CURRENCY_CODE = 'gbp';

export const formatAmount = (amount: number | string | null | undefined) => {
  const value = Number(amount);
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
};

export const formatMoney = (amount: number | string | null | undefined) =>
  `${CURRENCY_SYMBOL}${formatAmount(amount)}`;
