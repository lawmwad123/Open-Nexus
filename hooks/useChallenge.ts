import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Challenge } from '@/types/challenge';

export const useChallenge = (challengeId?: string) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (challengeId) {
      fetchChallenge();
    }
  }, [challengeId]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('get_challenge_with_stats', { challenge_id: challengeId })
        .maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') {
          throw error;
        }
        setChallenge(null);
        return;
      }

      setChallenge(data as Challenge);
    } catch (err) {
      console.error('Error fetching challenge:', err);
      setError(err instanceof Error ? err.message : 'Error fetching challenge');
    } finally {
      setLoading(false);
    }
  };

  return {
    challenge,
    loading,
    error,
    refreshChallenge: fetchChallenge,
  };
}; 