import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';

interface ChallengeParticipant {
  id: string;
  user_id: string;
  content_url: string;
  content_type: string;
  vote_count: number;
  username: string;
  avatar_url?: string;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(
            id,
            username,
            avatar_url
          ),
          participants:challenge_participants_with_users(
            id,
            user_id,
            content_url,
            content_type,
            vote_count,
            username,
            avatar_url
          )
        `)
        .eq('is_challenge', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data?.map(challenge => ({
        ...challenge,
        participants: challenge.participants?.map((p: ChallengeParticipant) => ({
          id: p.id,
          user_id: p.user_id,
          content_url: p.content_url,
          content_type: p.content_type,
          vote_count: p.vote_count,
          user: {
            username: p.username,
            avatar_url: p.avatar_url
          }
        }))
      }));

      setChallenges(transformedData || []);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError(err instanceof Error ? err.message : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  return {
    challenges,
    loading,
    error,
    refetch: fetchChallenges
  };
}; 