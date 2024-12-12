import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated, LayoutRectangle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface VideoControlsProps {
  isMuted: boolean;
  isPlaying: boolean;
  onMutePress: () => void;
  onPlayPause: () => void;
  progress?: number;
  onSeek?: (position: number) => void;
  duration?: number;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isMuted,
  isPlaying,
  onMutePress,
  onPlayPause,
  progress = 0,
  onSeek,
  duration = 0,
}) => {
  const [progressBarLayout, setProgressBarLayout] = useState<LayoutRectangle | null>(null);
  const progressBarRef = useRef<View>(null);

  const handleProgressBarPress = (event: any) => {
    if (!onSeek || !duration || !progressBarLayout) return;

    const { locationX } = event.nativeEvent;
    const position = (locationX / progressBarLayout.width) * duration;
    onSeek(Math.max(0, Math.min(position, duration)));
  };

  const handleProgressBarLayout = (event: any) => {
    setProgressBarLayout(event.nativeEvent.layout);
  };

  return (
    <View style={styles.container}>
      <View style={styles.overlay}>
        {/* Centered Play/Pause Button */}
        <View style={styles.centerContainer}>
          <Pressable
            style={styles.playPauseButton}
            onPress={onPlayPause}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={50}
              color="white"
            />
          </Pressable>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Progress Bar */}
          <View 
            ref={progressBarRef}
            style={styles.progressContainer}
            onLayout={handleProgressBarLayout}
          >
            <View style={styles.progressBackground} />
            <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
            <Pressable 
              style={styles.progressBarTouchable}
              onPress={handleProgressBarPress}
            />
          </View>

          {/* Mute Button */}
          <Pressable
            style={styles.muteButton}
            onPress={onMutePress}
          >
            <Ionicons
              name={isMuted ? "volume-mute" : "volume-high"}
              size={24}
              color="white"
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginRight: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  progressBarTouchable: {
    ...StyleSheet.absoluteFillObject,
    height: 30, // Increased touch target
    top: -13, // Center the touch target vertically
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoControls; 