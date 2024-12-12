import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Image, 
  TextInput, 
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface ImageCaptionModalProps {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
  onSend: (caption: string) => void;
}

export const ImageCaptionModal: React.FC<ImageCaptionModalProps> = ({
  visible,
  imageUri,
  onClose,
  onSend,
}) => {
  const [caption, setCaption] = useState('');

  const handleSend = () => {
    onSend(caption);
    setCaption('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Caption</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <Image 
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={caption}
              onChangeText={setCaption}
              placeholder="Add a caption..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              maxLength={200}
            />
            <Pressable 
              style={styles.sendButton} 
              onPress={handleSend}
            >
              <Ionicons name="send" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
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
    paddingTop: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: theme.colors.darkLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.darkLight,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    color: theme.colors.text,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 