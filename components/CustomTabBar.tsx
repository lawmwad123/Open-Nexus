import { StyleSheet, View, Pressable, Animated } from 'react-native'
import React from 'react'
import { theme } from '@/constants/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar = ({ state, descriptors, navigation }: TabBarProps) => {
  const router = useRouter()

  const getIconName = (routeName: string, isFocused: boolean): keyof typeof Ionicons.glyphMap => {
    switch (routeName) {
      case '(tabs)/home':
        return isFocused ? 'home' : 'home-outline'
      case '(tabs)/groups':
        return isFocused ? 'people' : 'people-outline'
      case '(tabs)/create':
        return 'add-circle'
      case '(tabs)/challenges':
        return isFocused ? 'trophy' : 'trophy-outline'
      case '(tabs)/profile':
        return isFocused ? 'person' : 'person-outline'
      default:
        return 'home-outline'
    }
  }

  return (
    <View style={styles.container}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        const isCreateTab = route.name === '(tabs)/create'

        const iconColor = isCreateTab 
          ? theme.colors.text 
          : isFocused 
            ? theme.colors.primary 
            : theme.colors.textLight

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            router.push(route.name)
          }
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[
              styles.tab,
              isCreateTab && styles.createTab,
            ]}
          >
            <Animated.View>
              <Ionicons
                name={getIconName(route.name, isFocused)}
                size={isCreateTab ? 32 : 24}
                color={iconColor}
              />
            </Animated.View>
          </Pressable>
        )
      })}
    </View>
  )
}

export default CustomTabBar

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.darkLight,
    height: 60,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  createTab: {
    backgroundColor: theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: -30,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
}) 