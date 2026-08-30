import { StyleSheet, Text, View, Image } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BORDERRADIUS, COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import { optimizedImageUrl } from '@/lib/media';

interface OrderItemCardProps {
  name: string;
  imagelink: string;
  groupedItems: any[];
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({
  name,
  imagelink,
  groupedItems,
}) => {
  // Group items by size (Small, Medium, Large)
  const sizes = ['S', 'M', 'L','R'];

  const groupedBySize = sizes.reduce((acc: any, size) => {
    acc[size] = groupedItems.filter(item => item.size === size);
    return acc;
  }, {});

  return (
    <LinearGradient
      start={{ x: 1, y: 0 }}
      end={{ x: 1, y: 1 }}
      colors={[COLORS.Grey, COLORS.Black]}
      style={styles.CardLinearGradient}>
      <View style={styles.CardInfoContainer}>
        <View style={styles.CardImageInfoContainer}>
          <Image source={{ uri: optimizedImageUrl(imagelink, 240) }} style={styles.Image} />
          <View>
            <Text style={styles.CardTitle}>{name}</Text>
          </View>
        </View>
      </View>

      {/* Loop over each size and display the corresponding items */}
      {sizes.map(size => {
        const itemsForSize = groupedBySize[size];
        const totalQuantity = itemsForSize.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        );
        const totalPrice = itemsForSize.reduce(
          (sum: number, item: any) =>
            sum + item.quantity * item.price,
          0
        );

        if (totalQuantity > 0) {
          return (
            <View key={size} style={styles.CardTableRow}>
              <View style={styles.CardTableRow}>
                <View style={styles.SizeBoxLeft}>
                  <Text style={styles.SizeText}>
                    {size} Size
                  </Text>
                </View>
                <View style={styles.PriceBoxRight}>
                  <Text style={styles.PriceCurrency}>
                    Rs <Text style={styles.Price}>{totalPrice}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.CardTableRow}>
                <Text
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontFamily: FONTFAMILY.poppins_semibold,
                    fontSize: FONTSIZE.size_18,
                    color: COLORS.primaryRedHex,
                  }}>
                  X <Text style={styles.Price}>{totalQuantity}</Text>
                </Text>
              </View>
            </View>
          );
        }
        return null;
      })}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  CardLinearGradient: {
    gap: SPACING.space_20,
    padding: SPACING.space_20,
    borderRadius: BORDERRADIUS.radius_25,
  },
  CardInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  CardImageInfoContainer: {
    flexDirection: 'row',
    gap: SPACING.space_20,
    alignItems: 'center',
  },
  Image: {
    height: 90,
    width: 90,
    borderRadius: BORDERRADIUS.radius_15,
  },
  CardTitle: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryWhiteHex,
  },
  CardTableRow: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  SizeBoxLeft: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    height: 45,
    flex: 1,
    borderTopLeftRadius: BORDERRADIUS.radius_10,
    borderBottomLeftRadius: BORDERRADIUS.radius_10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderLeftColor: COLORS.Grey,
    borderTopColor: COLORS.Grey,
    borderBottomColor: COLORS.Grey,
    borderRightColor: COLORS.WhiteRGBA32,
    borderWidth: 1,
  },
  SizeText: {
    fontFamily: FONTFAMILY.poppins_medium,
    color: COLORS.White,
  },
  PriceBoxRight: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    height: 45,
    flex: 1,
    borderTopRightRadius: BORDERRADIUS.radius_10,
    borderBottomRightRadius: BORDERRADIUS.radius_10,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.White,
    borderColor: COLORS.Grey,
    borderWidth: 1,
  },
  PriceCurrency: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: 17,
    color: COLORS.White,
  },
  Price: {
    color: COLORS.primaryWhiteHex,
  },
});

export default OrderItemCard;
