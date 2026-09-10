export type CartPriceLine = {
  size: string;
  price: string | number;
  quantity: number;
};

export type CartItem = {
  id: string;
  prices: CartPriceLine[];
  ItemPrice?: string;
  [key: string]: unknown;
};

export const addCartItem = (cartList: CartItem[], cartItem: CartItem): CartItem[] => {
  const next = cartList.map((item) => ({
    ...item,
    prices: item.prices.map((line) => ({ ...line })),
  }));

  const incoming = cartItem.prices[0];
  const existing = next.find((item) => item.id == cartItem.id);

  if (!existing) {
    next.push({
      ...cartItem,
      prices: cartItem.prices.map((line) => ({ ...line })),
    });
    return next;
  }

  const sameSize = existing.prices.find((line) => line.size == incoming.size);
  if (sameSize) {
    sameSize.quantity++;
  } else {
    existing.prices.push({ ...incoming });
  }

  existing.prices.sort((a, b) => {
    if (a.size > b.size) return -1;
    if (a.size < b.size) return 1;
    return 0;
  });

  return next;
};

export const calculateCartTotals = (cartList: CartItem[]) => {
  let totalprice = 0;
  const next = cartList.map((item) => {
    let tempprice = 0;
    for (const line of item.prices) {
      tempprice += parseFloat(String(line.price)) * line.quantity;
    }
    totalprice += tempprice;
    return { ...item, ItemPrice: tempprice.toString() };
  });

  return { cartList: next, cartPrice: totalprice.toString() };
};
