import { describe, expect, it } from '@jest/globals';
import { resolveApiUrl } from '../constants/apiUrl';

describe('resolveApiUrl', () => {
  it('uses the current Metro LAN host when the configured API is a local IP', () => {
    expect(resolveApiUrl('http://192.168.1.11:5000', '192.168.1.7:8081')).toBe(
      'http://192.168.1.7:5000',
    );
  });

  it('keeps a deployed API URL even when Metro is running on LAN', () => {
    expect(resolveApiUrl('https://api.skyplate.example', '192.168.1.7:8081')).toBe(
      'https://api.skyplate.example',
    );
  });
});
