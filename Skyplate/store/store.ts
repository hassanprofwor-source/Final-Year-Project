import { create } from 'zustand';
import { produce } from 'immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { api, apiErrorMessage } from '@/lib/api';
import { addCartItem, calculateCartTotals, decrementCartItem, incrementCartItem } from '@/lib/cart';

export const useStore = create(
  persist(
    (set) => ({
      MenuList: [],
      CartPrice: 0,
      CartList: [],
      OrderHistoryList: [],
      TablesList: [],
      fetchMenu: async () => {
        try {
          const response = await api.get('/api/v1/menu/getFood');
          if (response.data.success) {
            set(
              produce((state: any) => {
                state.MenuList = response.data.data;
              }),
            );
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to fetch menu',
            });
          }
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: apiErrorMessage(error, 'Failed to fetch menu'),
          });
        }
      },
      fetchTableData: async () => {
        try {
          const response = await api.get('/api/v1/table/getTables');
          set(
            produce((state: any) => {
              state.TablesList = response.data.data;
            }),
          );
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: apiErrorMessage(error),
          });
        }
      },
      fetchCompletedOrders: async (emailAddress: any) => {
        if (!emailAddress) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Email address is required',
          });
          return;
        }

        try {
          const response = await api.get(`/api/v1/order/getCompleted/${emailAddress}`);
          if (response.data.success) {
            set(
              produce((state: any) => {
                state.OrderHistoryList = response.data.data;
              }),
            );
          } else {
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Failed to fetch completed orders',
            });
          }
        } catch (error: any) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: apiErrorMessage(error),
          });
        }
      },
      addToCart: (cartItem: any) =>
        set(
          produce((state: any) => {
            const { cartList, cartPrice } = calculateCartTotals(addCartItem(state.CartList, cartItem));
            state.CartList = cartList;
            state.CartPrice = cartPrice;
          }),
        ),
      calculateCartPrice: () =>
        set(
          produce((state: any) => {
            const { cartList, cartPrice } = calculateCartTotals(state.CartList);
            state.CartList = cartList;
            state.CartPrice = cartPrice;
          }),
        ),
      incrementCartItemQuantity: (id: string, size: string) =>
        set(
          produce((state: any) => {
            const { cartList, cartPrice } = calculateCartTotals(incrementCartItem(state.CartList, id, size));
            state.CartList = cartList;
            state.CartPrice = cartPrice;
          }),
        ),
      decrementCartItemQuantity: (id: string, size: string) =>
        set(
          produce((state: any) => {
            const { cartList, cartPrice } = calculateCartTotals(decrementCartItem(state.CartList, id, size));
            state.CartList = cartList;
            state.CartPrice = cartPrice;
          }),
        ),
      emptyCart: () =>
        set(
          produce((state: any) => {
            state.CartList = [];
            state.CartPrice = '0.00';
          }),
        ),
    }),
    {
      name: 'skyplate',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
