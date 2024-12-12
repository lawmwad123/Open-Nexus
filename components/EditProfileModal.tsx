import { StyleSheet, Text, View, Modal, TextInput, ScrollView, Pressable } from 'react-native'
import React, { useState, useEffect } from 'react'
import { theme } from '@/constants/theme'
import Button from './Button'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { updateUserProfile } from '@/services/userServices'
import { uploadFile } from '@/services/imageService'
import { useAuth } from '@/contexts/AuthContext'
import { heightPercentage, widthPercentage } from '@/helpers/common'
import Toast from 'react-native-toast-message'
import { Image } from 'expo-image'
import { getUserImageSrc } from '@/services/imageService'

interface EditProfileModalProps {
  visible: boolean
  onClose: () => void
  userData: any
}

const EditProfileModal = ({ visible, onClose, userData }: EditProfileModalProps) => {
  const { user, setUserData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone_number: '',
    address: '',
    bio: '',
    avatar_url: ''
  })

  const [imageSource, setImageSource] = useState(getUserImageSrc(userData?.avatar_url))

  useEffect(() => {
    if (userData) {
      setFormData({
        full_name: userData.full_name || '',
        username: userData.username || '',
        phone_number: userData.phone_number || '',
        address: userData.address || '',
        bio: userData.bio || '',
        avatar_url: userData.avatar_url || ''
      })
      setImageSource(getUserImageSrc(userData.avatar_url))
    }
  }, [userData])

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    })
    if(!result.canceled) {
      const newImageUri = result.assets[0].uri
      setFormData(prev => ({...prev, avatar_url: newImageUri}))
      setImageSource(getUserImageSrc(newImageUri))
    }
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Username is required'
      })
      return false
    }
    if (!formData.full_name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Full name is required'
      })
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm() || !user?.id) return

    try {
      setLoading(true)

      // Upload new avatar if changed
      if (formData.avatar_url && formData.avatar_url !== userData?.avatar_url) {
        const uploadResult = await uploadFile(
          'avatars',
          formData.avatar_url,
          'image',
          user.id
        )

        if (!uploadResult.success) {
          throw new Error(uploadResult.error?.message || 'Failed to upload image')
        }

        formData.avatar_url = uploadResult.url || ''
      }

      const { success, data, error } = await updateUserProfile(user.id, formData)

      if (success && data) {
        setUserData(data)
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Profile updated successfully'
        })
        onClose()
      } else {
        throw new Error(error?.message || 'Failed to update profile')
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An unexpected error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.avatarContainer}>
              <Image 
                source={imageSource}
                style={styles.avatar}
                transition={100}
              />
              <Pressable style={styles.changeAvatarButton} onPress={pickImage}>
                <Text style={styles.changeAvatarText}>Change Photo</Text>
              </Pressable>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={formData.phone_number}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
                placeholderTextColor={theme.colors.textLight}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholderTextColor={theme.colors.textLight}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={4}
              />
            </View>

            <Button
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              buttonStyle={styles.saveButton}
              textStyle={styles.saveButtonText}
              hasShadow={true}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

export default EditProfileModal

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.dark,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: widthPercentage(6),
    paddingBottom: heightPercentage(4),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: heightPercentage(2),
  },
  modalTitle: {
    fontSize: 20,
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: heightPercentage(2),
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changeAvatarButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: theme.radius.xl,
  },
  changeAvatarText: {
    color: theme.colors.text,
    fontFamily: 'Inter-Bold',
  },
  inputContainer: {
    marginBottom: heightPercentage(2),
  },
  label: {
    fontSize: 14,
    color: theme.colors.textLight,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.darkLight,
    borderRadius: theme.radius.lg,
    padding: 12,
    color: theme.colors.text,
    fontFamily: 'Inter-Regular',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.xl,
    marginTop: heightPercentage(2),
  },
  saveButtonText: {
    color: theme.colors.text,
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
}) 