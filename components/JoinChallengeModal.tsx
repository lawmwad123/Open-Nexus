import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal,
  Dimensions,
  Platform
} from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/constants/theme';
import { MediaType } from '@/services/mediaService';
import MediaTypeSelection from './MediaTypeSelection';
import CameraView from './CameraView';
import { joinChallenge } from '@/services/challengeService';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface JoinChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  challengeId: string;
  onSuccess?: () => void;
}

export const JoinChallengeModal = ({ 
  visible, 
  onClose,
  challengeId,
  onSuccess 
}: JoinChallengeModalProps) => {
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useToast();
  const { userData } = useAuth();

  const handleMediaTypeSelect = async (type: 'camera' | 'gallery') => {
    try {
      let mediaResult;

      if (type === 'camera') {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showToast('Camera permission is required', 'error');
          return;
        }
        setShowCamera(true);
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          allowsEditing: true,
          quality: 1,
          videoMaxDuration: 60,
        });

        if (!result.canceled) {
          await handleMediaUpload(result.assets[0].uri, 
            result.assets[0].type === 'video' ? 'video' : 'image'
          );
        }
      }
    } catch (error) {
      console.error('Error selecting media:', error);
      showToast('Failed to select media', 'error');
    }
  };

  const handleCameraCapture = async (mediaUri: string, type: MediaType) => {
    setShowCamera(false);
    await handleMediaUpload(mediaUri, type);
  };

  const handleMediaUpload = async (mediaUri: string, mediaType: MediaType) => {
    try {
      setLoading(true);

      const result = await joinChallenge({
        challengeId,
        mediaUri,
        mediaType,
        userId: userData?.id
      });

      if (!result.success) {
        if (result.error === 'You have already participated in this challenge') {
          showToast('You have already participated in this challenge', 'info', {
            duration: 3000,
            position: 'center'
          });
          onClose();
          return;
        }
        throw new Error(result.error || 'Failed to join challenge');
      }

      showToast('Successfully joined challenge!', 'success');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error joining challenge:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to join challenge',
        'error',
        {
          duration: 3000,
          position: 'center'
        }
      );
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <MediaTypeSelection
          onSelect={handleMediaTypeSelect}
          loading={loading}
          onClose={onClose}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
}); 