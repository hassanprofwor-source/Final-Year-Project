import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { api, apiErrorMessage } from '@/lib/api';
import { isPushReady, routeFromPushData } from '@/lib/notifications';
import Toast from 'react-native-toast-message';

export const useOrderWatch = (
  email: string | undefined,
  onUpdate: (state: { pending: boolean; accepted: boolean }) => void,
) => {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!email) return;

    const check = async () => {
      try {
        const response = await api.get(
          `/api/v1/order/getOrderDelivery/${encodeURIComponent(email)}`,
        );
        onUpdateRef.current({
          pending: !!response.data.data?.pending,
          accepted: !!response.data.data?.accepted,
        });
      } catch (error: any) {
        Toast.show({ type: 'error', text1: 'Error', text2: apiErrorMessage(error) });
      }
    };

    check();

    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      if (data?.screen) routeFromPushData(data);
      else check();
    });
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      routeFromPushData(response.notification.request.content.data as Record<string, unknown>);
    });
    const appSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });

    const interval = isPushReady()
      ? null
      : setInterval(check, 30000);

    return () => {
      sub.remove();
      responseSub.remove();
      appSub.remove();
      if (interval) clearInterval(interval);
    };
  }, [email]);
};
