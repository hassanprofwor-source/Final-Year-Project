import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';
import ActiveDeliveryCard from '@/components/ActiveDeliveryCard';
import { useOrderWatch } from '@/hooks/useOrderWatch';
import { api, apiErrorMessage } from '@/lib/api';

const Pending = () => {
  const { user } = useUser();
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const email = user?.primaryEmailAddress?.emailAddress;

  const loadOrder = async () => {
    if (!email) return;
    try {
      const response = await api.get(
        `/api/v1/order/getOrderDelivery/${encodeURIComponent(email)}`,
      );
      const pending = response.data.data?.pending;
      const accepted = response.data.data?.accepted;
      if (accepted) {
        router.replace('/accepted');
        return;
      }
      setOrder(pending || null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not load order',
        text2: apiErrorMessage(error),
      });
      setOrder(null);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [email]);

  useOrderWatch(email, ({ pending, accepted }) => {
    if (accepted) router.replace('/accepted');
    else if (loaded && !pending) router.replace('/home');
  });

  const cancelOrder = async () => {
    if (!email) return;
    setCancelling(true);
    try {
      await api.post('/api/v1/order/cancelPending', { email, orderType: 'Delivery' });
      Toast.show({ type: 'success', text1: 'Order cancelled' });
      router.replace('/home');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not cancel',
        text2: apiErrorMessage(error, 'Try again'),
      });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Screen>
      <StackHeader title="Order pending" onBack={() => router.replace('/home')} />
      {!loaded ? (
        <LoadingState label="Loading your order" />
      ) : !order ? (
        <EmptyState
          title="No pending order"
          subtitle="If you just placed one, go back to Home and try again."
          icon="receipt-outline"
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ActiveDeliveryCard order={order} />
          <Text style={styles.hint}>The restaurant has not accepted this order yet.</Text>
          <View style={styles.actions}>
            <Button
              title="Cancel this order"
              variant="outline"
              loading={cancelling}
              onPress={cancelOrder}
            />
          </View>
        </ScrollView>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  hint: {
    textAlign: 'center',
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.regular,
    fontSize: FONTSIZE.size_14,
    marginTop: SPACING.space_16,
    paddingHorizontal: SPACING.space_20,
  },
  actions: { paddingHorizontal: SPACING.space_20, marginTop: SPACING.space_20 },
});

export default Pending;
