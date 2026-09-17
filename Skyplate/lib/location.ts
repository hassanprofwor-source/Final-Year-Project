import * as Location from 'expo-location';

const LOCATION_TIMEOUT_MS = 4000;

const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Location timed out')), ms);
    }),
  ]);

export const getDeviceCoordinates = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown?.coords) {
      return {
        lat: lastKnown.coords.latitude,
        lon: lastKnown.coords.longitude,
      };
    }

    const position = await withTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      }),
      LOCATION_TIMEOUT_MS,
    );

    return {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };
  } catch {
    return null;
  }
};
