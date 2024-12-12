import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  BackHandler,
  Platform,
  TouchableOpacity
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera } from 'expo-camera';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Video, AVPlaybackStatus, VideoProps } from 'expo-av';
import { useToast } from '@/contexts/ToastContext';

// Custom Components and Utilities
import ScreenWrapper from '@/components/ScreenWrapper';
import Button from '@/components/Button';
import { MediaTypeToggle } from '@/components/camera/MediaTypeToggle';
import { theme } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCameraStore } from '@/store/cameraStore';
import { getUserImageSrc } from '@/services/imageService';
import { heightPercentage, widthPercentage } from '@/helpers/common';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import MediaSelectionModal from '@/components/MediaSelectionModal';
import UploadTypeSelectionModal from '@/components/UploadTypeSelectionModal';
import { createPost } from '@/services/contentServices';
import { uploadFile } from '@/services/imageService';
import Toast from 'react-native-toast-message';
import ChallengeFormModal from '@/components/ChallengeFormModal';
import { createChallenge } from '@/services/challengeServices';
import { router } from 'expo-router';

// Types
type MediaType = 'image' | 'video' | 'text';
type RecordingState = 'idle' | 'recording' | 'paused';

// Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_VIDEO_DURATION = 60; // seconds
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const Create = () => {
  // State Management
  const { userData } = useAuth();
  const [mediaType, setMediaType] = useState<MediaType>('text');
  const [caption, setCaption] = useState('');
  const [duration, setDuration] = useState('24');
  const [mediaSource, setMediaSource] = useState<string | null>(null);
  const [mediaThumbnail, setMediaThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showUploadTypeModal, setShowUploadTypeModal] = useState(false);
  const [uploadType, setUploadType] = useState<'post' | 'challenge'>('post');
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const { show: showToast } = useToast();

  // Refs and Hooks
  const cameraRef = useRef<CameraView>(null);
  const recordingTimer = useRef<NodeJS.Timeout>();
  const [permission, requestPermission] = useCameraPermissions();
  const { 
    isFlashOn, 
    toggleFlash, 
    setShowCamera, 
    showCamera 
  } = useCameraStore();

  // Lifecycle and Side Effects
  useEffect(() => {
    return () => {
      setShowCamera(false);
      clearTimeout(recordingTimer.current);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_VIDEO_DURATION) {
            handleStopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recordingState]);

  // Back Button Handler
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showCamera) {
          handleCloseCamera();
          return true;
        }
        return false;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [showCamera])
  );

  // Media Validation
  const validateMediaFile = async (uri: string) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      if (!fileInfo.exists || !('size' in fileInfo)) {
        console.error('File does not exist or size information is unavailable');
        return false;
      }

      if (fileInfo.size > MAX_VIDEO_SIZE) {
        Alert.alert('File Too Large', 'Video must be less than 100 MB');
        return false;
      }

      // For videos, we'll skip duration validation for now since it's causing issues
      // The server-side should handle duration validation if needed
      return true;
    } catch (error) {
      console.error('Media validation error:', error);
      return false;
    }
  };

  // Thumbnail Generation
  const generateVideoThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 0,
        quality: 0.8,
      });
      setMediaThumbnail(uri);
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
      // Don't set thumbnail if generation fails - let the caller handle it
      throw error;
    }
  };

  // Media Selection
  const handleMediaSelect = async (mediaTypeOption: ImagePicker.MediaTypeOptions = ImagePicker.MediaTypeOptions.All) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypeOption,
        allowsEditing: true,
        quality: 1,
        base64: false,
        exif: false,
        presentationStyle: 'fullScreen',
        videoMaxDuration: MAX_VIDEO_DURATION,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        
        // Validate file
        const isValid = await validateMediaFile(selectedAsset.uri);
        if (!isValid) return;

        // Set media source
        setMediaSource(selectedAsset.uri);
        
        // Set media type based on the file
        const fileType = selectedAsset.type === 'video' ? 'video' : 'image';
        setMediaType(fileType);
        
        // Generate thumbnail for videos
        if (fileType === 'video') {
          try {
            await generateVideoThumbnail(selectedAsset.uri);
          } catch (error) {
            console.error('Thumbnail generation error:', error);
            setMediaThumbnail(selectedAsset.uri);
          }
        }

        setShowCamera(false);
      }
    } catch (error) {
      console.error('Media selection error:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  // Camera Capture
  const handleCameraCapture = async () => {
    if (!cameraRef.current) {
      console.error('Camera reference is not set.');
      return;
    }

    try {
      if (mediaType === 'video') {
        if (recordingState === 'idle') {
          if (!permission?.granted) {
            Alert.alert('Permission Required', 'Camera permission is required to record video.');
            return;
          }

          console.log('Starting video recording...');
          setRecordingState('recording');

          setTimeout(async () => {
            try {
              const video = await cameraRef.current?.recordAsync({
                maxDuration: MAX_VIDEO_DURATION,
                quality: Camera.Constants.VideoQuality['2160p'],
                codec: Camera.Constants.VideoCodec.H264,
                mirror: false,
              });

              if (video) {
                console.log('Video recorded successfully:', video.uri);
                const isValid = await validateMediaFile(video.uri);
                if (isValid) {
                  setMediaSource(video.uri);
                  await generateVideoThumbnail(video.uri);
                  setRecordingState('idle');
                  setShowCamera(false);
                } else {
                  await FileSystem.deleteAsync(video.uri, { idempotent: true });
                }
              }
            } catch (recordError) {
              console.error('Video recording error:', recordError);
              Alert.alert('Recording Failed', 'Unable to record video. Please try again.');
              setRecordingState('idle');
            }
          }, 1000);
        } else {
          await handleStopRecording();
        }
      } else {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
          skipProcessing: true,
          exif: false,
        });
        
        if (photo) {
          setMediaSource(photo.uri);
          handleCloseCamera();
        }
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', `Failed to ${mediaType === 'video' ? 'record video' : 'take photo'}`);
      setRecordingState('idle');
    }
  };

  // Stop Recording
  const handleStopRecording = async () => {
    if (!cameraRef.current || recordingState !== 'recording') return;

    try {
      await cameraRef.current.stopRecording();
      setRecordingState('idle');
      if (recordingTimer.current) {
        clearTimeout(recordingTimer.current);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Camera and Close Handlers
  const handleCameraPress = () => {
    setMediaType('image');
    setShowCamera(true);
  };

  const handleVideoPress = () => {
    setMediaType('video');
    handleMediaSelect(ImagePicker.MediaTypeOptions.Videos);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
    setMediaType('text');
    if (recordingState === 'recording') {
      handleStopRecording();
    }
  };

  // Post Submission
  const handleCreatePost = async () => {
    if (!mediaSource && mediaType !== 'text') {
      showToast('Please select media to upload', 'error');
      return;
    }

    try {
      setPostLoading(true);
      
      let contentUrl = mediaSource;
      if (mediaSource && mediaSource.startsWith('file://')) {
        const uploadResult = await uploadMedia(
          mediaSource,
          mediaType,
          userData?.id
        );
        if (!uploadResult.success) {
          throw new Error('Failed to upload media');
        }
        contentUrl = uploadResult.url;
      }

      const result = await createPost({
        content_type: mediaType,
        content_url: contentUrl,
        caption,
        duration_hours: parseInt(duration),
        is_challenge_entry: false
      });

      if (!result.success) {
        throw new Error('Failed to create post');
      }

      // Reset form
      setMediaSource(null);
      setMediaThumbnail(null);
      setCaption('');
      setDuration('24');
      setMediaType('text');

      showToast('Post created successfully!', 'success');
      router.push('/');

    } catch (error) {
      console.error('Error creating post:', error);
      showToast('Failed to create post', 'error');
    } finally {
      setPostLoading(false);
    }
  };

  const handleMediaTypeSelect = () => {
    setShowMediaModal(true);
  };

  const handleMediaOptionSelect = async (option: 'takePhoto' | 'takeVideo' | 'choosePhoto' | 'chooseVideo') => {
    setShowMediaModal(false);

    switch (option) {
      case 'takePhoto':
        setMediaType('image');
        setShowCamera(true);
        break;
      case 'takeVideo':
        setMediaType('video');
        setShowCamera(true);
        break;
      case 'choosePhoto':
        await handleMediaSelect(ImagePicker.MediaTypeOptions.Images);
        break;
      case 'chooseVideo':
        await handleMediaSelect(ImagePicker.MediaTypeOptions.Videos);
        break;
    }
  };

  const handleUploadTypeSelect = (type: 'post' | 'challenge') => {
    setUploadType(type);
    setShowUploadTypeModal(false);
    handlePost();
  };

  const handleCreateChallenge = async (challengeData: {
    title: string;
    description: string;
    endDate: Date;
    mediaType: 'video' | 'image' | 'audio';
  }) => {
    try {
      const result = await createChallenge(challengeData);
      if (result.success) {
        showToast('Challenge created successfully!', 'success');
        setShowChallengeModal(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      showToast('Failed to create challenge', 'error');
      console.error('Error creating challenge:', error);
    }
  };

  // Render Methods
  const renderMediaPreview = () => {
    if (showCamera) {
      return renderCameraView();
    }

    if (mediaSource) {
      return (
        <View style={styles.previewContainer}>
          {mediaType === 'video' ? (
            <CustomVideoPlayer 
              uri={mediaSource}
              onCropPress={() => {
                console.log('Crop video');
              }}
            />
          ) : (
            <Image 
              source={{ uri: mediaThumbnail || mediaSource }}
              style={styles.mediaPreview}
              contentFit="contain"
              contentPosition="center"
            />
          )}
          <Pressable 
            style={styles.removeMedia}
            onPress={() => {
              setMediaSource(null);
              setMediaThumbnail(null);
            }}
          >
            <Ionicons name="close-circle" size={24} color={theme.colors.text} />
          </Pressable>
        </View>
      );
    }

    return (
      <Pressable 
        style={styles.placeholderContainer} 
        onPress={handleMediaTypeSelect}
      >
        <Image 
          source={require('@/assets/images/placeholder.png')}
          style={styles.placeholderImage}
          contentFit="cover"
        />
        <View style={styles.placeholderOverlay}>
          <Ionicons 
            name="add-circle-outline" 
            size={48} 
            color={theme.colors.text} 
          />
          <Text style={styles.placeholderText}>Add Photo or Video</Text>
        </View>
      </Pressable>
    );
  };

  const renderCameraView = () => {
    if (!permission?.granted) {
      return (
        <View style={styles.cameraContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <Button 
            title="Grant Permission"
            onPress={requestPermission}
            buttonStyle={styles.permissionButton}
            textStyle={styles.permissionButtonText}
            loading={false}
            hasShadow
          />
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.cameraOverlay} pointerEvents="box-none">
            <MediaTypeToggle 
              mediaType={mediaType === 'text' ? 'image' : mediaType}
              onChangeType={setMediaType}
            />
            
            <View style={styles.sideControls}>
              <Pressable 
                style={styles.sideButton}
                onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
              >
                <Ionicons name="camera-reverse" size={24} color={theme.colors.text} />
                <Text style={styles.sideButtonText}>Flip</Text>
              </Pressable>

              <Pressable 
                style={styles.sideButton}
                onPress={toggleFlash}
              >
                <Ionicons 
                  name={isFlashOn ? "flash" : "flash-off"} 
                  size={24} 
                  color={theme.colors.text} 
                />
                <Text style={styles.sideButtonText}>Flash</Text>
              </Pressable>
            </View>

            <View style={styles.bottomControls}>
              <Pressable 
                style={[
                  styles.captureButton,
                  recordingState === 'recording' && styles.recordingButton
                ]}
                onPress={handleCameraCapture}
              />
            </View>

            <Pressable 
              style={styles.closeButton}
              onPress={handleCloseCamera}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </CameraView>
      </View>
    );
  };

  return (
    <ScreenWrapper bgColor={theme.colors.dark} style={styles.wrapper}>
      {showCamera ? (
        <View style={styles.fullScreenWrapper}>
          {renderCameraView()}
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          contentInset={{ bottom: 80 }}
          style={{ marginBottom: 80 }}
        >
          <View style={styles.mediaSection}>
            {mediaSource ? (
              <View style={styles.previewContainer}>
                {mediaType === 'video' ? (
                  <CustomVideoPlayer 
                    uri={mediaSource}
                    onCropPress={() => {
                      console.log('Crop video');
                    }}
                  />
                ) : (
                  <Image 
                    source={{ uri: mediaThumbnail || mediaSource }}
                    style={styles.mediaPreview}
                    contentFit="contain"
                    contentPosition="center"
                  />
                )}
                <Pressable 
                  style={styles.removeMedia}
                  onPress={() => {
                    setMediaSource(null);
                    setMediaThumbnail(null);
                  }}
                >
                  <Ionicons name="close-circle" size={24} color={theme.colors.text} />
                </Pressable>
              </View>
            ) : (
              <Pressable 
                style={styles.placeholderContainer} 
                onPress={handleMediaTypeSelect}
              >
                <Image 
                  source={require('@/assets/images/placeholder.png')}
                  style={styles.placeholderImage}
                  contentFit="cover"
                />
                <View style={styles.placeholderOverlay}>
                  <Ionicons 
                    name="add-circle-outline" 
                    size={48} 
                    color={theme.colors.text} 
                  />
                  <Text style={styles.placeholderText}>Add Photo or Video</Text>
                </View>
              </Pressable>
            )}
          </View>

          <View style={styles.captionSection}>
            <View style={styles.captionHeader}>
              <Image 
                source={getUserImageSrc(userData?.avatar_url)}
                style={styles.avatar}
                contentFit="cover"
              />
              <Text style={styles.captionLabel}>Write a caption...</Text>
            </View>
            <TextInput
              style={styles.captionInput}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.colors.textLight}
              multiline
              value={caption}
              onChangeText={setCaption}
            />
          </View>

          <View style={styles.durationSection}>
            <Text style={styles.sectionTitle}>Post Duration</Text>
            <View style={styles.durationInputContainer}>
              <TextInput
                style={styles.durationInput}
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
                maxLength={2}
              />
              <Text style={styles.durationUnit}>hours</Text>
            </View>
            <Text style={styles.durationHint}>
              Your post will disappear after {duration} hours
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button 
              title="Post"
              onPress={handleCreatePost}
              loading={postLoading}
              buttonStyle={[styles.actionButton, styles.postButton]}
              textStyle={styles.buttonText}
            />
            <Button 
              title="Challenge"
              onPress={() => setShowChallengeForm(true)}
              buttonStyle={[styles.actionButton, styles.challengeButton]}
              textStyle={styles.buttonText}
            />
          </View>
        </ScrollView>
      )}

      <MediaSelectionModal 
        visible={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelectOption={handleMediaOptionSelect}
      />

      <ChallengeFormModal
        visible={showChallengeForm}
        onClose={() => setShowChallengeForm(false)}
        mediaType={mediaType}
        mediaUrl={mediaSource}
        onSuccess={() => {
          // Reset form after successful challenge creation
          setMediaSource(null);
          setMediaThumbnail(null);
          setCaption('');
          setDuration('24');
          setMediaType('text');
          router.push('/challenges');
        }}
      />
    </ScreenWrapper>
  );
};
export default Create;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 100,
  },
  mediaSection: {
    marginBottom: 20,
  },
  placeholderContainer: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  previewContainer: {
    width: '100%',
    minHeight: 300,
    maxHeight: 500,
    borderRadius: theme.radius.lg,
    position: 'relative',
    backgroundColor: theme.colors.darkLight,
    overflow: 'hidden',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radius.lg,
    resizeMode: 'contain',
  },
  removeMedia: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  captionSection: {
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    padding: 15,
    marginBottom: 20,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  captionLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  captionInput: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  durationSection: {
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginBottom: 10,
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  durationInput: {
    backgroundColor: theme.colors.dark,
    borderRadius: theme.radius.md,
    padding: 12,
    color: theme.colors.text,
    fontFamily: 'Inter-Regular',
    width: 80,
    textAlign: 'center',
  },
  durationUnit: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  durationHint: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  postButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  postButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  cameraPermission: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    width: '100%',
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  fullScreenWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  sideControls: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
    alignItems: 'center',
    gap: 30,
    zIndex: 2,
  },
  sideButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  captureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.text,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  recordingButton: {
    backgroundColor: theme.colors.error,
    transform: [{ scale: 0.9 }],
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timerContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 2,
  },
  timerText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  actionButton: {
    flex: 1,
    height: 50,
  },
  postButton: {
    backgroundColor: theme.colors.primary,
  },
  challengeButton: {
    backgroundColor: theme.colors.secondary,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  uploadTypeContainer: {
    padding: 20,
    gap: 20,
  },
  uploadOption: {
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.xl,
    padding: 20,
    gap: 12,
  },
  uploadIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOptionTitle: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
  },
  uploadOptionDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
  },
});