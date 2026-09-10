import { describe, expect, it } from '@jest/globals';
import { formatPhone, isValidPkPhone } from '../lib/phone';

describe('Pakistan phone helpers', () => {
  it('M07 accepts 0300-1234567', () => {
    expect(formatPhone('03001234567')).toBe('0300-1234567');
    expect(isValidPkPhone('0300-1234567')).toBe(true);
  });

  it('M08 rejects a short or missing-dash number', () => {
    expect(isValidPkPhone('0300')).toBe(false);
    expect(isValidPkPhone('03001234567')).toBe(false);
    expect(isValidPkPhone('0300-123')).toBe(false);
  });
});
