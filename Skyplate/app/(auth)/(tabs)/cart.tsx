import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import PaymentFooter from '../../../components/PaymentFooter';
import CartItem from '../../../components/CartItem';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import Screen from '@/components/ui/Screen';
import EmptyState from '@/components/ui/EmptyState';

const CartScreen = () => {
  const [orderType, setOrderType] = useState('');
  const CartList = useStore((state: any) => state.CartList);
  const CartPrice = useStore((state: any) => state.CartPrice);
  const incrementCartItemQuantity = useStore((state: any) => state.incrementCartItemQuantity);
  const decrementCartItemQuantity = useStore((state: any) => state.decrementCartItemQuantity);
  const router = useRouter();

  const handleContinue = () => {
    if (!orderType) {
      Toast.show({ type: 'error', text1: 'Choose an order type', text2: 'Select Delivery or Dine In' });
      return;
    }
    if (orderType === 'Delivery') {
      router.push({ pathname: '/delivery', params: { orderType, isDelivery: 'true' } });
    } else {
      router.push({ pathname: '/delivery', params: { orderType, isDelivery: 'false' } });
    }
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <HeaderBar title="Cart" />
        <View style={styles.toggle}>
          {['Delivery', 'Dine In'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.option, orderType === type && styles.optionOn]}
              onPress={() => setOrderType(type)}
            >
              <Text style={styles.optionText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {CartList.length === 0 ? (
          <EmptyState title="Your cart is empty" subtitle="Add dishes from the menu to get started." icon="cart-outline" />
        ) : (
          <View style={styles.list}>
            {CartList.map((data: any) => (
              <TouchableOpacity
                key={data.id}
                onPress={() => router.push({ pathname: '/details', params: { id: data.id, type: data.type } })}
              >
                <CartItem
                  id={data.id}
                  name={data.name}
                  imagelink={data.imagelink}
                  special_ingredient={data.special_ingredient}
                  roasted={data.roasted}
                  prices={data.prices}
                  type={data.type}
                  incrementCartItemQuantityHandler={incrementCartItemQuantity}
                  decrementCartItemQuantityHandler={decrementCartItemQuantity}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      {CartList.length !== 0 ? (
        <PaymentFooter buttonPressHandler={handleContinue} buttonTitle="Continue" price={{ price: CartPrice, currency: 'Rs' }} />
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: SPACING.space_24 },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_20,
    backgroundColor: COLORS.elevated,
    borderRadius: 14,
    padding: 4,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionOn: {
    backgroundColor: COLORS.primaryRedHex,
  },
  optionText: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_14,
  },
  list: {
    paddingHorizontal: SPACING.space_20,
    gap: SPACING.space_16,
  },
});

export default CartScreen;
