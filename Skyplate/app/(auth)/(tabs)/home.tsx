import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { FlatList } from 'react-native';
import { useStore } from '../../../store/store';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING, BORDERRADIUS } from '../../../theme/theme';
import HeaderBar from '../../../components/HeaderBar';
import MenuItemCard from '../../../components/MenuItemCard';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useUser } from '@clerk/expo';
import { api, apiErrorMessage, ensureSkyplateUser } from '@/lib/api';
import { getDeviceCoordinates } from '@/lib/location';
import { registerPushToken } from '@/lib/notifications';
import Screen from '@/components/ui/Screen';
import EmptyState from '@/components/ui/EmptyState';
import LoadingState from '@/components/ui/LoadingState';

const getCategoriesFromData = (data: any) => {
  const temp: any = {};
  for (let i = 0; i < data.length; i++) {
    const typeName = typeof data[i].type === 'object' ? data[i].type?.name : data[i].type;
    if (!typeName) continue;
    temp[typeName] = (temp[typeName] || 0) + 1;
  }
  return ['All', ...Object.keys(temp)];
};

const getMenuByCategory = (category: string, data: any) => {
  if (category === 'All') return data;
  return data.filter((item: any) => {
    const typeName = typeof item.type === 'object' ? item.type?.name : item.type;
    return typeName === category;
  });
};

const HomeScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const [weather, setWeather] = useState<string | undefined>();
  const [city, setCity] = useState<any>(null);
  const [imageSrc, setImageSrc] = useState('');
  const [weatherSuggestions, setWeatherSuggestions] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<'pending' | 'accepted' | null>(null);
  const [menuLoading, setMenuLoading] = useState(true);

  const fetchMenu = useStore((state: any) => state.fetchMenu);
  const MenuList = useStore((state: any) => state.MenuList);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);

  useEffect(() => {
    if (!user) return;
    ensureSkyplateUser(user).catch(() => undefined);
    registerPushToken(user.primaryEmailAddress?.emailAddress).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    const checkOrder = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) return;
      try {
        const response = await api.get(
          `/api/v1/order/getOrderDelivery/${encodeURIComponent(user.primaryEmailAddress.emailAddress)}`,
        );
        if (response.data.data?.accepted) setActiveOrder('accepted');
        else if (response.data.data?.pending) setActiveOrder('pending');
        else setActiveOrder(null);
      } catch {
        setActiveOrder(null);
      }
    };
    checkOrder();
  }, [user]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const coords = await getDeviceCoordinates();
        const response = await api.get('/api/v1/weather', {
          params: coords ? { lat: coords.lat, lon: coords.lon } : undefined,
        });
        const payload = response.data.data;
        setCity({
          name: payload.city,
          main: { temp: payload.temp },
          weather: [{ main: payload.condition }],
        });
        setWeather(payload.condition?.toLowerCase());
        setImageSrc(payload.icon);
        setWeatherSuggestions(payload.suggestions || []);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Weather',
          text2: apiErrorMessage(error, 'Could not load weather suggestions'),
        });
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    const load = async () => {
      setMenuLoading(true);
      await fetchMenu();
      setMenuLoading(false);
    };
    load();
  }, [fetchMenu]);

  const [categories, setCategories] = useState<string[]>(['All']);
  const [searchText, setSearchText] = useState('');
  const [categoryIndex, setCategoryIndex] = useState({ index: 0, category: 'All' });
  const [sortedMenu, setSortedMenu] = useState<any[]>([]);
  const ListRef: any = useRef(null);

  useEffect(() => {
    if (MenuList.length > 0) {
      const next = getCategoriesFromData(MenuList);
      setCategories(next);
      setSortedMenu(getMenuByCategory(categoryIndex.category, MenuList));
    } else {
      setSortedMenu([]);
    }
  }, [MenuList]);

  const searchMenu = (search: string) => {
    if (search !== '') {
      ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
      setCategoryIndex({ index: 0, category: 'All' });
      setSortedMenu(MenuList.filter((item: any) => item.name.toLowerCase().includes(search.toLowerCase())));
    }
  };

  const addItemToCart = (item: any) => {
    addToCart(item);
    calculateCartPrice();
    Toast.show({ type: 'success', text1: 'Added to cart', text2: item.name });
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <HeaderBar />
        <View style={styles.hero}>
          <Text style={styles.title}>Find the best{'\n'}food for you</Text>
          <View style={styles.weatherCard}>
            {city ? (
              <>
                <Text style={styles.city}>{city?.name}</Text>
                <Text style={styles.temp}>{city?.main?.temp}°C</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color={COLORS.primaryRedHex} />
            )}
          </View>
        </View>

        {activeOrder ? (
          <TouchableOpacity
            style={styles.banner}
            onPress={() => router.push(activeOrder === 'accepted' ? '/accepted' : '/pending')}
          >
            <View>
              <Text style={styles.bannerEyebrow}>Active order</Text>
              <Text style={styles.bannerTitle}>
                {activeOrder === 'accepted' ? 'Your order is being prepared' : 'Waiting for the restaurant'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.White} />
          </TouchableOpacity>
        ) : null}

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={COLORS.primaryLightGreyHex} />
          <TextInput
            placeholder="Search the menu"
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              if (text) searchMenu(text);
              else setSortedMenu(getMenuByCategory('All', MenuList));
            }}
            placeholderTextColor={COLORS.primaryLightGreyHex}
            style={styles.searchInput}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                setSortedMenu(getMenuByCategory('All', MenuList));
              }}
            >
              <Ionicons name="close" size={18} color={COLORS.primaryLightGreyHex} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categories.map((data, index) => (
            <TouchableOpacity
              key={data}
              style={[styles.chip, categoryIndex.index === index && styles.chipActive]}
              onPress={() => {
                ListRef?.current?.scrollToOffset({ animated: true, offset: 0 });
                setCategoryIndex({ index, category: data });
                setSortedMenu(getMenuByCategory(data, MenuList));
              }}
            >
              <Text style={[styles.chipText, categoryIndex.index === index && styles.chipTextActive]}>{data}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {menuLoading ? (
          <LoadingState label="Loading menu" />
        ) : (
          <FlatList
            ref={ListRef}
            horizontal
            ListEmptyComponent={<EmptyState title="No dishes yet" subtitle="The kitchen is updating the menu." />}
            showsHorizontalScrollIndicator={false}
            data={sortedMenu}
            contentContainerStyle={styles.list}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/details',
                    params: { index: item.index, id: item._id, type: item.type },
                  })
                }
              >
                <MenuItemCard
                  id={item._id}
                  index={item.index}
                  type={item.type}
                  roasted={item.roasted}
                  imagelink={item.image?.url}
                  name={item.name}
                  special_ingredient={item.special_ingredient}
                  average_rating={item.average_rating}
                  price={item.prices[0]}
                  buttonPressHandler={addItemToCart}
                />
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.specialHeader}>
          <Text style={styles.specialTitle}>Today’s special{weather ? ` · ${weather}` : ''}</Text>
          {imageSrc ? (
            <Image source={typeof imageSrc === 'string' ? { uri: imageSrc } : imageSrc} style={{ width: 28, height: 28 }} />
          ) : null}
        </View>
        <FlatList
          horizontal
          ListEmptyComponent={<EmptyState title="No weather picks" subtitle="Suggestions appear when weather data is available." />}
          showsHorizontalScrollIndicator={false}
          data={weatherSuggestions}
          contentContainerStyle={styles.list}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/details',
                  params: { index: item.index, id: item._id, type: item.type },
                })
              }
            >
              <MenuItemCard
                id={item._id}
                index={item.index}
                type={item.type}
                roasted={item.roasted}
                imagelink={item.image?.url}
                name={item.name}
                special_ingredient={item.special_ingredient}
                average_rating={item.average_rating}
                price={item.prices[0]}
                buttonPressHandler={addItemToCart}
              />
            </TouchableOpacity>
          )}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: SPACING.space_32,
  },
  hero: {
    paddingHorizontal: SPACING.space_20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.space_16,
  },
  title: {
    fontSize: FONTSIZE.size_28,
    fontFamily: FONTFAMILY.semibold,
    color: COLORS.White,
    flex: 1,
  },
  weatherCard: {
    backgroundColor: COLORS.elevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'flex-end',
  },
  city: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_12,
  },
  temp: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.medium,
  },
  banner: {
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_16,
    backgroundColor: COLORS.elevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryRedHex,
    padding: SPACING.space_16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerEyebrow: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    marginTop: 4,
  },
  search: {
    flexDirection: 'row',
    marginHorizontal: SPACING.space_20,
    marginBottom: SPACING.space_16,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    paddingHorizontal: SPACING.space_12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: COLORS.White,
    fontFamily: FONTFAMILY.regular,
  },
  chips: {
    paddingHorizontal: SPACING.space_20,
    gap: 8,
    marginBottom: SPACING.space_12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: COLORS.primaryRedHex,
    borderColor: COLORS.primaryRedHex,
  },
  chipText: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
  },
  chipTextActive: {
    color: COLORS.White,
  },
  list: {
    gap: SPACING.space_16,
    paddingHorizontal: SPACING.space_20,
    paddingVertical: SPACING.space_8,
    minWidth: Dimensions.get('window').width - 40,
  },
  specialHeader: {
    paddingHorizontal: SPACING.space_20,
    marginTop: SPACING.space_20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialTitle: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_18,
  },
});

export default HomeScreen;
