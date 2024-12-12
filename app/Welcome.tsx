import { View, Text, Animated, Pressable, StyleSheet } from 'react-native'
import React, { useEffect, useRef } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import Button from '@/components/Button'
import { router } from 'expo-router'
import LottieView from 'lottie-react-native'
import { theme } from '@/constants/theme'
import { widthPercentage, heightPercentage } from '@/helpers/common'

const Welcome = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <ScreenWrapper bgColor={theme.colors.dark}>
      <View style={{
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: widthPercentage(6),
        paddingBottom: heightPercentage(8)
      }}>
        <Animated.View style={{
          marginTop: heightPercentage(10),
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}>
          <Text style={{
            fontSize: 32,
            color: theme.colors.text,
            marginBottom: 12,
            fontFamily: 'Inter-ExtraBold',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>Welcome to Nexus</Text>
          <Text style={{
            fontSize: 16,
            color: theme.colors.textLight,
            textAlign: 'center',
            paddingHorizontal: 20,
            fontFamily: 'Inter-Regular',
            lineHeight: 24
          }}>Embark on an amazing journey with us as we take your experience to new heights</Text>
        </Animated.View>

        <Animated.View style={{ 
          alignItems: 'center',
          opacity: fadeAnim,
          transform: [{ scale: fadeAnim }],
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
          elevation: 5
        }}>
          <LottieView
            source={require('@/assets/images/rocket.json')}
            autoPlay
            loop
            style={{ 
              width: 280, 
              height: 280,
              borderRadius: theme.radius.xxl
            }}
          />
        </Animated.View>

        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}>
          <Button 
            buttonStyle={{
              backgroundColor: theme.colors.primaryDark,
              width: '100%',
              borderRadius: theme.radius.xl,
            }}
            textStyle={{
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: '600',
              fontFamily: 'Inter-Bold'
            }}
            title='Get Started' 
            onPress={() => router.push('/signUp')} 
            loading={false}
            hasShadow={true}
          />
          <View style={{flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 8}}>
            <Text style={{
              fontSize: 14,
              color: theme.colors.textLight,
              fontFamily: 'Inter-Regular'
            }}>Already have an account?</Text>
            <Pressable onPress={() => router.push('/login')}>
            <Text style={{
              fontSize: 14,
              color: theme.colors.primary,
              fontFamily: 'Inter-Bold'
            }}>Sign in</Text>
            </Pressable>

          </View>
        </Animated.View>

        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>from <Text style={styles.brandingHighlight}>lawmwad</Text></Text>
        </View>
      </View>
    </ScreenWrapper>
  )
}

const styles = StyleSheet.create({
  brandingContainer: {
    position: 'absolute',
    bottom: heightPercentage(2),
    width: '100%',
    alignItems: 'center',
  },
  brandingText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  brandingHighlight: {
    fontFamily: 'Inter-Bold',
    color: theme.colors.primary,
  },
})

export default Welcome