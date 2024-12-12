import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '@/constants/theme';

interface ChallengeSkeletonProps {
  style?: any;
}

const ChallengeSkeleton = ({ style }: ChallengeSkeletonProps) => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.content, { opacity }]} />
      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View style={styles.avatar} />
          <View style={styles.username} />
        </View>
        <View style={styles.actions}>
          <View style={styles.action} />
          <View style={styles.action} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: theme.colors.darkLight,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.gray,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray,
  },
  username: {
    width: 80,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.gray,
  },
  actions: {
    alignItems: 'center',
    gap: 12,
  },
  action: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.gray,
  },
});

export default ChallengeSkeleton; 