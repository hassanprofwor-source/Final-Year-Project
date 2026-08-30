import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';

const StackHeader = ({
  title,
  onBack,
}: {
  title: string;
  onBack?: () => void;
}) => {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.back}
        onPress={onBack || (() => router.back())}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={22} color={COLORS.White} />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.space_16,
    paddingVertical: SPACING.space_12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    fontSize: FONTSIZE.size_18,
  },
});

export default StackHeader;
