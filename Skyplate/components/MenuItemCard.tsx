import React from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BORDERRADIUS,
  COLORS,
  FONTFAMILY,
  FONTSIZE,
  SPACING,
} from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { optimizedImageUrl } from '@/lib/media';
import { CURRENCY_SYMBOL } from '@/lib/currency';

const CARD_WIDTH = Dimensions.get('window').width * 0.42;

interface MenuItemCardProps {
  id: string;
  index: number;
  type: string;
  roasted: string;
  imagelink: string;
  name: string;
  special_ingredient: string;
  average_rating: number;
  price: any;
  buttonPressHandler: any;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  id,
  index,
  type,
  roasted,
  imagelink,
  name,
  special_ingredient,
  average_rating,
  price,
  buttonPressHandler,
}) => {
  return (
    <View style={styles.card}>
      <ImageBackground
        source={{ uri: optimizedImageUrl(String(imagelink), 480) }}
        style={styles.image}
        resizeMode="cover"
      >
        <View style={styles.rating}>
          <Ionicons name="star" color={COLORS.Yellow} size={12} />
          <Text style={styles.ratingText}>{average_rating || '—'}</Text>
        </View>
      </ImageBackground>
      <Text style={styles.title} numberOfLines={1}>{name}</Text>
      <Text style={styles.subtitle} numberOfLines={1}>{special_ingredient}</Text>
      <View style={styles.footer}>
        <Text style={styles.price}>
          {CURRENCY_SYMBOL} <Text style={styles.priceValue}>{price.price}</Text>
        </Text>
        <TouchableOpacity
          style={styles.add}
          onPress={() => {
            buttonPressHandler({
              id,
              index,
              type,
              roasted,
              imagelink,
              name,
              special_ingredient,
              prices: [{ ...price, quantity: 1 }],
            });
          }}
        >
          <Ionicons name="add" color={COLORS.White} size={18} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH + SPACING.space_24,
    padding: SPACING.space_12,
    borderRadius: BORDERRADIUS.radius_16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: BORDERRADIUS.radius_12,
    marginBottom: SPACING.space_12,
    overflow: 'hidden',
  },
  rating: {
    flexDirection: 'row',
    backgroundColor: 'rgba(12,13,17,0.75)',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    borderBottomLeftRadius: 12,
    top: 0,
    right: 0,
  },
  ratingText: {
    fontFamily: FONTFAMILY.medium,
    color: COLORS.White,
    fontSize: FONTSIZE.size_12,
  },
  title: {
    fontFamily: FONTFAMILY.semibold,
    color: COLORS.White,
    fontSize: FONTSIZE.size_16,
  },
  subtitle: {
    fontFamily: FONTFAMILY.regular,
    color: COLORS.primaryLightGreyHex,
    fontSize: FONTSIZE.size_12,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.space_12,
  },
  price: {
    fontFamily: FONTFAMILY.semibold,
    color: COLORS.primaryRedHex,
    fontSize: FONTSIZE.size_16,
  },
  priceValue: {
    color: COLORS.White,
  },
  add: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryRedHex,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MenuItemCard;
