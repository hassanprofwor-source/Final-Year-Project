import { describe, expect, it } from '@jest/globals';
import { CURRENCY_CODE, formatMoney } from '../lib/currency';

describe('currency helpers', () => {
  it('M01 formats null as £0', () => {
    expect(formatMoney(null)).toBe('£0');
  });

  it('M02 formats 8 as £8', () => {
    expect(formatMoney(8)).toBe('£8');
  });

  it('M03 uses gbp as the currency code', () => {
    expect(CURRENCY_CODE).toBe('gbp');
  });
});
