import { supabase } from '@/lib/supabase';
import { uploadFile } from './imageService';

interface CreateGroupParams {
  name: string;
  description?: string;
  imageUri?: string;
  isPrivate?: boolean;
}

export const createGroup = async ({
  name,
  description,
  imageUri,
  isPrivate = false,
}: CreateGroupParams) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    let imageUrl: string | undefined;

    // Upload image if provided
    if (imageUri) {
      const uploadResult = await uploadFile(
        'groups',
        imageUri,
        'image',
        userId
      );

      if (!uploadResult.success) {
        throw new Error('Failed to upload group image');
      }

      imageUrl = uploadResult.url;
    }

    // Start a transaction
    const { data: group, error: groupError } = await supabase.rpc('create_group_with_admin', {
      p_name: name,
      p_description: description,
      p_image_url: imageUrl,
      p_is_private: isPrivate,
      p_user_id: userId
    });

    if (groupError) throw groupError;

    return { success: true, data: group };
  } catch (error) {
    console.error('Error creating group:', error);
    return { success: false, error };
  }
}; 