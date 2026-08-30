import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '@/theme/theme';

const PublicLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.Black },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset" />
    </Stack>
  );
};

export default PublicLayout;
