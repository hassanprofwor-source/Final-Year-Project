import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { COLORS } from '@/theme/theme';
import BrandMark from '@/components/ui/BrandMark';

const StartPage = () => {
  return (
    <View style={styles.wrap}>
      <BrandMark size="lg" />
      <ActivityIndicator size="large" color={COLORS.primaryRedHex} style={{ marginTop: 24 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.Black,
  },
});

export default StartPage;
