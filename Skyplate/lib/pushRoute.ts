export const pathFromPushScreen = (screen?: string) => {
  if (screen === 'accepted') return '/accepted';
  if (screen === 'pending') return '/pending';
  if (screen === 'home') return '/home';
  return null;
};
