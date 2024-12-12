import { useState } from 'react';
import { sharePost } from '@/services/socialServices';
import { Post } from '@/types/post';
import { useToast } from '@/contexts/ToastContext';

export const useShare = (post: Post) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { show: showToast } = useToast();

  const handleShare = async () => {
    if (isProcessing) {
      console.log('Share already in progress');
      return;
    }

    try {
      setLoading(true);
      setIsProcessing(true);
      setError(null);

      const response = await sharePost(post);
      
      if (!response.success) {
        throw new Error('Failed to share post');
      }

      if (response.data?.shared) {
        showToast('Post shared successfully!', 'success');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      setError(err instanceof Error ? err.message : 'Error sharing post');
      showToast('Failed to share post', 'error');
    } finally {
      setLoading(false);
      // Add a small delay before allowing next share
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    }
  };

  return {
    sharePost: handleShare,
    loading,
    error,
    isProcessing
  };
}; 