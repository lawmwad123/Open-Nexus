import { StyleSheet, Text, View, Animated, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native'
import React, { useRef, useEffect, useState } from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { theme } from '@/constants/theme'
import Button from '@/components/Button'
import { router } from 'expo-router'
import { heightPercentage, widthPercentage } from '@/helpers/common'
import { Ionicons } from '@expo/vector-icons'
import BackButton from '@/components/BackButton'
import { supabase } from '@/lib/supabase'

const Login = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onLogin = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate email
      if (!email.trim()) {
        setError('Please enter your email');
        return;
      }
      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password
      if (!password) {
        setError('Please enter a password');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.session) {
        // Successfully logged in
        router.replace('/(app)/home');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

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
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            <View style={styles.container}>
              <BackButton style={styles.backButton} />
              <Animated.View style={[styles.headerContainer, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }]}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </Animated.View>

              <Animated.View style={[styles.formContainer, {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }]}>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={24} color={theme.colors.textLight} />
                  <TextInput 
                    onChangeText={(value) => {
                      setEmail(value);
                      emailRef.current?.setNativeProps({ text: value });
                    }}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textLight}
                    style={styles.input}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={24} color={theme.colors.textLight} />
                  <TextInput 
                    onChangeText={(value) => {
                      setPassword(value);
                      passwordRef.current?.setNativeProps({ text: value });
                    }}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textLight}
                    style={styles.input}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-outline" : "eye-off-outline"} 
                      size={24} 
                      color={theme.colors.textLight} 
                    />
                  </Pressable>
                </View>

                <Button 
                  buttonStyle={styles.button}
                  textStyle={styles.buttonText}
                  title="Sign In" 
                  onPress={onLogin}
                  loading={loading}
                  hasShadow={true}
                />

                <View style={styles.footerContainer}>
                  <Text style={styles.footerText}>Don't have an account?</Text>
                  <Pressable onPress={() => router.push('/signUp')}>
                    <Text style={styles.footerLink}>Sign up</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: widthPercentage(6),
  },
  headerContainer: {
    marginTop: heightPercentage(10),
    marginBottom: heightPercentage(8),
  },
  title: {
    fontSize: 32,
    color: theme.colors.text,
    fontFamily: 'Inter-ExtraBold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.error || '#ff0000',
    fontFamily: 'Inter-Regular',
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.xl,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.xl,
    marginTop: 20,
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
  },
  footerLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontFamily: 'Inter-Bold',
  },
  backButton: {
    position: 'absolute',
    top: heightPercentage(2),
    left: widthPercentage(6),
    zIndex: 1,
  },
})