import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from '@/lib/supabase'

export type BucketName = 'avatars' | 'posts' | 'groups'
export type FileType = 'image' | 'video'

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: Error;
}

export const getUserImageSrc = (imagePath?: string) => {
  if (imagePath) {
    return { uri: imagePath }
  }
  return require('@/assets/images/default-avatar.png')
}

export const uploadFile = async (
  bucket: BucketName,
  fileUri: string,
  fileType: FileType,
  userId: string
): Promise<UploadResponse> => {
  try {
    const fileName = generateFileName(userId, fileType);
    const filePath = `${bucket}/${fileName}`;
    const contentType = fileType === 'video' ? 'video/mp4' : 'image/jpeg';

    // Read file as base64
    const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64
    })

    // Convert to array buffer
    const fileData = decode(fileBase64)

    // Upload to Supabase storage
    const { error: uploadError, data } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileData, {
        contentType: contentType,
        upsert: true
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      success: true,
      url: publicUrl
    }

  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: error as Error
    }
  }
}

export const getSupabaseFileUrl = (bucket: BucketName, filePath: string) => {
    if(!filePath) return null
    return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
}

export const deleteFile = async (bucket: BucketName, filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

const generateFileName = (userId: string, fileType: FileType): string => {
  const timestamp = new Date().getTime()
  const extension = fileType === 'image' ? 'jpg' : 'mp4'
  return `${userId}-${timestamp}.${extension}`
}
