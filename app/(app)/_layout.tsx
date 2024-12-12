import { View } from 'react-native'
import React, { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { theme } from '@/constants/theme'
import CustomTabBar from '@/components/CustomTabBar'
import { useCameraStore } from '@/store/cameraStore'

const TabsLayout = () => {
  const { showCamera } = useCameraStore();
  
  useEffect(() => {
    console.log('TabsLayout: Camera state changed to:', showCamera);
  }, [showCamera]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          display: showCamera ? 'none' : 'flex',
        },
      }}
      tabBar={(props) => !showCamera && <CustomTabBar {...props} />}
    >
      <Tabs.Screen 
        name="(tabs)/home" 
        options={{
          title: 'Home'
        }}
      />
      <Tabs.Screen 
        name="(tabs)/groups" 
        options={{
          title: 'Groups'
        }}
      />
      <Tabs.Screen 
        name="(tabs)/create" 
        options={{
          title: 'Create'
        }}
      />
      <Tabs.Screen 
        name="(tabs)/challenges" 
        options={{
          title: 'Challenges'
        }}
      />
      <Tabs.Screen 
        name="(tabs)/profile" 
        options={{
          title: 'Profile'
        }}
      />
    </Tabs>
  )
}

export default TabsLayout 