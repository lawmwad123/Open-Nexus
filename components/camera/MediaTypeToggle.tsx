import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { theme } from '@/constants/theme';

type Props = {
  mediaType: 'image' | 'video';
  onChangeType: (type: 'image' | 'video') => void;
};

export const MediaTypeToggle = ({ mediaType, onChangeType }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.toggle}>
        <Animated.View 
          style={[
            styles.slider,
            { transform: [{ translateX: mediaType === 'video' ? 70 : 0 }] }
          ]}
        />
        <Pressable 
          style={styles.option} 
          onPress={() => onChangeType('image')}
        >
          <Text style={[
            styles.optionText,
            mediaType === 'image' && styles.activeText
          ]}>
            PHOTO
          </Text>
        </Pressable>
        <Pressable 
          style={styles.option} 
          onPress={() => onChangeType('video')}
        >
          <Text style={[
            styles.optionText,
            mediaType === 'video' && styles.activeText
          ]}>
            VIDEO
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 4,
    position: 'relative',
    width: 140,
  },
  slider: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 66,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 21,
  },
  option: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  optionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
  activeText: {
    color: theme.colors.text,
  },
}); 