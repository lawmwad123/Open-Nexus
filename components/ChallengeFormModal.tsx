import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import Button from './Button';
import { Image } from 'expo-image';
import { createChallenge } from '@/services/challengeService';
import { useToast } from '@/hooks/useToast';
import { uploadMedia, MediaType } from '@/services/mediaService';
import { useAuth } from '@/contexts/AuthContext';

interface ChallengeFormModalProps {
  visible: boolean;
  onClose: () => void;
  mediaType: MediaType;
  mediaUrl: string | null;
  onSuccess?: () => void;
}

const ChallengeFormModal = ({ 
  visible, 
  onClose, 
  mediaType,
  mediaUrl,
  onSuccess 
}: ChallengeFormModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('24'); // Duration in hours
  const [loading, setLoading] = useState(false);
  const { show: showToast } = useToast();
  const { userData } = useAuth();

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Calculate end date based on duration
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + parseInt(duration));

      const result = await createChallenge({
        title: title.trim(),
        description: description.trim(),
        end_date: endDate.toISOString(),
        media_type: mediaType,
        media_url: mediaUrl || '',
      });

      if (!result.success) {
        throw new Error('Failed to create challenge');
      }

      showToast('Challenge created successfully!', 'success');
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating challenge:', error);
      showToast(error instanceof Error ? error.message : 'Failed to create challenge', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDuration('24');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Challenge</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.form}
            showsVerticalScrollIndicator={false}
          >
            {/* Media Preview */}
            {mediaUrl && (
              <View style={styles.mediaPreview}>
                <Image
                  source={{ uri: mediaUrl }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              </View>
            )}

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter challenge title"
                placeholderTextColor={theme.colors.textLight}
                value={title}
                onChangeText={setTitle}
                maxLength={50}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your challenge"
                placeholderTextColor={theme.colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>

            {/* Duration Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Duration (hours)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter duration in hours"
                placeholderTextColor={theme.colors.textLight}
                value={duration}
                onChangeText={text => setDuration(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.durationHint}>
                Challenge will end in {duration} hours
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              title="Create Challenge"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !title.trim() || !description.trim()}
              buttonStyle={styles.submitButton}
              textStyle={styles.submitButtonText}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.colors.dark,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.darkLight,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    padding: 12,
    color: theme.colors.text,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 24,
    marginBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  durationHint: {
    color: theme.colors.textLight,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
});

export default ChallengeFormModal; 