import Constants from "expo-constants";

export const frontendUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra?.frontendUrl as string | undefined);
