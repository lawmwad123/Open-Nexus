import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { likePost, checkLikeStatus, getLikeCount } from '@/services/socialServices';

export const useLikes = (postId: string) => {
  const { userData } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userData?.id || !postId) return;
    
    const initializeLikeStatus = async () => {
      setLoading(true);
      setError(null);
      try {
        const [status, count] = await Promise.all([
          checkLikeStatus(postId),
          getLikeCount(postId)
        ]);
        setIsLiked(status);
        setLikeCount(count);
      } catch (err) {
        console.error('Error initializing like status:', err);
        setError(err instanceof Error ? err.message : 'Error checking like status');
      } finally {
        setLoading(false);
      }
    };

    initializeLikeStatus();
  }, [postId, userData?.id]);

  const toggleLike = async () => {
    if (!userData?.id || loading) return;

    setLoading(true);
    setError(null);

    // Optimistic update
    const previousIsLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);

    try {
      const newIsLiked = await likePost(postId);
      // If the server response doesn't match our optimistic update, sync with server
      if (newIsLiked !== !previousIsLiked) {
        setIsLiked(newIsLiked);
        const serverCount = await getLikeCount(postId);
        setLikeCount(serverCount);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError(err instanceof Error ? err.message : 'Error toggling like');
      // Revert optimistic update on error
      setIsLiked(previousIsLiked);
      setLikeCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  return {
    isLiked,
    likeCount,
    loading,
    error,
    toggleLike,
  };
}; 