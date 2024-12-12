import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Dimensions,
  ActivityIndicator 
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { Post } from '@/types/post';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import PostActions from './PostActions';
import ChallengeOverlay from './ChallengeOverlay';
import { getValidMediaUrl } from '@/utils/mediaUtils';
import VideoControls from './VideoControls';
import { useChallenge } from '@/hooks/useChallenge';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

interface PostItemProps {
  post: Post;
  isActive: boolean;
}

const PostItem: React.FC<PostItemProps> = ({ post, isActive }) => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<Video>(null);
  const [duration, setDuration] = useState(0);

  const { challenge } = useChallenge(post.challenge_id);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [post.id]);

  useEffect(() => {
    const handleVideoState = async () => {
      if (!videoRef.current) return;

      if (isActive) {
        try {
          await videoRef.current.playAsync();
          if (!muted) {
            await videoRef.current.setVolumeAsync(1.0);
          }
          setIsPlaying(true);
        } catch (error) {
          console.error('Error playing video:', error);
        }
      } else {
        try {
          await videoRef.current.pauseAsync();
          setIsPlaying(false);
        } catch (error) {
          console.error('Error pausing video:', error);
        }
      }
    };

    handleVideoState();
  }, [isActive, muted]);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const isChallenge: boolean = Boolean(post.challenge_id || post.is_challenge_entry);
  const timeLeft = post.expires_at ? formatDistanceToNow(new Date(post.expires_at)) : null;

  const handleLoadError = () => {
    setError(true);
    setLoading(false);
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      const duration = status.durationMillis || 1;
      setProgress(status.positionMillis / duration);
    }
  };

  const handleVideoPress = () => {
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await videoRef.current?.pauseAsync();
    } else {
      await videoRef.current?.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = async (position: number) => {
    if (videoRef.current) {
      try {
        await videoRef.current.setPositionAsync(position);
      } catch (error) {
        console.error('Error seeking video:', error);
      }
    }
  };

  const renderMedia = () => {
    if (!post.content_url && post.content_type !== 'text') {
      return (
        <View style={[styles.media, styles.textContent]}>
          <Text style={styles.errorText}>Media not available</Text>
        </View>
      );
    }

    if (post.content_type === 'video') {
      return (
        <View style={styles.mediaContainer}>
          <Video
            ref={videoRef}
            source={{ uri: getValidMediaUrl(post.content_url) }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isActive}
            isLooping
            isMuted={muted}
            volume={1.0}
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              if (status.isLoaded) {
                setProgress(status.positionMillis / (status.durationMillis || 1));
                setIsPlaying(status.isPlaying);
              }
            }}
            onLoadStart={() => setLoading(true)}
            onLoad={async (status) => {
              console.log('Video loaded:', post.content_url);
              setLoading(false);
              setShowControls(true);
              if (status.isLoaded) {
                setDuration(status.durationMillis || 0);
              }
              if (videoRef.current) {
                await videoRef.current.setVolumeAsync(1.0);
              }
              setTimeout(() => setShowControls(false), 3000);
            }}
            onError={(error) => {
              console.error('Video error:', error);
              handleLoadError();
            }}
          />

          <Pressable 
            style={styles.videoOverlay} 
            onPress={handleVideoPress}
          >
            {showControls && (
              <VideoControls
                isMuted={muted}
                isPlaying={isPlaying}
                onMutePress={() => {
                  setMuted(!muted);
                  if (muted && videoRef.current) {
                    videoRef.current.setVolumeAsync(1.0);
                  }
                }}
                onPlayPause={togglePlayPause}
                progress={progress}
                onSeek={handleSeek}
                duration={duration}
              />
            )}
          </Pressable>
        </View>
      );
    } else if (post.content_type === 'image') {
      return (
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: getValidMediaUrl(post.content_url) }}
            style={styles.media}
            contentFit="cover"
            transition={300}
            onLoadStart={() => setLoading(true)}
            onLoad={() => {
              console.log('Image loaded:', post.content_url);
              setLoading(false);
            }}
            onError={(error) => {
              console.error('Image error:', error, 'URL:', post.content_url);
              handleLoadError();
            }}
            cachePolicy="memory-disk"
          />
        </View>
      );
    }
    
    return (
      <View style={[styles.media, styles.textContent]}>
        <Text style={styles.textPost}>{post.caption || 'No caption'}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMedia()}
      
      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      {error && (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Failed to load media</Text>
        </View>
      )}

      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          {timeLeft && (
            <View style={styles.expiryContainer}>
              <Ionicons name="time-outline" size={16} color="white" />
              <Text style={styles.expiryText}>Expires in {timeLeft}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomOverlay}>
          <View style={styles.userInfo}>
            <Image
              source={{ 
                uri: post.user?.avatar_url || 'https://your-default-avatar-url.png'
              }}
              style={styles.avatar}
              contentFit="cover"
              cachePolicy="memory-disk"
              placeholder={require('@/assets/images/default-avatar.png')}
            />
            <Text style={styles.username}>@{post.user?.username}</Text>
            <Text style={styles.caption}>{post.caption}</Text>
          </View>

          <PostActions 
            post={post}
            isChallenge={isChallenge}
          />
        </View>
      </View>

      {post.is_challenge_entry && post.challenge_id && (
        challenge ? (
          <ChallengeOverlay 
            challenge={challenge} 
            isEntry={post.is_challenge_entry}
          />
        ) : (
          <Text style={styles.errorText}>Challenge not found</Text>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: theme.colors.dark,
    position: 'relative',
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: theme.colors.darkLight,
    position: 'relative',
  },
  media: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.darkLight,
  },
  textContent: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPost: {
    color: theme.colors.text,
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 20,
  },
  topOverlay: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  expiryText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  bottomOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  userInfo: {
    flex: 1,
    marginRight: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  username: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  caption: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.darkLight,
  },
  muteButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});

export default PostItem; 