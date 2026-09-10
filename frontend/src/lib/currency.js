export const CURRENCY_SYMBOL = "£";
export const CURRENCY_CODE = "gbp";

export const formatMoney = (amount) => `${CURRENCY_SYMBOL}${amount ?? 0}`;
