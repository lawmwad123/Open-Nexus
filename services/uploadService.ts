import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export type FileType = 'image' | 'video';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: any;
}

export const uploadFile = async (
  bucket: string,
  uri: string,
  fileType: FileType,
  userId: string
): Promise<UploadResult> => {
  try {
    const timestamp = Date.now();
    const extension = uri.split('.').pop()?.toLowerCase() || (fileType === 'video' ? 'mp4' : 'jpg');
    const filename = `${userId}-${timestamp}.${extension}`;
    const filePath = filename;

    // Read the file
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    let fileBase64: string;
    try {
      const result = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileBase64 = result;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, decode(fileBase64), {
        contentType: fileType === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('Upload successful, public URL:', publicUrl);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error,
    };
  }
};

export const uploadImage = async (uri: string, folder: string): Promise<string> => {
  try {
    const filename = uri.split('/').pop() || '';
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const path = `${folder}/${Date.now()}.${extension}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename,
      type: `image/${extension}`,
    } as any);

    const { data, error } = await supabase.storage
      .from('media')
      .upload(path, formData);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}; 