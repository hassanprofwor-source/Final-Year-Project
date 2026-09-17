import { describe, expect, it } from '@jest/globals';
import { addCartItem, calculateCartTotals, decrementCartItem, incrementCartItem } from '../lib/cart';

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

    expect(cartPrice).toBe('31.00');
    expect(cartList[0].ItemPrice).toBe('20.00');
    expect(cartList[1].ItemPrice).toBe('11.00');
  });

  it('recalculates the total when a line is decremented or removed', () => {
    const cart = [
      { id: 'a', prices: [{ size: 'M', price: '10', quantity: 2 }] },
      { id: 'b', prices: [{ size: 'L', price: '5.5', quantity: 1 }] },
    ];

    const reduced = decrementCartItem(cart, 'a', 'M');
    expect(calculateCartTotals(reduced).cartPrice).toBe('15.50');

    const removed = decrementCartItem(reduced, 'b', 'L');
    expect(removed).toHaveLength(1);
    expect(calculateCartTotals(removed).cartPrice).toBe('10.00');
  });

  it('increments quantity and the running total', () => {
    const cart = [{ id: 'a', prices: [{ size: 'M', price: '8.9', quantity: 1 }] }];
    const next = incrementCartItem(cart, 'a', 'M');
    expect(next[0].prices[0].quantity).toBe(2);
    expect(calculateCartTotals(next).cartPrice).toBe('17.80');
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
