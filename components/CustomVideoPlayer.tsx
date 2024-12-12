import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
  Animated
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface CustomVideoPlayerProps {
  uri: string;
  onCropPress?: () => void;
  style?: any;
}

interface SeekIndicatorProps {
  visible: boolean;
  direction: 'forward' | 'backward';
  style?: any;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DOUBLE_TAP_DELAY = 300;
const SEEK_INTERVAL = 10000; // 10 seconds

const SeekIndicator = ({ visible, direction, style }: SeekIndicatorProps) => {
  if (!visible) return null;

  return (
    <View style={[styles.seekIndicator, style]}>
      <View style={styles.seekIndicatorContent}>
        <Ionicons 
          name={direction === 'forward' ? 'play-forward' : 'play-back'} 
          size={24} 
          color={theme.colors.text} 
        />
        <Text style={styles.seekIndicatorText}>
          {direction === 'forward' ? '+' : '-'}10s
        </Text>
      </View>
    </View>
  );
};

const CustomVideoPlayer = ({ uri, onCropPress, style }: CustomVideoPlayerProps) => {
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [lastTap, setLastTap] = useState(0);
  const [lastTapX, setLastTapX] = useState(0);
  const progressBarRef = useRef<View>(null);
  const [showForwardIndicator, setShowForwardIndicator] = useState(false);
  const [showBackwardIndicator, setShowBackwardIndicator] = useState(false);

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    let timeout: NodeJS.Timeout;
    if (showControls && isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, isPlaying]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setShowControls(true);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleSeek = async (event: GestureResponderEvent) => {
    if (!videoRef.current || !progressBarRef.current) return;
    
    try {
      progressBarRef.current.measure((x, y, width) => {
        if (width) {
          const progress = (event.nativeEvent.locationX) / width;
          const newPosition = progress * duration;
          if (newPosition >= 0 && newPosition <= duration) {
            videoRef.current?.setPositionAsync(newPosition);
          }
        }
      });
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleVideoPress = (event: GestureResponderEvent) => {
    const currentTime = new Date().getTime();
    const tapX = event.nativeEvent.locationX;
    const screenCenter = SCREEN_WIDTH / 2;

    if (currentTime - lastTap < DOUBLE_TAP_DELAY && Math.abs(tapX - lastTapX) < 50) {
      // Double tap detected
      if (!videoRef.current) return;

      if (tapX < screenCenter) {
        // Double tap on left side - rewind
        const newPosition = Math.max(0, position - SEEK_INTERVAL);
        videoRef.current.setPositionAsync(newPosition);
        setShowBackwardIndicator(true);
        setTimeout(() => setShowBackwardIndicator(false), 500);
      } else {
        // Double tap on right side - forward
        const newPosition = Math.min(duration, position + SEEK_INTERVAL);
        videoRef.current.setPositionAsync(newPosition);
        setShowForwardIndicator(true);
        setTimeout(() => setShowForwardIndicator(false), 500);
      }
    } else {
      // Single tap - toggle controls
      setShowControls(!showControls);
    }

    setLastTap(currentTime);
    setLastTapX(tapX);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handleVideoPress}
        style={styles.videoContainer}
      >
        <Video
          ref={videoRef}
          style={styles.video}
          source={{ uri }}
          resizeMode={ResizeMode.COVER}
          isLooping
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          useNativeControls={false}
        />
        
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {showControls && (
          <View style={styles.controlsOverlay}>
            <TouchableOpacity 
              style={styles.playPauseButton} 
              onPress={togglePlayPause}
            >
              <Ionicons 
                name={isPlaying ? 'pause' : 'play'} 
                size={32} 
                color={theme.colors.text} 
              />
            </TouchableOpacity>

            <View style={styles.bottomControls}>
              <View style={styles.timeContainer}>
                <View 
                  ref={progressBarRef}
                  style={styles.progressBarContainer}
                >
                  <TouchableOpacity 
                    style={styles.progressBar}
                    onPress={handleSeek}
                  >
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(position / duration) * 100}%` }
                      ]} 
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeText}>{formatTime(position)}</Text>
                  <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
              </View>

              {onCropPress && (
                <TouchableOpacity 
                  style={styles.cropButton} 
                  onPress={onCropPress}
                >
                  <Ionicons name="crop" size={24} color={theme.colors.text} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <SeekIndicator 
          visible={showBackwardIndicator} 
          direction="backward"
          style={styles.leftSeekIndicator}
        />
        <SeekIndicator 
          visible={showForwardIndicator} 
          direction="forward"
          style={styles.rightSeekIndicator}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16/22,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.dark,
  },
  videoContainer: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1,
  },
  playPauseButton: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      { translateX: -30 },
      { translateY: -30 }
    ],
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  bottomControls: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  timeContainer: {
    flex: 1,
    marginRight: 15,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  cropButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekIndicator: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -25 }],
    width: 80,
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  leftSeekIndicator: {
    left: 20,
  },
  rightSeekIndicator: {
    right: 20,
  },
  seekIndicatorContent: {
    alignItems: 'center',
    gap: 4,
  },
  seekIndicatorText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
});

export default CustomVideoPlayer; 