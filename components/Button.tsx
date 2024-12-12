import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native'
import React from 'react'
import Loading from './Loading';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  title?: string;
  icon?: string;
  children?: React.ReactNode;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  hasShadow?: boolean;
}

const Button = ({ 
  buttonStyle, 
  textStyle, 
  title, 
  icon,
  children,
  onPress, 
  loading = false,
  disabled = false,
  hasShadow = false,
  size = 'md' 
}: ButtonProps) => {
  
  if(loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size={30} color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        styles[size],
        hasShadow && styles.shadow,
        disabled && styles.disabled,
        buttonStyle,
      ]}
    >
      {icon ? (
        <Ionicons name={icon as any} size={24} color={theme.colors.text} />
      ) : title ? (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Button;