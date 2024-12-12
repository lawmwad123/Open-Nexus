import { supabase } from '@/lib/supabase';
import { MediaType, uploadMedia } from '@/services/mediaService';

export interface CreateChallengeData {
  title: string;
  description: string;
  end_date: string;
  media_url: string;
  media_type: 'video' | 'image';
}

export interface Challenge {
  id: string;
  caption: string;
  description: string;
  expires_at: string;
  user_id: string;
  content_url: string;
  content_type: string;
  created_at: string;
  is_challenge: boolean;
  entry_count: number;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export const createChallenge = async (data: CreateChallengeData) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    
    if (!session?.session?.user?.id) {
      throw new Error('Not authenticated');
    }

    // Start a transaction
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        content_type: data.media_type,
        content_url: data.media_url,
        caption: data.title,
        description: data.description,
        expires_at: data.end_date,
        user_id: session.session.user.id,
        is_challenge: true,
        is_challenge_entry: false,
        current_participants: 1 // Start with 1 participant (the creator)
      })
      .select()
      .single();

    if (postError) throw postError;

    // Add creator as first participant
    const { error: participantError } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: post.id,
        user_id: session.session.user.id,
        content_url: data.media_url,
        content_type: data.media_type,
        vote_count: 0
      });

    if (participantError) throw participantError;

    return { success: true, data: post };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { success: false, error };
  }
};

export const getChallenges = async () => {
  try {
    const { data: challenges, error } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles!inner(
          id,
          username,
          avatar_url
        ),
        entries:posts(count)
      `)
      .eq('is_challenge', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: challenges };
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return { success: false, error };
  }
}; 

interface JoinChallengeParams {
  challengeId: string;
  mediaUri: string;
  mediaType: MediaType;
  userId?: string;
}

export const joinChallenge = async ({ 
  challengeId, 
  mediaUri, 
  mediaType,
  userId 
}: JoinChallengeParams) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Check if user has already participated
    const { data: existingParticipation, error: checkError } = await supabase
      .from('challenge_participants')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
      .single();

    if (existingParticipation) {
      throw new Error('You have already participated in this challenge');
    }

    // Upload media
    const uploadResult = await uploadMedia(mediaUri, mediaType, userId);
    if (!uploadResult.success || !uploadResult.url) {
      throw new Error('Failed to upload media');
    }

    // Start a transaction
    const { error: participantError } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: challengeId,
        user_id: userId,
        content_url: uploadResult.url,
        content_type: mediaType,
        vote_count: 0
      });

    if (participantError) throw participantError;

    // Increment participant count
    const { error: updateError } = await supabase
      .from('posts')
      .update({ 
        current_participants: supabase.rpc('increment_counter', { row_id: challengeId })
      })
      .eq('id', challengeId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to join challenge'
    };
  }
}; 