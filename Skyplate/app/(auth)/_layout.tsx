import { Stack } from 'expo-router';
import { COLORS } from '@/theme/theme';

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.Black },
        animation: 'slide_from_right',
      }}
    />
  );
};

export default AuthLayout;
