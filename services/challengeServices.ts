import { supabase } from '@/lib/supabase';

interface CreateChallengeData {
  title: string;
  description: string;
  endDate: Date;
  mediaType: 'video' | 'image' | 'audio';
}

export const createChallenge = async (data: CreateChallengeData) => {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title: data.title,
        description: data.description,
        start_time: new Date().toISOString(),
        end_time: data.endDate.toISOString(),
        media_type: data.mediaType,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: challenge };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { success: false, error };
  }
};

export const completeChallenge = async (challengeId: string) => {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*, count(votes) as vote_count')
      .eq('challenge_id', challengeId)
      .group('id');

    if (error) throw error;

    const winner = submissions.reduce((prev, current) => {
      return (prev.vote_count > current.vote_count) ? prev : current;
    });

    // Update challenge status and notify users
    await supabase
      .from('challenges')
      .update({ is_active: false, winner_id: winner.id })
      .eq('id', challengeId);

    return { success: true, winner };
  } catch (error) {
    console.error('Error completing challenge:', error);
    return { success: false, error };
  }
}; 