import { describe, expect, it } from '@jest/globals';
import { pathFromPushScreen } from '../lib/pushRoute';

describe('push notification routes', () => {
  it('M09 maps accepted and pending screens', () => {
    expect(pathFromPushScreen('accepted')).toBe('/accepted');
    expect(pathFromPushScreen('pending')).toBe('/pending');
  });

  it('M10 maps home and ignores an unknown screen', () => {
    expect(pathFromPushScreen('home')).toBe('/home');
    expect(pathFromPushScreen('unknown')).toBeNull();
    expect(pathFromPushScreen(undefined)).toBeNull();
  });
});
