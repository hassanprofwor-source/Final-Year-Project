import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFonts } from 'expo-font';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { COLORS } from '@/theme/theme';
import { routeFromPushData, setupNotificationHandler } from '@/lib/notifications';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

setupNotificationHandler();

const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const inPublicGroup = root === '(public)';

    if (isSignedIn && !inAuthGroup) {
      router.replace('/home');
    } else if (!isSignedIn && !inPublicGroup) {
      router.replace('/login');
    }
  }, [isLoaded, isSignedIn, segments, router]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromPushData(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => sub.remove();
  }, []);

  return <Slot />;
};

const RootLayout = () => {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    app_icons: require('../assets/fonts/app_icons.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.Black, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.primaryRedHex} />
      </View>
    );
  }

  if (!CLERK_PUBLISHABLE_KEY) {
    throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY!}>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <InitialLayout />
        <Toast />
      </ClerkProvider>
    </StripeProvider>
  );
};

export default RootLayout;
