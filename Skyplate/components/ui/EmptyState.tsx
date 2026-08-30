import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';

const EmptyState = ({
  title,
  subtitle,
  icon = 'restaurant-outline',
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWell}>
        <Ionicons name={icon} size={28} color={COLORS.primaryRedHex} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36,
    paddingHorizontal: SPACING.space_24,
  },
  iconWell: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.space_16,
  },
  title: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_18,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.regular,
    fontSize: FONTSIZE.size_14,
    textAlign: 'center',
    marginTop: SPACING.space_8,
  },
});

export default EmptyState;
