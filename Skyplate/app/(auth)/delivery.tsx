import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/expo';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING } from '@/theme/theme';
import { api, apiErrorMessage } from '@/lib/api';
import Screen from '@/components/ui/Screen';
import StackHeader from '@/components/ui/StackHeader';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';

const formatPhone = (value: string) => {
  let formattedValue = value.replace(/\D/g, '').slice(0, 11);
  if (formattedValue.length > 4) {
    formattedValue = `${formattedValue.slice(0, 4)}-${formattedValue.slice(4)}`;
  }
  return formattedValue;
};

const Delivery = () => {
  const { orderType, isDelivery } = useLocalSearchParams();
  const delivery = isDelivery === 'true';
  const { user } = useUser();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState(delivery ? '' : 'Dine-in at Skyplate');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/api/v1/user/getuser/${user?.primaryEmailAddress?.emailAddress}`);
        const data = response.data.data[0];
        setPhoneNumber(data?.phone || '');
        if (delivery) setAddress(data?.address || '');
      } catch (err: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(err) });
      }
    };
    if (user?.primaryEmailAddress?.emailAddress) load();
  }, [user, delivery]);

  const handleContinue = () => {
    if (phoneNumber.length !== 12) {
      setError('Use format 0300-1234567');
      return;
    }
    if (delivery && !address.trim()) {
      Toast.show({ type: 'error', text1: 'Address required' });
      return;
    }
    router.push({
      pathname: '/payment',
      params: {
        orderType,
        phone: phoneNumber,
        address: delivery ? address : 'Dine-in at Skyplate',
      },
    });
  };

  return (
    <Screen>
      <StackHeader title={delivery ? 'Delivery details' : 'Dine-in details'} />
      <ScrollView contentContainerStyle={styles.content}>
        <TextField
          label="Phone"
          value={phoneNumber}
          error={error}
          keyboardType="phone-pad"
          onChangeText={(v) => {
            setPhoneNumber(formatPhone(v));
            setError('');
          }}
        />
        {delivery ? (
          <TextField
            label="Address"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        ) : (
          <View style={{ marginBottom: SPACING.space_16 }} />
        )}
        <Button title="Continue to payment" onPress={handleContinue} />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: SPACING.space_20,
    backgroundColor: COLORS.Black,
  },
});

export default Delivery;
