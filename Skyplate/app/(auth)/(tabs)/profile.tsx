import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../../theme/theme';
import SettingComponent from '../../../components/SettingComponent';
import HeaderBar from '../../../components/HeaderBar';
import { useAuth, useUser } from '@clerk/expo';
import Toast from 'react-native-toast-message';
import { useFocusEffect, useRouter } from 'expo-router';
import { api, apiErrorMessage } from '@/lib/api';
import Screen from '@/components/ui/Screen';
import Button from '@/components/ui/Button';
import LoadingState from '@/components/ui/LoadingState';

const UserAccountScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const [userData, setuserData] = useState<any>();
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const response = await api.get(`/api/v1/user/getuser/${user?.primaryEmailAddress?.emailAddress}`);
      setuserData(response.data.data[0]);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [user]),
  );

  const imageurl = userData?.image?.url ? userData.image.url : user?.imageUrl;

  return (
    <Screen>
      <ScrollView>
        <HeaderBar title="Profile" />
        {loading ? (
          <LoadingState label="Loading profile" />
        ) : (
          <>
            <View style={styles.profile}>
              <Image source={{ uri: imageurl }} style={styles.avatar} />
              <Text style={styles.name}>{user?.fullName}</Text>
              <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/edit',
                    params: {
                      address: userData?.address,
                      firstname: userData?.firstname,
                      lastname: userData?.lastname,
                      imgurl: userData?.image?.url,
                      gender: userData?.gender,
                      phone: userData?.phone,
                    },
                  })
                }
              >
                <SettingComponent icon="person" heading="Account" subheading="Edit your profile" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.navigate('/bookings')}>
                <SettingComponent icon="calendar" heading="Bookings" subheading="Table reservations" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.navigate('/history')}>
                <SettingComponent icon="receipt" heading="Order history" subheading="Past orders" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/feedback',
                    params: {
                      firstname: userData?.firstname,
                      imgurl: userData?.image?.url,
                      phone: userData?.phone,
                    },
                  })
                }
              >
                <SettingComponent icon="star" heading="Feedback" subheading="Rate your visit" />
              </TouchableOpacity>
            </View>
            <View style={styles.logout}>
              <Button title="Log out" variant="secondary" onPress={() => signOut()} />
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  profile: {
    alignItems: 'center',
    paddingVertical: SPACING.space_16,
  },
  avatar: {
    height: 88,
    width: 88,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: {
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_18,
    marginTop: SPACING.space_12,
    color: COLORS.White,
  },
  email: {
    fontFamily: FONTFAMILY.regular,
    color: COLORS.primaryLightGreyHex,
    marginTop: 4,
  },
  card: {
    marginHorizontal: SPACING.space_20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.space_8,
  },
  logout: {
    margin: SPACING.space_20,
  },
});

export default UserAccountScreen;
