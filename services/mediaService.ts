import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';

export type MediaType = 'image' | 'video' | 'audio' | 'text';

interface UploadMediaResult {
  success: boolean;
  url?: string;
  error?: unknown;
}

const BUCKET_NAME = 'posts';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const uploadMedia = async (
  uri: string,
  mediaType: MediaType,
  userId?: string
): Promise<UploadMediaResult> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Check file size
    if (fileInfo.size > MAX_FILE_SIZE) {
      throw new Error('File is too large');
    }

    // Compress image if needed
    let finalUri = uri;
    if (mediaType === 'image') {
      const compressResult = await compressImage(uri);
      finalUri = compressResult.uri;
    }

    // Read file
    const fileData = await FileSystem.readAsStringAsync(finalUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate file path
    const extension = finalUri.split('.').pop()?.toLowerCase() || '';
    const filePath = `${userId}/${Date.now()}.${extension}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, decode(fileData), {
        contentType: getContentType(mediaType, extension),
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error uploading media:', error);
    return { success: false, error };
  }
};

const compressImage = async (uri: string) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1080 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result;
  } catch (error) {
    console.error('Image compression error:', error);
    return { uri }; // Return original if compression fails
  }
};

const getContentType = (mediaType: MediaType, extension: string): string => {
  switch (mediaType) {
    case 'image':
      return `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    case 'video':
      return 'video/mp4';
    case 'audio':
      return 'audio/mpeg';
    default:
      return 'application/octet-stream';
  }
}; 