import { describe, expect, it } from '@jest/globals';
import { CURRENCY_CODE, formatAmount, formatMoney } from '../lib/currency';

describe('currency helpers', () => {
  it('M01 formats null as £0.00', () => {
    expect(formatMoney(null)).toBe('£0.00');
  });

  it('M02 formats 8 as £8.00', () => {
    expect(formatMoney(8)).toBe('£8.00');
  });

  it('formats seeded one-decimal prices to two places', () => {
    expect(formatAmount(8.9)).toBe('8.90');
    expect(formatMoney(5.5)).toBe('£5.50');
  });

  it('M03 uses gbp as the currency code', () => {
    expect(CURRENCY_CODE).toBe('gbp');
  });
});
