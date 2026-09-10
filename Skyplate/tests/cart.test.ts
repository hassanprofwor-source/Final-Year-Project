import { describe, expect, it } from '@jest/globals';
import { addCartItem, calculateCartTotals } from '../lib/cart';

const burger = (size: string, price: string, quantity = 1) => ({
  id: 'burger-1',
  name: 'Burger',
  prices: [{ size, price, quantity }],
});

describe('cart helpers', () => {
  it('M04 totals two lines as price times quantity', () => {
    const cart = [
      { id: 'a', prices: [{ size: 'M', price: '10', quantity: 2 }] },
      { id: 'b', prices: [{ size: 'L', price: '5.5', quantity: 2 }] },
    ];

    const { cartPrice, cartList } = calculateCartTotals(cart);

    expect(cartPrice).toBe('31');
    expect(cartList[0].ItemPrice).toBe('20');
    expect(cartList[1].ItemPrice).toBe('11');
  });

  it('M05 merges the same dish and size by increasing quantity', () => {
    const first = addCartItem([], burger('M', '8'));
    const merged = addCartItem(first, burger('M', '8'));

    expect(merged).toHaveLength(1);
    expect(merged[0].prices).toHaveLength(1);
    expect(merged[0].prices[0].quantity).toBe(2);
  });

  it('M06 keeps a different size as a new price line', () => {
    const first = addCartItem([], burger('M', '8'));
    const next = addCartItem(first, burger('L', '10'));

    expect(next).toHaveLength(1);
    expect(next[0].prices.map((line) => line.size)).toEqual(['M', 'L']);
    expect(next[0].prices.find((line) => line.size === 'M')?.quantity).toBe(1);
    expect(next[0].prices.find((line) => line.size === 'L')?.quantity).toBe(1);
  });
});
