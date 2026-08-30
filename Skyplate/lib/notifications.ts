import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { api } from '@/lib/api';

let pushReady = false;

export const isPushReady = () => pushReady;

export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

export const routeFromPushData = (data?: Record<string, unknown>) => {
  const screen = String(data?.screen || '');
  if (screen === 'accepted') router.replace('/accepted');
  else if (screen === 'pending') router.replace('/pending');
  else if (screen === 'home') router.replace('/home');
};

export const registerPushToken = async (email?: string | null) => {
  pushReady = false;
  if (!email || !Device.isDevice || Constants.appOwnership === 'expo') return false;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants as any).easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  await api.post('/api/v1/user/pushtoken', { email, token });
  pushReady = true;
  return true;
};
