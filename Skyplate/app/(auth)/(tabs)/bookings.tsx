import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { useUser } from '@clerk/expo';
import Toast from 'react-native-toast-message';
import { api, apiErrorMessage } from '@/lib/api';
import Screen from '@/components/ui/Screen';
import HeaderBar from '../../../components/HeaderBar';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';

const BookingsScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const [reservations, setReservations] = useState<any[]>([]);
  const [dineInOrders, setDineInOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const email = user?.primaryEmailAddress?.emailAddress;

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const [bookingsRes, dineRes] = await Promise.all([
        api.get(`/api/v1/booking/myBookings/${encodeURIComponent(email)}`),
        api.get(`/api/v1/order/getOrderDine/${encodeURIComponent(email)}`).catch(() => ({ data: { success: false } })),
      ]);
      setReservations(bookingsRes.data.data || []);
      if (dineRes.data.success) {
        const pending = dineRes.data.data.pending || [];
        const accepted = dineRes.data.data.accepted || [];
        setDineInOrders([...pending, ...accepted]);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const cancelBooking = async (booking: any) => {
    if (!email) return;
    setCancellingId(booking._id);
    try {
      await api.post('/api/v1/booking/cancelMyBooking', { id: booking._id, email });
      Toast.show({
        type: 'success',
        text1: 'Reservation cancelled',
        text2: 'The £10 reservation fee is non-refundable.',
      });
      setReservations((current) =>
        current.map((item) => (item._id === booking._id ? { ...item, status: 'Cancelled' } : item)),
      );
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not cancel',
        text2: apiErrorMessage(error, 'Try again'),
      });
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (status: string) => status === 'Pending' || status === 'Confirmed';

  return (
    <Screen>
      <HeaderBar title="Bookings" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={{ paddingHorizontal: SPACING.space_20, marginBottom: SPACING.space_16 }}>
          <Button title="Reserve a table" onPress={() => router.push('/reserve')} />
        </View>
        {loading ? (
          <LoadingState label="Loading bookings" />
        ) : reservations.length === 0 ? (
          <EmptyState title="No reservations" subtitle="Book a table for later from the button above." icon="calendar-outline" />
        ) : (
          <View style={styles.list}>
            {reservations.map((booking: any) => (
              <View key={booking._id} style={styles.card}>
                <Text style={styles.title}>Table {booking.tableNumber}</Text>
                <Text style={styles.meta}>{booking.date} · {booking.time} · {booking.people} guests</Text>
                {booking.paymentStatus === 'paid' ? (
                  <Text style={styles.fee}>£10 fee paid — deducted from your bill</Text>
                ) : null}
                <Text style={[styles.status, booking.status === 'Cancelled' && styles.statusCancelled]}>
                  {booking.status}
                </Text>
                {canCancel(booking.status) ? (
                  <View style={styles.actions}>
                    <Button
                      title="Cancel reservation"
                      variant="outline"
                      loading={cancellingId === booking._id}
                      onPress={() => cancelBooking(booking)}
                    />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
        {dineInOrders.length > 0 ? (
          <View style={styles.list}>
            <Text style={styles.section}>Dine-in orders</Text>
            {dineInOrders.map((order: any) => (
              <View key={order._id} style={styles.card}>
                <Text style={styles.title}>{order.orderType} · Table {order.tableNumber || '—'}</Text>
                <Text style={styles.meta}>{order.date} · {order.time} · £{order.total}</Text>
                <Text style={styles.status}>{order.status}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 30 },
  list: { paddingHorizontal: SPACING.space_20, gap: SPACING.space_12 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
  },
  title: { color: COLORS.White, fontFamily: FONTFAMILY.semibold, fontSize: FONTSIZE.size_16 },
  meta: { color: COLORS.primaryLightGreyHex, marginTop: 4 },
  fee: { color: COLORS.White, marginTop: 6, fontFamily: FONTFAMILY.medium, fontSize: FONTSIZE.size_12 },
  status: { color: COLORS.Yellow, marginTop: 8, fontFamily: FONTFAMILY.medium },
  statusCancelled: { color: COLORS.primaryLightGreyHex },
  actions: { marginTop: 12 },
  section: { color: COLORS.White, fontFamily: FONTFAMILY.semibold, marginTop: 8 },
});

export default BookingsScreen;
