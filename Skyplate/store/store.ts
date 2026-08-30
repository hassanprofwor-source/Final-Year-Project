import { create } from 'zustand';
import { produce } from 'immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { api, apiErrorMessage } from '@/lib/api';

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
            let found = false;
            for (let i = 0; i < state.CartList.length; i++) {
              if (state.CartList[i].id == cartItem.id) {
                found = true;
                let size = false;
                for (let j = 0; j < state.CartList[i].prices.length; j++) {
                  if (state.CartList[i].prices[j].size == cartItem.prices[0].size) {
                    size = true;
                    state.CartList[i].prices[j].quantity++;
                    break;
                  }
                }
                if (size == false) {
                  state.CartList[i].prices.push(cartItem.prices[0]);
                }
                state.CartList[i].prices.sort((a: any, b: any) => {
                  if (a.size > b.size) return -1;
                  if (a.size < b.size) return 1;
                  return 0;
                });
                break;
              }
            }
            if (found == false) {
              state.CartList.push(cartItem);
            }
          }),
        ),
      calculateCartPrice: () =>
        set(
          produce((state: any) => {
            let totalprice = 0;
            for (let i = 0; i < state.CartList.length; i++) {
              let tempprice = 0;
              for (let j = 0; j < state.CartList[i].prices.length; j++) {
                tempprice =
                  tempprice +
                  parseFloat(state.CartList[i].prices[j].price) *
                    state.CartList[i].prices[j].quantity;
              }
              state.CartList[i].ItemPrice = tempprice.toString();
              totalprice = totalprice + tempprice;
            }
            state.CartPrice = totalprice.toString();
          }),
        ),
      incrementCartItemQuantity: (id: string, size: string) =>
        set(
          produce((state: any) => {
            for (let i = 0; i < state.CartList.length; i++) {
              if (state.CartList[i].id == id) {
                for (let j = 0; j < state.CartList[i].prices.length; j++) {
                  if (state.CartList[i].prices[j].size == size) {
                    state.CartList[i].prices[j].quantity++;
                    break;
                  }
                }
              }
            }
          }),
        ),
      decrementCartItemQuantity: (id: string, size: string) =>
        set(
          produce((state: any) => {
            for (let i = 0; i < state.CartList.length; i++) {
              if (state.CartList[i].id == id) {
                for (let j = 0; j < state.CartList[i].prices.length; j++) {
                  if (state.CartList[i].prices[j].size == size) {
                    if (state.CartList[i].prices.length > 1) {
                      if (state.CartList[i].prices[j].quantity > 1) {
                        state.CartList[i].prices[j].quantity--;
                      } else {
                        state.CartList[i].prices.splice(j, 1);
                      }
                    } else if (state.CartList[i].prices[j].quantity > 1) {
                      state.CartList[i].prices[j].quantity--;
                    } else {
                      state.CartList.splice(i, 1);
                    }
                    break;
                  }
                }
              }
            }
          }),
        ),
      emptyCart: () =>
        set(
          produce((state: any) => {
            state.CartList = [];
            state.CartPrice = '0';
          }),
        ),
    }),
    {
      name: 'skyplate',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
