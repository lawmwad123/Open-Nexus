import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export const downloadMedia = async (url: string, contentType: 'image' | 'video'): Promise<boolean> => {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission not granted');
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = contentType === 'video' ? 'mp4' : 'jpg';
    const filename = `nexus_${timestamp}.${extension}`;
    const fileUri = `${FileSystem.cacheDirectory}${filename}`;

    // Download file
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`Download progress: ${progress * 100}%`);
      }
    );

    const { uri } = await downloadResumable.downloadAsync();
    if (!uri) throw new Error('Download failed');

    // Save to media library
    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync('Nexus', asset, false);

    // Clean up cache
    await FileSystem.deleteAsync(uri, { idempotent: true });

    return true;
  } catch (error) {
    console.error('Error downloading media:', error);
    throw error;
  }
}; 