import { View, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Post } from '@/types/post';
import { theme } from '@/constants/theme';
import PostItem from '@/components/PostItem';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import PostOptionsModal from '@/components/PostOptionsModal';
import AlertModal from './AlertModal';

interface PostDetailModalProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  onPostDeleted?: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  postId,
  visible,
  onClose,
  onPostDeleted
}) => {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchPost();
    }
  }, [postId, visible]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:user_id(
            id,
            username,
            avatar_url
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!post) return;

    try {
      setDeleting(true);
      setShowDeleteAlert(true);
    } catch (err) {
      console.error('Error deleting post:', err);
      setShowDeleteAlert(false);
    }
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      onPostDeleted?.();
      onClose();
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setDeleting(false);
      setShowOptions(false);
      setShowDeleteAlert(false);
    }
  };

  const isOwner = post?.user_id === user?.id;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.backButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </Pressable>
            {isOwner && (
              <Pressable onPress={() => setShowOptions(true)} style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : post ? (
            <PostItem post={post} isActive={true} />
          ) : null}

          <PostOptionsModal
            visible={showOptions}
            onClose={() => setShowOptions(false)}
            onDelete={handleDelete}
            deleting={deleting}
          />
        </View>
      </Modal>

      <AlertModal
        visible={showDeleteAlert}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            onPress: () => setShowDeleteAlert(false),
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: confirmDelete,
            style: 'destructive',
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  moreButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PostDetailModal; 