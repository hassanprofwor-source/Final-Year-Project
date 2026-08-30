import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';

const LoadingState = ({ label = 'Loading…' }: { label?: string }) => {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={COLORS.primaryRedHex} size="large" />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.space_36,
    gap: SPACING.space_12,
  },
  label: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_14,
  },
});

export default LoadingState;
