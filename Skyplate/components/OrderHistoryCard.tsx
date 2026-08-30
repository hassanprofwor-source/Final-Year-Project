import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '../theme/theme';
import OrderItemCard from './OrderItemCard';

interface OrderHistoryCardProps {
  CartList: any;
  CartListPrice: string;
  OrderDate: string;
  people: number;
  time: string;
  history: boolean,
  bookings: boolean,
  status: string
}

const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({
  CartList,
  CartListPrice,
  OrderDate,
  people,
  time,
  history = false,
  bookings = false,
  status,
}) => {
  // Group items by name
  const groupedItems = CartList.reduce((acc: any, item: any) => {
    const itemName = item.name;
    if (!acc[itemName]) {
      acc[itemName] = [];
    }
    acc[itemName].push(item);
    return acc;
  }, {});

  const formatted = OrderDate.toString().slice(0, 10)
  return (
    <View style={styles.CardContainer}>
      <View style={styles.CardHeader}>
        {bookings &&

          <View>
            <Text style={styles.HeaderTitle}>Order Date</Text>
            <Text style={styles.HeaderSubtitle}>{OrderDate}</Text>
          </View>
        }
        {history &&

          <View>
            <Text style={styles.HeaderTitle}>Order Date</Text>
            <Text style={styles.HeaderSubtitle}>{formatted}</Text>
          </View>}
        <View style={styles.PriceContainer}>
          <Text style={styles.HeaderTitle}>Total Amount</Text>
          <Text style={styles.HeaderPrice}>Rs {CartListPrice}</Text>
        </View>

      </View>
      {bookings &&

        <View style={styles.CardHeader}>
          <>
            <View>
              <Text style={styles.HeaderTitle}>Number of People</Text>
              <Text style={styles.HeaderSubtitle}>{people}</Text>
            </View>
            <View style={styles.PriceContainer}>
              <Text style={styles.HeaderTitle}>Time</Text>
              <Text style={styles.HeaderPrice}>{time} PM</Text>
            </View>
          </>

        </View>
      }

      <View style={styles.ListContainer}>
        {Object.keys(groupedItems).map((itemName, index) => (
          <OrderItemCard
            key={index}
            name={itemName}
            imagelink={groupedItems[itemName][0].image} // Assuming the first item has the image for this product
            groupedItems={groupedItems[itemName]}
          />
        ))}
      </View>
      {bookings &&

        <View style={styles.CardHeader}>
          <>
            <View>
              <Text style={styles.HeaderTitle}>Status</Text>
            </View>
            <View style={styles.PriceContainer}>
              <Text style={styles.HeaderPrice}>{status}</Text>
            </View>
          </>

        </View>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  CardContainer: {
    gap: SPACING.space_10,
  },
  CardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.space_20,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.WhiteRGBA50,
    borderRadius: 20

  },
  HeaderTitle: {
    fontFamily: FONTFAMILY.poppins_semibold,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  HeaderSubtitle: {
    fontFamily: FONTFAMILY.poppins_light,
    fontSize: FONTSIZE.size_16,
    color: COLORS.primaryWhiteHex,
  },
  PriceContainer: {
    alignItems: 'flex-end',
  },
  HeaderPrice: {
    fontFamily: FONTFAMILY.poppins_medium,
    fontSize: FONTSIZE.size_18,
    color: COLORS.primaryRedHex,
  },
  ListContainer: {
    gap: SPACING.space_20,
  },
});

export default OrderHistoryCard;
