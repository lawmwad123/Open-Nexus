import { View, Text, StatusBar } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, Stack } from 'expo-router'
import * as Font from 'expo-font';
import Loading from '@/components/Loading';
import { theme } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { getUserData } from '@/services/userServices';
import Toast from 'react-native-toast-message';

// Separate component for the main app layout
const RootLayoutNav = () => {
  const { setAuth, setUserData } = useAuth();

  useEffect(() => {

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if(session){
            setAuth(session?.user)
            updateUserData(session?.user.id)
            router.replace('/home')
        } else {
            setAuth(null)
            router.replace('/Welcome')
        }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, []);
  const updateUserData = async (userId: string) => {
    let res = await getUserData(userId)
    if(res?.success){
        setUserData(res.data)
    }
  }
  return (
    <>
      <StatusBar hidden={true} />
      <Stack 
        screenOptions={{
          headerShown: false
        }}
      />
    </>
  )
}

// Root layout component
const Layout = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Inter-Bold': require('../assets/fonts/Inter_18pt-Bold.ttf'),
          'Inter-Regular': require('../assets/fonts/Inter_18pt-Regular.ttf'),
          'Inter-ExtraBold': require('../assets/fonts/Inter_18pt-ExtraBold.ttf'),
        });
        setFontsLoaded(true);
      } catch (err) {
        setError(err as Error);
      }
    }
    loadFonts();
  }, []);

  if (error) {
    // You should create an Error component to handle this case
    return <Text>Error loading fonts: {error.message}</Text>;
  }

  if (!fontsLoaded) {
    return <Loading size={100} color={theme.colors.primary} />;
  }

  return (
    <>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
      <Toast />
    </>
  )
}

export default Layout