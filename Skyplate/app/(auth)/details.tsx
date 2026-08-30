import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../../store/store';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../../theme/theme';
import ImageBackgroundInfo from '../../components/ImageBackgroundInfo';
import PaymentFooter from '../../components/PaymentFooter';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Screen from '@/components/ui/Screen';
import EmptyState from '@/components/ui/EmptyState';

const DetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const MenuList = useStore((state: any) => state.MenuList);
  const ItemOfIndex = MenuList.find((item: any) => item._id === id);
  const addToCart = useStore((state: any) => state.addToCart);
  const calculateCartPrice = useStore((state: any) => state.calculateCartPrice);
  const router = useRouter();
  const [price, setPrice] = useState(ItemOfIndex?.prices?.[0]);
  const [fullDesc, setFullDesc] = useState(false);

  if (!ItemOfIndex) {
    return (
      <Screen>
        <EmptyState title="Dish not found" subtitle="Go back to the menu and try another item." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <ImageBackgroundInfo
          EnableBackHandler
          imagelink={ItemOfIndex?.image?.url}
          type={ItemOfIndex?.type}
          id={ItemOfIndex?.id}
          favourite={ItemOfIndex?.favourite}
          name={ItemOfIndex?.name}
          special_ingredient={ItemOfIndex?.special_ingredient}
          ingredients={ItemOfIndex?.ingredients}
          average_rating={ItemOfIndex?.average_rating}
          ratings_count={ItemOfIndex?.ratings_count}
          BackHandler={() => router.back()}
        />
        <View style={styles.body}>
          <Text style={styles.infoTitle}>Description</Text>
          <TouchableWithoutFeedback onPress={() => setFullDesc((prev) => !prev)}>
            <Text numberOfLines={fullDesc ? undefined : 3} style={styles.description}>
              {ItemOfIndex.description}
            </Text>
          </TouchableWithoutFeedback>
          <Text style={styles.infoTitle}>Size</Text>
          <View style={styles.sizes}>
            {ItemOfIndex.prices.map((data: any) => (
              <TouchableOpacity
                key={data.size}
                onPress={() => setPrice(data)}
                style={[styles.sizeBox, data.size == price?.size && styles.sizeOn]}
              >
                <Text style={styles.sizeText}>{data.size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <PaymentFooter
          price={price}
          buttonTitle="Add to cart"
          buttonPressHandler={() => {
            addToCart({
              id: ItemOfIndex._id,
              name: ItemOfIndex.name,
              roasted: ItemOfIndex.roasted,
              imagelink: ItemOfIndex.image?.url,
              special_ingredient: ItemOfIndex.special_ingredient,
              type: ItemOfIndex.type,
              prices: [{ ...price, quantity: 1 }],
            });
            calculateCartPrice();
            router.navigate('/cart');
          }}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  body: { padding: SPACING.space_20 },
  infoTitle: {
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.White,
    marginBottom: SPACING.space_10,
  },
  description: {
    fontFamily: FONTFAMILY.regular,
    fontSize: FONTSIZE.size_14,
    color: COLORS.primaryLightGreyHex,
    marginBottom: SPACING.space_24,
  },
  sizes: { flexDirection: 'row', gap: SPACING.space_12 },
  sizeBox: {
    flex: 1,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: BORDERRADIUS.radius_12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sizeOn: { borderColor: COLORS.primaryRedHex },
  sizeText: { fontFamily: FONTFAMILY.medium, color: COLORS.White },
});

export default DetailsScreen;
