import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) => {
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.White : COLORS.primaryRedHex} />
      ) : (
        <Text style={[styles.label, variant !== 'primary' && styles.labelMuted]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.space_20,
  },
  primary: {
    backgroundColor: COLORS.primaryRedHex,
  },
  secondary: {
    backgroundColor: COLORS.elevated,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_16,
  },
  labelMuted: {
    color: COLORS.White,
  },
});

export default Button;
