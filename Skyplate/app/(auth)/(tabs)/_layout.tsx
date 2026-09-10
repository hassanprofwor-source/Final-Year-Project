import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { COLORS, FONTFAMILY } from '../../../theme/theme';
import { useStore } from '../../../store/store';

const TabsPage = () => {
  const { isSignedIn } = useAuth();
  const CartList = useStore((state: any) => state.CartList);
  const cartCount = (CartList || []).reduce((sum: number, item: any) => {
    const qty = (item.prices || []).reduce((q: number, p: any) => q + (p.quantity || 0), 0);
    return sum + qty;
  }, 0);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: COLORS.primaryRedHex,
        tabBarInactiveTintColor: COLORS.primaryLightGreyHex,
        tabBarLabelStyle: {
          fontFamily: FONTFAMILY.medium,
          fontSize: 11,
        },
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
        redirect={!isSignedIn}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color} />
          ),
        }}
        redirect={!isSignedIn}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primaryRedHex,
            color: COLORS.White,
            fontSize: 11,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={22} color={color} />
          ),
        }}
        redirect={!isSignedIn}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
        redirect={!isSignedIn}
      />
    </Tabs>
  );
};

export default TabsPage;
