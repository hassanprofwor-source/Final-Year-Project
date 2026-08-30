import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS, FONTFAMILY, FONTSIZE, SPACING } from '@/theme/theme';

const TextField = ({
  label,
  error,
  style,
  multiline,
  ...props
}: TextInputProps & { label?: string; error?: string }) => {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.primaryLightGreyHex}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          error ? styles.inputError : null,
          style,
        ]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.space_16,
  },
  label: {
    color: COLORS.primaryLightGreyHex,
    fontFamily: FONTFAMILY.medium,
    fontSize: FONTSIZE.size_12,
    marginBottom: SPACING.space_8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    height: 50,
    paddingHorizontal: SPACING.space_16,
    borderRadius: 12,
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.White,
    fontFamily: FONTFAMILY.regular,
    fontSize: FONTSIZE.size_16,
  },
  multiline: {
    height: 120,
    paddingTop: SPACING.space_12,
  },
  inputError: {
    borderColor: COLORS.primaryRedHex,
  },
  error: {
    color: COLORS.primaryRedHex,
    fontFamily: FONTFAMILY.regular,
    fontSize: FONTSIZE.size_12,
    marginTop: SPACING.space_4,
  },
});

export default TextField;
