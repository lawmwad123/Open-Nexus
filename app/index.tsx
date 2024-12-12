import { View, StyleSheet } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { theme } from '@/constants/theme'
import LottieView from 'lottie-react-native'

const Index = () => {
  return (
    <ScreenWrapper bgColor={theme.colors.dark}>
      <View style={styles.container}>
        <View style={styles.animationContainer}>
          <LottieView
            source={require('@/assets/images/rocket.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Index

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    width: '80%',
    aspectRatio: 1,
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.xxl,
    padding: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
})