import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE } from '@/theme/theme';

const BrandMark = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const titleSize =
    size === 'lg' ? FONTSIZE.size_28 : size === 'sm' ? FONTSIZE.size_16 : FONTSIZE.size_20;
  const mark = size === 'lg' ? 44 : size === 'sm' ? 28 : 36;

  return (
    <View style={styles.row}>
      <Image
        source={require('../../assets/weather/Logo1.png')}
        style={{ width: mark, height: mark, borderRadius: 12 }}
      />
      <Text style={[styles.wordmark, { fontSize: titleSize }]}>
        Sky<Text style={styles.accent}>plate</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    color: COLORS.White,
    fontFamily: FONTFAMILY.semibold,
    letterSpacing: -0.4,
  },
  accent: {
    color: COLORS.primaryRedHex,
  },
});

export default BrandMark;
