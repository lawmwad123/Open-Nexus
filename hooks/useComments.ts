import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getComments, 
  addComment as addCommentService,
  deleteComment as deleteCommentService,
  likeComment as likeCommentService,
} from '@/services/socialServices';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  is_liked?: boolean;
  user: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  parent?: {
    id: string;
    user: {
      id: string;
      username: string;
    };
  };
}

interface LikeResponse {
  success: boolean;
  data?: {
    is_liked: boolean;
    like_count: number;
  };
  error?: any;
}

export const useComments = (postId: string) => {
  const { userData } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getComments(postId);
      if (response.success) {
        setComments(response.data);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Error fetching comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, parentId?: string) => {
    if (!userData?.id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await addCommentService(postId, content);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to add comment');
      }

      // Add the new comment at the beginning of the list
      setComments(prevComments => [response.data, ...prevComments]);
      
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(err instanceof Error ? err.message : 'Error adding comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!userData?.id) return;

    try {
      setLoading(true);
      setError(null);
      await deleteCommentService(commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError(err instanceof Error ? err.message : 'Error deleting comment');
    } finally {
      setLoading(false);
    }
  };

  const likeComment = async (commentId: string) => {
    if (!userData?.id) return;

    const commentToUpdate = comments.find(c => c.id === commentId);
    if (!commentToUpdate) return;

    // Optimistic update
    const previousState = [...comments];
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          is_liked: !comment.is_liked,
          like_count: comment.is_liked ? comment.like_count - 1 : comment.like_count + 1
        };
      }
      return comment;
    }));

    try {
      const response = await likeCommentService(commentId);
      
      if (!response.success || !response.data) {
        // Revert on error
        setComments(previousState);
        return;
      }

      // Update with server response
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            is_liked: response.data.is_liked,
            like_count: response.data.like_count
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error('Error liking comment:', err);
      // Revert to previous state on error
      setComments(previousState);
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    likeComment,
    refreshComments: fetchComments
  };
}; 