import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';
import { optimizedImageUrl } from '@/lib/media';

const ActiveDeliveryCard = ({ order }: { order: any }) => {
  const items = order?.cartItems || [];

  return (
    <View style={styles.wrap}>
      <View style={styles.meta}>
        <Text style={styles.eyebrow}>{order.status} · {order.payment || 'Unpaid'}</Text>
        <Text style={styles.title}>Delivery order</Text>
        {order.address ? <Text style={styles.address}>{order.address}</Text> : null}
        {order.phone ? <Text style={styles.address}>{order.phone}</Text> : null}
      </View>

      <View style={styles.list}>
        {items.map((item: any, index: number) => (
          <View key={`${item.name}-${index}`} style={styles.row}>
            <Image
              source={{ uri: optimizedImageUrl(item.image, 120) }}
              style={styles.thumb}
            />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>
                {item.size ? `${String(item.size).toUpperCase()} · ` : ''}x{item.quantity}
              </Text>
            </View>
            <Text style={styles.price}>Rs {Number(item.price) * Number(item.quantity || 1)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>Rs {order.total}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.space_20,
    marginTop: SPACING.space_12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  meta: {
    padding: SPACING.space_16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  eyebrow: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_18,
    marginTop: 6,
  },
  address: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.regular,
    marginTop: 6,
  },
  list: { padding: SPACING.space_12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: COLORS.elevated },
  info: { flex: 1 },
  name: { color: COLORS.White, fontFamily: FONTFAMILY.medium },
  sub: { color: COLORS.primaryLightGreyHex, marginTop: 2, fontSize: FONTSIZE.size_12 },
  price: { color: COLORS.White, fontFamily: FONTFAMILY.semibold },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.space_16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { color: COLORS.primaryLightGreyHex, fontFamily: FONTFAMILY.medium },
  totalValue: { color: COLORS.primaryRedHex, fontFamily: FONTFAMILY.semibold, fontSize: FONTSIZE.size_16 },
});

export default ActiveDeliveryCard;
