import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../../theme/theme';
import StackHeader from '@/components/ui/StackHeader';
import Screen from '@/components/ui/Screen';
import PaymentMethod from '../../components/PaymentMethod';
import PaymentFooter from '../../components/PaymentFooter';
import { LinearGradient } from 'expo-linear-gradient';
import CustomIcon from '../../components/CustomIcon';
import { useStore } from '../../store/store';
import PopUpAnimation from '../../components/PopUpAnimation';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/expo';
import { useStripe } from '@stripe/stripe-react-native';
import Toast from 'react-native-toast-message';
import { api, apiErrorMessage } from '@/lib/api';
const PaymentList = [
  {
    name: 'Cash on Delivery',
    icon: 'icon',
    isIcon: true,
  },
];

const PaymentScreen = () => {
  const CartList = useStore((state: any) => state.CartList);
  const CartPrice = useStore((state: any) => state.CartPrice);
  const emptyCart = useStore((state: any) => state.emptyCart);
  const { orderType, phone, address } = useLocalSearchParams();
  const { user } = useUser();
  const router = useRouter();
  const [paymentMode, setPaymentMode] = useState('Pay With Card');
  const [showAnimation, setShowAnimation] = useState(false);
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);

  const formattedCartItems = CartList.flatMap((item: any) =>
    item.prices.map((p: any) => ({
      name: item.name,
      image: item.imagelink,
      size: p.size,
      quantity: p.quantity,
      price: p.price,
    }))
  );

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const fetchPaymentSheetParams = async () => {
    const response = await api.post('/api/v1/order/create-order-payment-delivery', {
      CartPrice,
      email: user?.primaryEmailAddress?.emailAddress,
    });
    const { paymentIntent, ephemeralKey, customer } = response.data;

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  };

  const initializePaymentSheet = async () => {
    const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

    const { error } = await initPaymentSheet({
      merchantDisplayName: 'Skyplate',
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      allowsDelayedPaymentMethods: true,
      defaultBillingDetails: {
        name: (user?.fullName ?? undefined) as string | undefined,
      },
    });

    if (error) {
      throw new Error(error.message || 'Could not open card payment');
    }
  };

  const finishOrderSuccess = () => {
    emptyCart();
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
      router.replace('/home');
    }, 2000);
  };

  const handlePayment = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);

    try {
      if (!orderType || !phone || !address) {
        Toast.show({
          type: 'error',
          text1: 'Missing Info',
          text2: 'Some Order Details are missing like Phone number or Address',
        });
        return;
      }

      const response = await api.get(
        `/api/v1/order/getOrder/${user?.primaryEmailAddress?.emailAddress}`
      );
      const pending = response.data.data?.pending || [];
      const accepted = response.data.data?.accepted || [];

      if (pending.length > 0 || accepted.length > 0) {
        Toast.show({
          type: 'error',
          text1: 'You already have an open order',
          text2: 'Open it from Home, or cancel it from the pending screen.',
        });
        router.replace(accepted.length > 0 ? '/accepted' : '/pending');
        return;
      }

      if (paymentMode === 'Pay With Card') {
        Toast.show({
          type: 'info',
          text1: 'Opening card payment',
        });
        await initializePaymentSheet();
        const { error } = await presentPaymentSheet();

        if (error) {
          Toast.show({
            type: 'info',
            text1: 'Payment cancelled',
            text2: error.message || 'Transaction was not completed',
          });
          return;
        }

        const formData = new FormData();
        formData.append('email', String(user?.primaryEmailAddress?.emailAddress || ''));
        formData.append('phone', String(phone));
        formData.append('address', String(address));
        formData.append('orderType', String(orderType));
        formData.append('payment', 'Paid');
        formData.append('total', String(CartPrice));
        formData.append('cartItems', JSON.stringify(formattedCartItems));

        await api.post('/api/v1/order/saveOrder', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finishOrderSuccess();
        return;
      }

      const formData = new FormData();
      formData.append('email', String(user?.primaryEmailAddress?.emailAddress || ''));
      formData.append('phone', String(phone));
      formData.append('address', String(address));
      formData.append('orderType', String(orderType));
      formData.append('payment', 'Cash on Delivery');
      formData.append('total', String(CartPrice));
      formData.append('cartItems', JSON.stringify(formattedCartItems));

      await api.post('/api/v1/order/saveOrder', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Toast.show({
        type: 'success',
        text1: 'Order placed',
        text2: 'Your order has been sent to the restaurant.',
      });
      finishOrderSuccess();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not complete payment',
        text2: apiErrorMessage(error, 'Please try again'),
      });
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };


  return (
    <Screen>
      {showAnimation ? (
        <PopUpAnimation
          style={styles.LottieAnimation}
          source={require('../../lottie/Successful.json')}
        />
      ) : null}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.ScrollViewFlex}>
        <StackHeader title="Payment" />

            <View style={styles.PaymentOptionsContainer}>
              <TouchableOpacity
                onPress={() => {
                  setPaymentMode('Pay With Card');

                }}>
                <View
                  style={[
                    styles.CreditCardContainer,
                    {
                      borderColor:
                        paymentMode == 'Pay With Card'
                          ? COLORS.WhiteRGBA75
                          : COLORS.WhiteRGBA15,
                    },
                  ]}>
                  <Text style={styles.CreditCardTitle}>Debit Card</Text>
                  <View style={styles.CreditCardBG}>
                    <LinearGradient
                      start={{ x: 1, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.LinearGradientStyle}
                      colors={[COLORS.Grey, COLORS.Black]}>
                      <View style={styles.CreditCardRow}>
                        <CustomIcon
                          name="chip"
                          size={FONTSIZE.size_20 * 2}
                          color={COLORS.primaryOrangeHex}
                        />
                        <CustomIcon
                          name="visa"
                          size={FONTSIZE.size_30 * 2}
                          color={COLORS.primaryWhiteHex}
                        />
                      </View>
                      <View style={styles.CreditCardNumberContainer}>
                        <Text style={styles.CreditCardNumber}>XXXX</Text>
                        <Text style={styles.CreditCardNumber}>XXXX</Text>
                        <Text style={styles.CreditCardNumber}>XXXX</Text>
                        <Text style={styles.CreditCardNumber}>8729</Text>
                      </View>
                      <View style={styles.CreditCardRow}>
                        <View style={styles.CreditCardNameContainer}>
                          <Text style={styles.CreditCardNameSubitle}>
                            Card Holder Name
                          </Text>
                          <Text style={styles.CreditCardNameTitle}>
                            {user?.fullName}
                          </Text>
                        </View>
                        <View style={styles.CreditCardDateContainer}>
                          <Text style={styles.CreditCardNameSubitle}>
                            Expiry Date
                          </Text>
                          <Text style={styles.CreditCardNameTitle}>02/30</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
              {PaymentList.map((data) => (
                <TouchableOpacity key={data.name} onPress={() => setPaymentMode(data.name)}>
                  <PaymentMethod
                    paymentMode={paymentMode}
                    name={data.name}
                    icon={data.icon}
                    isIcon={data.isIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <PaymentFooter
            buttonTitle={busy ? 'Please wait…' : `${paymentMode}`}
            price={{ price: CartPrice, currency: 'Rs' }}
            buttonPressHandler={handlePayment}
            disabled={busy}
          />
    </Screen>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  ScreenContainer: {
    flex: 1,
  },
  LottieAnimation: {
    flex: 1,
  },
  ScrollViewFlex: {
    flexGrow: 1,
  },
  HeaderContainer: {
    paddingHorizontal: SPACING.space_24,
    paddingVertical: SPACING.space_15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  HeaderText: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_20,
    color: COLORS.primaryWhiteHex,
  },
  EmptyView: {
    height: SPACING.space_36,
    width: SPACING.space_36,
  },
  PaymentOptionsContainer: {
    padding: SPACING.space_15,
    gap: SPACING.space_15,
  },
  CreditCardContainer: {
    padding: SPACING.space_10,
    gap: SPACING.space_10,
    borderRadius: BORDERRADIUS.radius_15 * 2,
    borderWidth: 3,
  },
  CreditCardTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryWhiteHex,
    marginLeft: SPACING.space_10,
  },
  CreditCardBG: {
    backgroundColor: COLORS.primaryGreyHex,
    borderRadius: BORDERRADIUS.radius_25,
  },
  LinearGradientStyle: {
    borderRadius: BORDERRADIUS.radius_25,
    gap: SPACING.space_36,
    paddingHorizontal: SPACING.space_15,
    paddingVertical: SPACING.space_10,
  },
  CreditCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  CreditCardNumberContainer: {
    flexDirection: 'row',
    gap: SPACING.space_10,
    alignItems: 'center',
  },
  CreditCardNumber: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
    letterSpacing: SPACING.space_4,
  },
  CreditCardNameSubitle: {
    fontFamily: FONTFAMILY.poppins_regular,
    fontSize: FONTSIZE.size_12,
    color: COLORS.secondaryLightGreyHex,
  },
  CreditCardNameTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  CreditCardNameContainer: {
    alignItems: 'flex-start',
  },
  CreditCardDateContainer: {
    alignItems: 'flex-end',
  },
  webViewContainer: {
    flex: 1, // Makes sure the WebView container takes the full height
  },
  webView: {
    flex: 1, // Makes sure the WebView fills the container
  },
});

export default PaymentScreen;
