import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, Linking, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import PopUpAnimation from '@/components/PopUpAnimation';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import LoadingState from '@/components/ui/LoadingState';
import ActiveDeliveryCard from '@/components/ActiveDeliveryCard';
import * as Progress from 'react-native-progress';
import { useOrderWatch } from '@/hooks/useOrderWatch';
import { api, apiErrorMessage } from '@/lib/api';
import Toast from 'react-native-toast-message';

const Accepted = () => {
  const { user } = useUser();
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const email = user?.primaryEmailAddress?.emailAddress;

  const loadOrder = async () => {
    if (!email) return;
    try {
      const response = await api.get(
        `/api/v1/order/getOrderDelivery/${encodeURIComponent(email)}`,
      );
      setOrder(response.data.data?.accepted || null);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Could not load order', text2: apiErrorMessage(error) });
    }
  };

  useEffect(() => {
    loadOrder();
  }, [email]);

  useOrderWatch(email, ({ accepted }) => {
    if (accepted) return;
    setShowAnimation(true);
    setTimeout(() => {
      setShowAnimation(false);
      router.replace('/home');
    }, 2000);
  });

  return (
    <Screen>
      {showAnimation ? (
        <PopUpAnimation style={{ flex: 1 }} source={require('../../lottie/Successful.json')} />
      ) : null}
      <StackHeader title="On the way" onBack={() => router.replace('/home')} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Estimated arrival</Text>
          <Text style={styles.eta}>25–35 min</Text>
          <Progress.Bar width={null} color={COLORS.primaryRedHex} indeterminate borderWidth={0} />
          <Text style={styles.status}>Your Skyplate order is being prepared.</Text>
        </View>
        {order ? <ActiveDeliveryCard order={order} /> : <LoadingState label="Loading your order" />}
        <View style={styles.contact}>
          <View>
            <Text style={styles.contactTitle}>Need help?</Text>
            <Text style={styles.contactSub}>Call the restaurant</Text>
          </View>
          <TouchableOpacity onPress={() => Linking.openURL('tel:03091698674')}>
            <Text style={styles.call}>Call</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingBottom: 40 },
  card: {
    margin: SPACING.space_20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.space_24,
  },
  eyebrow: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  eta: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.bold,
    fontSize: FONTSIZE.size_30,
    marginVertical: SPACING.space_8,
  },
  status: {
    color: COLORS.primaryLightGreyHex,
    marginTop: SPACING.space_16,
    fontFamily: FONTFAMILY.regular,
  },
  contact: {
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_20,
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    padding: SPACING.space_16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactTitle: { color: COLORS.White, fontFamily: FONTFAMILY.semibold },
  contactSub: { color: COLORS.primaryLightGreyHex, marginTop: 4 },
  call: { color: COLORS.primaryRedHex, fontFamily: FONTFAMILY.semibold, fontSize: FONTSIZE.size_16 },
});

export default Accepted;
