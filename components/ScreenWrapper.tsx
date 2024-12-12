import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  bgColor?: string;
  style?: StyleProp<ViewStyle>;
};

const ScreenWrapper = ({ children, bgColor, style }: Props) => {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }, style]}>
      <View style={[styles.container, { backgroundColor: bgColor }, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;