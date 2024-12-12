import { StyleSheet, Pressable, Animated } from 'react-native'
import React, { useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { theme } from '@/constants/theme'

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: any;
}

const BackButton = ({ 
  onPress, 
  color = theme.colors.text, 
  size = 28,
  style 
}: BackButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();

    // Handle navigation
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Animated.View style={[
      styles.container,
      style,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressed
        ]}
      >
        <Ionicons 
          name="chevron-back" 
          size={size} 
          color={color} 
        />
      </Pressable>
    </Animated.View>
  )
}

export default BackButton

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.darkLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.8,
  }
}) 