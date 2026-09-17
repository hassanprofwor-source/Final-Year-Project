import { describe, expect, it } from '@jest/globals';
import { optimizedImageUrl } from '../lib/media';

describe('image URLs', () => {
  it('crops Unsplash seed photos to a square', () => {
    const url = optimizedImageUrl('https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', 480);
    expect(url).toContain('fit=crop');
    expect(url).toContain('w=480');
    expect(url).toContain('h=480');
  });

  it('leaves empty or invalid values blank', () => {
    expect(optimizedImageUrl(undefined)).toBe('');
    expect(optimizedImageUrl('undefined')).toBe('');
  });
});
