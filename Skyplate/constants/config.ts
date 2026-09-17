import Constants from "expo-constants";
import { resolveApiUrl } from "./apiUrl";

export { resolveApiUrl };

export const frontendUrl = resolveApiUrl(
  process.env.EXPO_PUBLIC_API_URL ||
    (Constants.expoConfig?.extra?.frontendUrl as string | undefined),
  Constants.expoConfig?.hostUri,
);
