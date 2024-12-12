import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '@/constants/theme';
import Modal from './Modal';
import Button from './Button';
import { createGroup } from '@/services/groupServices';
import { useToast } from '@/contexts/ToastContext';
import { router } from 'expo-router';

interface GroupCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GroupCreateModal({
  visible,
  onClose,
  onSuccess,
}: GroupCreateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.show('Please enter a group name', 'error');
      return;
    }

    try {
      setLoading(true);

      const result = await createGroup({
        name: name.trim(),
        description: description.trim(),
        imageUri: imageUri || undefined,
        isPrivate,
      });

      if (!result.success) {
        throw new Error('Failed to create group');
      }

      toast.show('Group created successfully!', 'success');
      onSuccess?.();
      handleClose();
      
      router.push(`/group/${result.data.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.show('Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setImageUri(null);
    setIsPrivate(false);
    onClose();
  };

  return (
    <Modal visible={visible} onClose={handleClose}>
      <View style={styles.container}>
        <Text style={styles.title}>Create New Group</Text>

        <Pressable style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={theme.colors.text} />
              <Text style={styles.imagePlaceholderText}>Add Group Image</Text>
            </View>
          )}
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Group Name"
          placeholderTextColor={theme.colors.textLight}
          value={name}
          onChangeText={setName}
          maxLength={50}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          placeholderTextColor={theme.colors.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Private Group</Text>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: theme.colors.darkLight, true: theme.colors.primary }}
            thumbColor={theme.colors.text}
          />
        </View>

        <Button
          title="Create Group"
          onPress={handleCreate}
          loading={loading}
          buttonStyle={styles.createButton}
          textStyle={styles.buttonText}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: theme.colors.text,
    marginBottom: 20,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.darkLight,
    alignSelf: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: theme.colors.text,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    padding: 16,
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    marginTop: 'auto',
  },
  buttonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
}); 