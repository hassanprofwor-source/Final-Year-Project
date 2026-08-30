import { ScrollView, StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/store';
import { COLORS, SPACING } from '../../theme/theme';
import OrderHistoryCard from '../../components/OrderHistoryCard';
import { useUser } from '@clerk/expo';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';

const OrderHistoryScreen = () => {
  const { user } = useUser();
  const fetchCompletedOrders = useStore((state: any) => state.fetchCompletedOrders);
  const OrderHistoryList = useStore((state: any) => state.OrderHistoryList);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCompletedOrders(user?.primaryEmailAddress?.emailAddress);
      setLoading(false);
    };
    load();
  }, [fetchCompletedOrders, user]);

  return (
    <Screen>
      <StackHeader title="Order history" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <LoadingState label="Loading orders" />
        ) : OrderHistoryList.length === 0 ? (
          <EmptyState title="No past orders" subtitle="Completed orders will show up here." icon="receipt-outline" />
        ) : (
          <View style={styles.list}>
            {OrderHistoryList.map((data: any, id: any) => (
              <OrderHistoryCard
                key={id.toString()}
                CartList={data.cartItems}
                CartListPrice={data.total}
                OrderDate={data.createdAt}
                history
                bookings={false}
                people={0}
                status=""
                time=""
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: SPACING.space_24 },
  list: { paddingHorizontal: SPACING.space_20, gap: SPACING.space_16 },
});

export default OrderHistoryScreen;
